import random
import logging
import time

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.exceptions import ValidationError

from google.oauth2 import id_token
from google.auth.transport import requests

from core.permissions import IsAdminUserCustom, IsNormalUser, IsProviderUser
from .models import CustomUser
from .serializers import (
    UserSerializer, 
    SignupSerializer, 
    LoginSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer
)

logger = logging.getLogger(__name__)


# -----------------------------
# Google Login
# -----------------------------
class GoogleLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token_from_client = request.data.get("id_token")
        if not id_token_from_client:
            return Response({"error": "id_token required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify token with Google
            # clock_skew_in_seconds tolerates slight clock differences
            # between this server and Google's servers
            idinfo = id_token.verify_oauth2_token(
                id_token_from_client,
                requests.Request(),
                audience=settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60
            )

            email = idinfo.get("email")
            if not email:
                return Response({"error": "No email found in Google token"}, status=status.HTTP_400_BAD_REQUEST)

            full_name = idinfo.get("name", email.split("@")[0])
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")

            # Simple username generation from name: lower case, replace spaces with underscores
            base_username = full_name.replace(" ", "_").lower()

            user = CustomUser.objects.filter(email=email).first()

            if not user:
                # Handle username collision for new user
                username = base_username
                if CustomUser.objects.filter(username=username).exists():
                    username = f"{base_username}_{int(time.time())}"
                
                user = CustomUser.objects.create_user(
                    email=email,
                    username=username,
                    first_name=first_name,
                    last_name=last_name
                )
                created = True
            else:
                created = False
                # Update existing user info if blank (optional but good for data freshness)
                updated = False
                if not user.first_name and first_name:
                    user.first_name = first_name
                    updated = True
                if not user.last_name and last_name:
                    user.last_name = last_name
                    updated = True
                if updated:
                    user.save()

            if not user.is_active:
                return Response({"error": "Inactive user"}, status=status.HTTP_403_FORBIDDEN)

            if user.is_staff or user.is_superuser:
                return Response({
                    "error": "is-admin",
                    "message": "Admin accounts cannot log in here."
                }, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response({
                "user": UserSerializer(user).data,
                "access_token": access_token,
                "message": "Login successful via Google"
            }, status=status.HTTP_200_OK)

            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=False,  # True in production
                samesite="Lax",
                max_age=86400,
            )
            return response

        except ValueError as e:
            logger.error("Invalid Google token: %s", str(e))
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Google login error: %s", str(e))
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Register
# -----------------------------
import traceback

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data.get('userData', {}))
        if serializer.is_valid():
            user = serializer.save()
            
            # Send Welcome Email
            try:
                email_message = (
                    f"Hello {user.username},\n\n"
                    f"Welcome to HomeLift! We are excited to have you on board.\n\n"
                    f"Your account has been successfully created.\n"
                    f"You can now login and explore our services.\n\n"
                    f"Best regards,\n"
                    f"The HomeLift Team"
                )
                try:
                    send_mail(
                        subject="Your HomeLift OTP Code",
                        message=email_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                except Exception:
                    logger.error(traceback.format_exc())
                    raise
            except Exception as e:
                logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")

            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Send OTP (Updated to handle both signup and forgot password)
# -----------------------------

import socket
import traceback

class SendOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        print("\n" + "=" * 70)
        print("SEND OTP REQUEST STARTED")
        print("=" * 70)

        try:
            print(f"Request Data: {request.data}")

            email = request.data.get("email")
            purpose = request.data.get("purpose", "signup")

            print(f"Email: {email}")
            print(f"Purpose: {purpose}")

            if not email:
                print("ERROR: Email missing")
                return Response({"error": "Email is required"}, status=400)

            # Validation
            print("Checking user validation...")

            if purpose == "signup":
                exists = CustomUser.objects.filter(email=email).exists()
                print(f"User already exists: {exists}")

                if exists:
                    return Response(
                        {"error": "Email already registered"},
                        status=400
                    )

            if purpose == "forgot-password":
                exists = CustomUser.objects.filter(email=email).exists()
                print(f"User exists: {exists}")

                if not exists:
                    return Response(
                        {"error": "No account found with this email"},
                        status=400
                    )

            # OTP Generation
            print("Generating OTP...")
            otp = str(random.randint(100000, 999999))
            print(f"Generated OTP: {otp}")

            expiry_timestamp = time.time() + 300

            # Redis Cache Test
            print("Saving OTP to Redis...")
            cache_key = f"otp_{purpose}_{email}"

            cache.set(
                cache_key,
                otp,
                timeout=300
            )

            cached_otp = cache.get(cache_key)

            print(f"Redis Save Success: {cached_otp}")
            print(f"Redis Working: {cached_otp == otp}")

            # Email Content
            email_message = (
                f"Hello,\n\n"
                f"Your OTP code for HomeLift is: {otp}\n\n"
                f"This code will expire in 5 minutes.\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"Best regards,\n"
                f"The HomeLift Team"
            )

            # Email Config Debug
            print("\nEMAIL CONFIG")
            print("-" * 40)
            print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
            print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
            print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
            print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
            print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
            print("-" * 40)

            # DNS Test
            print("\nSTEP 1: Testing DNS Resolution")

            try:
                gmail_ip = socket.gethostbyname("smtp.gmail.com")
                print(f"DNS SUCCESS")
                print(f"smtp.gmail.com -> {gmail_ip}")
            except Exception:
                print("DNS FAILED")
                print(traceback.format_exc())
                raise

            # Socket Test
            print("\nSTEP 2: Testing Raw SMTP Socket Connection")

            try:
                sock = socket.create_connection(
                    ("smtp.gmail.com", 465),
                    timeout=10
                )

                print("SOCKET CONNECTION SUCCESS")
                sock.close()

            except Exception:
                print("SOCKET CONNECTION FAILED")
                print(traceback.format_exc())
                raise

            # Send Mail Test
            print("\nSTEP 3: Calling send_mail()")

            try:
                result = send_mail(
                    subject="Your HomeLift OTP Code",
                    message=email_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

                print(f"send_mail() returned: {result}")
                print("EMAIL SENT SUCCESSFULLY")

            except Exception:
                print("send_mail() FAILED")
                print(traceback.format_exc())
                raise

            print("\nREQUEST COMPLETED SUCCESSFULLY")
            print("=" * 70)

            return Response({
                "message": "OTP sent successfully",
                "expiry_timestamp": expiry_timestamp
            }, status=200)

        except Exception as e:

            print("\n" + "=" * 70)
            print("FATAL ERROR OCCURRED")
            print(f"Exception Type: {type(e)}")
            print(f"Exception: {str(e)}")
            print(traceback.format_exc())
            print("=" * 70 + "\n")

            logger.error(traceback.format_exc())

            return Response(
                {
                    "error": str(e),
                    "exception_type": str(type(e))
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# -----------------------------
# Verify OTP
# -----------------------------
class VerifyOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.debug('VerifyOtpView: request data for OTP verification: %s', request.data)
        email = request.data.get("email")
        otp = request.data.get("otp")
        purpose = request.data.get("purpose", "signup")

        key = f"otp_{purpose}_{email}"
        cached_otp = cache.get(key)

        logger.debug('VerifyOtpView: cached=%s received=%s', bool(cached_otp), bool(otp))

        if not cached_otp or str(cached_otp) != str(otp):
            return Response({"error": "Invalid or expired OTP"}, status=400)

        cache.set(
            f"otp_verified_{purpose}_{email}",
            True,
            timeout=300
        )
        # cache.delete(key) # Do not delete here, needed for final signup request

        return Response({"message": "OTP verified"}, status=200)



# -----------------------------
# User Login
# -----------------------------
class UserLogin(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']

            if user.is_staff or user.is_superuser:
                return Response(
                    {"error": "is-admin", "message": "Admin accounts cannot log in here. Use the admin login instead."},
                    status=status.HTTP_403_FORBIDDEN
                )

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response({
                "user": UserSerializer(user).data,
                "access_token": access_token,
                "message": "Login successful"
            }, status=status.HTTP_200_OK)

            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=False,  # Change to True in production
                samesite="Lax",
                max_age=86400,
            )
            return response

        except ValidationError:
            raise
        except Exception as e:
            logger.error("Login error: %s", str(e))
            return Response({"error": "internal-error", "message": "Unexpected error. Try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------
# Refresh Token
# -----------------------------
class RefreshtokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token not found"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            return Response({"access": str(token.access_token), "message": "Token refreshed successfully"}, status=status.HTTP_200_OK)

        except TokenError as e:
            return Response({"error": "invalid-token", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Token refresh error: %s", str(e))
            return Response({"error": "internal-error", "message": "Unexpected error. Try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------
# Logout
# -----------------------------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token not found"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
            response.delete_cookie("refresh")
            return response

        except TokenError as e:
            return Response({"error": "invalid-token", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Logout error: %s", str(e))
            return Response({"error": "internal-error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------
# Reset Password (Forgot Password Flow)
# -----------------------------
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password reset successfully. Please login."},
                status=200
            )
        return Response(serializer.errors, status=400)

# -----------------------------
# Change Password (Authenticated Users)
# -----------------------------

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = ChangePasswordSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                
                # Optional: Blacklist old refresh tokens for security
                try:
                    refresh_token = request.COOKIES.get("refresh")
                    if refresh_token:
                        token = RefreshToken(refresh_token)
                        token.blacklist()
                except:
                    pass
                
                return Response(
                    {"message": "Password changed successfully. Please login again."},
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Change password error for user {request.user.id}: {str(e)}")
            return Response(
                {"error": "internal-error", "message": "Failed to change password. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -----------------------------
# Profile Update
# -----------------------------
class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Fetch current user profile data"""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Full update of profile"""
        try:
            user = request.user
            logger.debug("Profile Update PUT request for user %s", user.id)
            logger.debug("Request Data: %s", request.data)
            
            serializer = UserSerializer(user, data=request.data, partial=False, context={'request': request})
            if serializer.is_valid():
                logger.debug('ProfileUpdateView: PUT serializer valid, saving for user %s', user.id)
                serializer.save()
                return Response(
                    {"message": "Profile updated successfully", "user": serializer.data},
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Profile PUT error for user {request.user.id}: {str(e)}")
            return Response(
                {"error": "internal-error", "message": "Unexpected error while updating profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request):
        """Partial update (e.g. only phone)"""
        try:
            user = request.user
            logger.debug("Profile Update PATCH request for user %s", user.id)
            logger.debug("Request Data: %s", request.data)
            
            data = request.data.copy()
            # Prevent accidental deletion if frontend sends empty profile_picture
            if 'profile_picture' in data and not hasattr(data['profile_picture'], 'file'):
                data.pop('profile_picture', None)
            
            serializer = UserSerializer(user, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                logger.debug('ProfileUpdateView: PATCH serializer valid, saving for user %s', user.id)
                serializer.save()
                return Response(
                    {"message": "Profile updated successfully", "user": serializer.data},
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Profile PATCH error for user {request.user.id}: {str(e)}")
            return Response(
                {"error": "internal-error", "message": "Unexpected error while updating profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# -----------------------------
# Admin User Management
# -----------------------------
class UserManageView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        from core.pagination import StandardResultsSetPagination
        from django.db.models import Q
        
        users = CustomUser.objects.filter(is_staff=False).order_by('-id')
        
        # Search functionality
        search_query = request.query_params.get('search')
        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(phone_number__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )

        # Status filter (active / inactive)
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            users = users.filter(is_active=True)
        elif status_filter == 'inactive':
            users = users.filter(is_active=False)

        paginator = StandardResultsSetPagination()
        result_page = paginator.paginate_queryset(users, request)
        serializer = UserSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def patch(self, request, pk=None):
        user = get_object_or_404(CustomUser, id=pk, is_staff=False, is_provider=False)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
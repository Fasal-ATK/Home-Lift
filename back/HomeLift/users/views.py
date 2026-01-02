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
            idinfo = id_token.verify_oauth2_token(
                id_token_from_client,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            email = idinfo.get("email")
            if not email:
                return Response({"error": "No email found in Google token"}, status=status.HTTP_400_BAD_REQUEST)

            user, created = CustomUser.objects.get_or_create(email=email, defaults={
                "username": email.split("@")[0]
            })

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
                send_mail(
                    subject="Welcome to HomeLift!",
                    message=email_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")

            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Send OTP (Updated to handle both signup and forgot password)
# -----------------------------
class SendOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(f'Request data: {request.data}')
        email = request.data.get("email")
        purpose = request.data.get("purpose", "signup") 

        if not email:
            return Response({"error": "Email is required"}, status=400)

        if purpose == "signup":
            if CustomUser.objects.filter(email=email).exists():
                return Response({"error": "Email already registered"}, status=400)

        if purpose == "forgot-password":
            if not CustomUser.objects.filter(email=email).exists():
                return Response({"error": "No account found with this email"}, status=400)

        otp = str(random.randint(100000, 999999))
        print(otp)

        expiry_timestamp = time.time() + 300
        cache.set(
            f"otp_{purpose}_{email}",
            otp,
            timeout=300
        )
        email_message = (
            f"Hello,\n\n"
            f"Your OTP code for HomeLift is: {otp}\n\n"
            f"This code will expire in 5 minutes.\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Best regards,\n"
            f"The HomeLift Team"
        )

        send_mail(
            subject="Your HomeLift OTP Code",
            message=email_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({
            "message": "OTP sent successfully", 
            "expiry_timestamp": expiry_timestamp
        }, status=200)


# -----------------------------
# Verify OTP
# -----------------------------
class VerifyOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print('Request data for OTP verification:', request.data)
        email = request.data.get("email")
        otp = request.data.get("otp")
        purpose = request.data.get("purpose", "signup")

        key = f"otp_{purpose}_{email}"
        cached_otp = cache.get(key)

        print("CACHED OTP:", cached_otp)
        print("RECEIVED OTP:", otp)

        if not cached_otp or str(cached_otp) != str(otp):
            return Response({"error": "Invalid or expired OTP"}, status=400)

        cache.set(
            f"otp_verified_{purpose}_{email}",
            True,
            timeout=300
        )
        cache.delete(key)

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
    
    def put(self, request):
        """Full update of profile"""
        try:
            user = request.user
            serializer = UserSerializer(user, data=request.data, partial=False)
            if serializer.is_valid():
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
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
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
        users = CustomUser.objects.filter(is_staff=False)
        return Response(UserSerializer(users, many=True).data, status=status.HTTP_200_OK)

    def patch(self, request, pk=None):
        user = get_object_or_404(CustomUser, id=pk, is_staff=False, is_provider=False)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
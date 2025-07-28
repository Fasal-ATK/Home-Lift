import random
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.exceptions import ValidationError

from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth import login, logout

from .serializers import UserSerializer, SignupSerialzer, LoginSerializer
from .models import CustomUser


logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerialzer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User Registered Successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        cache.set(f"otp_{email}", otp, timeout=300)  # OTP 5-minute expiry

        send_mail(
            subject="Your OTP Code",
            message=f"Your OTP is: {otp}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)


class VerifyOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(f"otp_{email}")

        if cached_otp == otp:
            cache.delete(f"otp_{email}")  # Clean up used OTP
            return Response({"message": "OTP Verified"}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)


class UserLogin(APIView):
    print("UserLogin view initialized")
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data.get('user')
            if not user:
                return Response({
                    "error": "invalid-credentials",
                    "message": "Unable to log in with provided credentials."
                }, status=status.HTTP_400_BAD_REQUEST)

            login(request, user)
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response({
                'user': UserSerializer(user).data,
                'access': access_token,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)

            # ✅ Cookie set (JWT refresh token)
            response.set_cookie(
                key='refresh',
                value=str(refresh),
                httponly=True,
                secure=False,   # True if using HTTPS
                samesite='Lax',
                max_age=86400,
            )
            print("User logged in successfully")
            return response

        except ValidationError as ve:
            raise ve

        except Exception as e:
            logger.error("Login error: %s", str(e))
            return Response({
                "error": "internal-error",
                "message": "Unexpected error. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshtokenView(APIView):
    permission_classes = [IsAuthenticated]
    

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            access_token = str(token.access_token)

            return Response({
                'access': access_token,
                'message': 'Token refreshed successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Token refresh error: %s", str(e))
            return Response({
                "error": "internal-error",
                "message": "Unexpected error. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 



class LogoutView(APIView):
    print("Logout view initialized")
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            print("Processing logout request")
            print(f'request.headers: {request.headers}')
            refresh_token = request.COOKIES.get('refresh')
            if refresh_token is None:
                return Response({'detail': 'Refresh token not found in cookies.'}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            response = Response({'detail': 'Logout successful'}, status=status.HTTP_200_OK)
            response.delete_cookie('refresh')  # Clear the cookie on logout
            print("User logged out successfully")
            return response

        except TokenError as e:
            return Response({'detail': 'Invalid or expired token', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': 'Logout failed', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


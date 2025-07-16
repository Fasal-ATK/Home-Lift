from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, SignupSerialzer, LoginSerializer
from .models import CustomUser
import random
from django.contrib.auth import login, logout
import logging
from rest_framework.exceptions import ValidationError

# ✅ NEW IMPORT for CSRF view
# from django.views.decorators.csrf import ensure_csrf_cookie
# from django.http import JsonResponse
# from django.utils.decorators import method_decorator

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
        request.session['otp'] = otp
        request.session['otp_email'] = email
        request.session.set_expiry(300)  # 5 minutes

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
        session_otp = request.session.get('otp')
        session_email = request.session.get('otp_email')

        if session_otp == otp and session_email == email:
            return Response({"message": "OTP Verified"}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)


from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.utils.decorators import method_decorator


# @method_decorator(ensure_csrf_cookie, name='dispatch')
# class GetCSRFToken(APIView):
#     permission_classes = [AllowAny]

#     def get(self, request):
#         return JsonResponse({'message': 'CSRF cookie set'})

from django.views.decorators.csrf import csrf_exempt

# @method_decorator(csrf_exempt, name='dispatch')
# class UserLogin(APIView):
#     print("UserLogin view initialized")
#     permission_classes = [AllowAny]

#     def post(self, request):
#         try:
#             serializer = LoginSerializer(data=request.data)
#             serializer.is_valid(raise_exception=True)
#             user = serializer.validated_data.get('user')
#             if not user:
#                 return Response({
#                     "error": "invalid-credentials",
#                     "message": "Unable to log in with provided credentials."
#                 }, status=status.HTTP_400_BAD_REQUEST)

#             login(request, user)
#             refresh = RefreshToken.for_user(user)
#             access_token = str(refresh.access_token)

#             response = Response({
#                 'user': UserSerializer(user).data,
#                 'access': access_token,
#                 'refresh': str(refresh),
#                 'message': 'Login successful'
#             }, status=status.HTTP_200_OK)

#             # ✅ Cookie set (JWT refresh token)
#             response.set_cookie(
#                 key='refresh',
#                 value=str(refresh),
#                 httponly=True,
#                 secure=False,   # True if using HTTPS
#                 samesite='Lax',
#                 max_age=86400,
#             )

#             return response

#         except ValidationError as ve:
#             raise ve

#         except Exception as e:
#             logger.error("Login error: %s", str(e))
#             return Response({
#                 "error": "internal-error",
#                 "message": "Unexpected error. Please try again later."
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserLogin(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = CustomUser.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'username': user.username,
                'email': user.email
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
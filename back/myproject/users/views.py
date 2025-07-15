from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate,get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import random
from .serializers import SignupSerialzer
from .models import CustomUser



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
        request.session.set_expiry(300)  # Expires in 5 minutes

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

User = get_user_model()

class UserLogin(APIView):
    print('reached')
    permission_classes = [AllowAny]

    def post(self, request):
        print('post')
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist"}, status=status.HTTP_404_NOT_FOUND)

class testView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        print('accepted')
        return request('Hello World') 
# import random
# import logging

# from django.conf import settings
# from django.core.cache import cache
# from django.core.mail import send_mail
# from django.shortcuts import get_object_or_404

# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework_simplejwt.tokens import RefreshToken, TokenError

# from google.oauth2 import id_token
# from google.auth.transport import requests

# from users.models import CustomUser

# logger = logging.getLogger(__name__)

# # Create your views here.
# class VerifyOtpView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")
#         if not email or not otp:
#             return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

#         cached_otp = cache.get(f"otp_{email}")
#         if cached_otp == otp:
#             cache.delete(f"otp_{email}")
#             return Response({"message": "OTP verified"}, status=status.HTTP_200_OK)

#         return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
    


# class SendOtpView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         if not email:
#             return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

#         if CustomUser.objects.filter(email=email).exists():
#             return Response({"error": "Email is already registered"}, status=status.HTTP_400_BAD_REQUEST)

#         otp = str(random.randint(100000, 999999))
#         print(otp)
#         cache.set(f"otp_{email}", otp, timeout=300)  # 5 minutes

#         send_mail(
#             subject="Your OTP Code",
#             message=f"Your OTP is: {otp}",
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             recipient_list=[email],
#         )
#         return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)


# class RefreshtokenView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         try:
#             refresh_token = request.COOKIES.get("refresh")
#             if not refresh_token:
#                 return Response({"error": "Refresh token not found"}, status=status.HTTP_400_BAD_REQUEST)

#             token = RefreshToken(refresh_token)
#             return Response({"access": str(token.access_token), "message": "Token refreshed successfully"}, status=status.HTTP_200_OK)

#         except TokenError as e:
#             return Response({"error": "invalid-token", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             logger.error("Token refresh error: %s", str(e))
#             return Response({"error": "internal-error", "message": "Unexpected error. Try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import Address
from .serializers import AddressSerializer


class AddressListCreateView(APIView):
    """
    Handles:
    - GET /user/address/ → List all user addresses
    - POST /user/address/ → Create a new address
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user=request.user)
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AddressSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    """
    Handles:
    - GET /user/address/<id>/ → Retrieve single address
    - PATCH /user/address/<id>/ → Update address
    - DELETE /user/address/<id>/ → Delete address
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Address, pk=pk, user=user)

    def get(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = AddressSerializer(address)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = AddressSerializer(address, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        address = self.get_object(pk, request.user)
        address.delete()
        return Response({"message": "Address deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


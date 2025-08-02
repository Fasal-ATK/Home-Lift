from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from users.serializers import UserSerializer  
from .serializers import AdminLoginSerializer   


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        response = Response({
            'user': UserSerializer(user).data,
            'access_token': access,
            'message': 'Admin login successful'
        }, status=status.HTTP_200_OK)

        response.set_cookie(
            key='refresh',
            value=str(refresh),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=86400,
        )
        print('Admin login successful for user')
        return response




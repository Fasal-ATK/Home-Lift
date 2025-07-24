from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from users.serializers import UserSerializer  
from .serializers import AdminLoginSerializer  
from users.models import CustomUser  


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        response = Response({
            'access': access,
            'user': UserSerializer(user).data,
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


class LogoutView(APIView):
    print("Logout view initialized")
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            print(f'request.headers: {request.headers}')
            refresh_token = request.COOKIES.get('refresh')
            if refresh_token is None:
                return Response({'detail': 'Refresh token not found in cookies.'}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            response = Response({'detail': 'Logout successful'}, status=status.HTTP_200_OK)
            response.delete_cookie('refresh')  # Clear the cookie on logout
            return response

        except TokenError as e:
            return Response({'detail': 'Invalid or expired token', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': 'Logout failed', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

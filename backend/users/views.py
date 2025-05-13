from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignupSerialzer
from rest_framework.permissions import AllowAny

# Create your views here.

class RegisterView(APIView):
    permission_classes=[AllowAny]
    def post(self,request):
        serializer = SignupSerialzer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            print('user Created')
            return Response({'message':'User Registered Successfully'},status=status.HTTP_201_CREATED)
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
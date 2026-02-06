from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Wallet
from .serializers import WalletSerializer

class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

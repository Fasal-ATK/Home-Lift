from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Wallet
from .serializers import WalletSerializer

class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet_type = request.query_params.get('type', 'user')
        if wallet_type not in dict(Wallet.WALLET_TYPES):
            return Response({'detail': 'Invalid wallet type.'}, status=status.HTTP_400_BAD_REQUEST)
            
        wallet, created = Wallet.objects.get_or_create(
            user=request.user, 
            wallet_type=wallet_type
        )
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

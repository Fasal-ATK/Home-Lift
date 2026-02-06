from rest_framework import serializers
from .models import Wallet, WalletTransaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['id', 'transaction_id', 'amount', 'transaction_type', 'status', 'description', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'recent_transactions']

    def get_recent_transactions(self, obj):
        transactions = obj.transactions.all().order_by('-created_at')[:10]
        return TransactionSerializer(transactions, many=True).data

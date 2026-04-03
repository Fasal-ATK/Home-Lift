from django.urls import path
from .views import (
    WalletView, 
    WalletWithdrawalView, 
    StripeConnectLinkView,
    AdminWithdrawalListView,
    AdminWithdrawalActionView
)

urlpatterns = [
    path('', WalletView.as_view(), name='wallet-detail'),
    path('withdraw/', WalletWithdrawalView.as_view(), name='wallet-withdraw'),
    path('stripe-connect/', StripeConnectLinkView.as_view(), name='stripe-connect'),
    
    # Admin Withdrawal Endpoints
    path('admin/withdrawals/', AdminWithdrawalListView.as_view(), name='admin-withdrawals'),
    path('admin/withdrawals/<int:pk>/action/', AdminWithdrawalActionView.as_view(), name='admin-withdrawals-action'),
]

from django.urls import path
from .views import WalletView, WalletWithdrawalView, StripeConnectLinkView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet-detail'),
    path('withdraw/', WalletWithdrawalView.as_view(), name='wallet-withdraw'),
    path('stripe-connect/', StripeConnectLinkView.as_view(), name='stripe-connect'),
]

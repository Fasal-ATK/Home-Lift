from django.urls import path
from .views import WalletView, WalletWithdrawalView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet-detail'),
    path('withdraw/', WalletWithdrawalView.as_view(), name='wallet-withdraw'),
]

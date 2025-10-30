# from .views import VerifyOtpView, SendOtpView, RefreshtokenView

# core/urls/addresses.py
from django.urls import path
from .views import AddressListCreateView, AddressDetailView

urlpatterns = [
    path('addresses/', AddressListCreateView.as_view(), name='address-list-create'),
    path('address/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
]


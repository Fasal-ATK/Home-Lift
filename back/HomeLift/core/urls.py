# from .views import VerifyOtpView, SendOtpView, RefreshtokenView

# core/urls/addresses.py
from django.urls import path
from .views import (
    AddressListCreateView, AddressDetailView,
    TicketListCreateView, TicketDetailView,
    AdminTicketListView, AdminTicketReplyView,
)

urlpatterns = [
    path('addresses/', AddressListCreateView.as_view(), name='address-list-create'),
    path('address/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    # Tickets
    path('tickets/', TicketListCreateView.as_view(), name='ticket-list-create'),
    path('tickets/<int:pk>/', TicketDetailView.as_view(), name='ticket-detail'),
    path('admin/tickets/', AdminTicketListView.as_view(), name='admin-ticket-list'),
    path('admin/tickets/<int:pk>/reply/', AdminTicketReplyView.as_view(), name='admin-ticket-reply'),
]

from django.urls import path
from .views import AdminOfferListCreateView, AdminOfferDetailUpdateDeleteView

urlpatterns = [
    path('admin/all/', AdminOfferListCreateView.as_view(), name='admin-offer-list-create'),
    path('admin/<int:pk>/', AdminOfferDetailUpdateDeleteView.as_view(), name='admin-offer-detail-update-delete'),
]

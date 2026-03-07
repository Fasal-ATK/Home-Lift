from django.urls import path
from .views import AdminOfferListCreateView, AdminOfferDetailUpdateDeleteView, PublicOfferListView

urlpatterns = [
    path('admin/all/', AdminOfferListCreateView.as_view(), name='admin-offer-list-create'),
    path('admin/<int:pk>/', AdminOfferDetailUpdateDeleteView.as_view(), name='admin-offer-detail-update-delete'),
    path('public/', PublicOfferListView.as_view(), name='public-offer-list'),
]

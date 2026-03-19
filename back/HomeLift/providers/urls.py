from django.urls import path,include
from .views import (
    ProviderApplicationCreateAPIView,
    ProviderApplicationStatusView,

    ProviderApplicationListAPIView,
    ProviderApplicationUpdateStatusAPIView,

    ProviderDetailAPIView,
    ProvidersListAPIView,
    ProviderMeView,

    ProviderDetailAPIView,
    ProvidersListAPIView,
    ProviderMeView,

    ProviderMyServiceRequestsView,
    ProviderMyServiceRequestDetailView,
    ProviderMyServiceDetailView,
    AdminServiceRequestListView,
    AdminServiceRequestActionView,
)

urlpatterns = [
    path('apply/', ProviderApplicationCreateAPIView.as_view()),
    path('status/', ProviderApplicationStatusView.as_view()),
    path('me/', ProviderMeView.as_view()),

    # Provider self-manage services
    path('my-services/<int:pk>/', ProviderMyServiceDetailView.as_view()),
    path('my-service-requests/', ProviderMyServiceRequestsView.as_view()),
    path('my-service-requests/<int:pk>/', ProviderMyServiceRequestDetailView.as_view()),

    path('jobs/',include('bookings.urls')),

    # Admin
    path('applications/', ProviderApplicationListAPIView.as_view()),  
    path('update-applications/<int:id>/', ProviderApplicationUpdateStatusAPIView.as_view()),  
    path('list/', ProvidersListAPIView.as_view()),
    path('update/<int:id>/', ProviderDetailAPIView.as_view()),

    path('service-requests/', AdminServiceRequestListView.as_view()),
    path('service-requests/<int:pk>/action/', AdminServiceRequestActionView.as_view()),
]



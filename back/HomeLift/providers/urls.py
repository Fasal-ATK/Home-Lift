from django.urls import path,include
from .views import (
    ProviderApplicationCreateAPIView,
    ProviderApplicationStatusView,

    ProviderApplicationListAPIView,
    ProviderApplicationUpdateStatusAPIView,

    ProviderDetailAPIView,
    ProvidersListAPIView,
)

urlpatterns = [
    path('apply/', ProviderApplicationCreateAPIView.as_view()),
    path('status/', ProviderApplicationStatusView.as_view()),

    path('jobs/',include('bookings.urls')),

    # Admin
    path('applications/', ProviderApplicationListAPIView.as_view()),  
    path('update-applications/<int:id>/', ProviderApplicationUpdateStatusAPIView.as_view()),  
    path('list/', ProvidersListAPIView.as_view()),
    path('update/<int:id>/', ProviderDetailAPIView.as_view())
]


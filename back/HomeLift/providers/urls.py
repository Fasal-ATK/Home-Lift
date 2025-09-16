from django.urls import path
from .views import (
    ProviderApplicationCreateAPIView,
    ProviderApplicationListAPIView,
    ProviderApplicationUpdateStatusAPIView
)

urlpatterns = [
    path('apply/', ProviderApplicationCreateAPIView.as_view(), name='provider-apply'),
    path('my-applications/', ProviderApplicationListAPIView.as_view(), name='my-applications'),
    path('application/<int:id>/update/', ProviderApplicationUpdateStatusAPIView.as_view(), name='admin-application-update'),
]

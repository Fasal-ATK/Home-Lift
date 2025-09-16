#admins/urls.py
from django.urls import path,include
from .views import AdminLoginView

urlpatterns = [
    path('login/', AdminLoginView.as_view() ),
    
    path('services/',include('services.urls')),
    path('customers/',include('users.urls')),
    path('providers/',include('providers.urls')),
]

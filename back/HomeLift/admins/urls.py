#admins/urls.py
from django.urls import path,include
from .views import AdminLoginView
from bookings.views import AdminBookingsView, BookingStatusUpdateView

urlpatterns = [
    path('login/', AdminLoginView.as_view() ),
    
    path('services/',include('services.urls')),
    path('customers/',include('users.urls')),
    path('providers/',include('providers.urls')),
    path('offers/', include('offers.urls')),
    path('bookings/all/', AdminBookingsView.as_view()),
    path('bookings/<int:pk>/status/', BookingStatusUpdateView.as_view()),
]

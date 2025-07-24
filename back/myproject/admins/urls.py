from django.urls import path
from .views import AdminLoginView, LogoutView

urlpatterns = [
    path('login/', AdminLoginView.as_view() ),
    path('logout/', LogoutView.as_view() ),
]
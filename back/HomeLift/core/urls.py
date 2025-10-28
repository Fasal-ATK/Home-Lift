from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AddressViewSet

# from .views import VerifyOtpView, SendOtpView, RefreshtokenView

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    # Mount router under its own clear path
    path('addresses/', include(router.urls)),

    # path('send-otp/', SendOtpView.as_view()),
    # path('verify-otp/', VerifyOtpView.as_view()),
    # path('token/refresh/', RefreshtokenView.as_view()),
]

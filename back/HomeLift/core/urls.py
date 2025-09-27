from django.urls import path
from .views import VerifyOtpView, SendOtpView

urlpatterns = [
    path('send-otp/', SendOtpView.as_view()),
    path('verify-otp/', VerifyOtpView.as_view()),
    path('token/refresh/', RefreshtokenView.as_view()),
]

from django.urls import path
from .views import RegisterView, SendOtpView, VerifyOtpView, UserLogin  ,testView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('send-otp/', SendOtpView.as_view()),
    path('verify-otp/', VerifyOtpView.as_view()),
    path('login/', UserLogin.as_view()),  
    path('smaple/', testView.as_view()),  
]

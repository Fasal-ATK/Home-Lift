from django.urls import path
from .views import RegisterView, SendOtpView, VerifyOtpView, UserLogin #etCSRFToken # get_csrf_token
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('send-otp/', SendOtpView.as_view()),
    path('verify-otp/', VerifyOtpView.as_view()),
    path('login/', UserLogin.as_view()),  
    # path('csrf/', GetCSRFToken.as_view(), name='get_csrf_token'),
    # path('csrf/', get=GetCSRFToken.as_view()),  
]

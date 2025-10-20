from django.urls import path,include
from .views import RegisterView, SendOtpView, VerifyOtpView, UserLogin, LogoutView, RefreshtokenView, UserManageView,GoogleLoginAPIView,ProfileUpdateView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('send-otp/', SendOtpView.as_view()),
    path('verify-otp/', VerifyOtpView.as_view()),
    path('token/refresh/', RefreshtokenView.as_view()),
    path('login/', UserLogin.as_view()),  
    path('logout/', LogoutView.as_view() ),

    path('notifications/', include('notifications.urls')),
    path('booking/', include('bookings.urls')),

    path('google-auth/', GoogleLoginAPIView.as_view(), name='google-login'),

    path('profile/update/', ProfileUpdateView.as_view()),
    
    # admin user management 
    path('manage/', UserManageView.as_view()),
    path('manage/<int:pk>/', UserManageView.as_view()) 

]
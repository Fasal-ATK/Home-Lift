# payments/urls.py
from django.urls import path,include
from .views import CreatePaymentIntent

urlpatterns = [
path("create-payment-intent/", CreatePaymentIntent.as_view()),
]
from django.urls import path
from .views import BookingListCreateView, BookingDetailUpdateView

urlpatterns = [
    #user
    path('', BookingListCreateView.as_view()),
    path('update/<int:pk>/', BookingDetailUpdateView.as_view()),

    #admin

]

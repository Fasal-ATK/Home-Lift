from django.urls import path
from .views import BookingListCreateView, BookingDetailUpdateView

urlpatterns = [
    #user
    path('', BookingListCreateView.as_view()),
    path('details/<int:pk>/', BookingDetailUpdateView.as_view()),

    #admin

]

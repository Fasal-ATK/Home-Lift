from django.urls import path
from .views import (
    BookingListCreateView,
    ProviderBookingsView,
    ProviderPendingBookingsView,
    ProviderAcceptBookingView,
    AdminBookingsView,
    BookingDetailUpdateView,
    BookingStatusUpdateView,
)

urlpatterns = [

    path("", BookingListCreateView.as_view(), name="booking-list-create"),

    path("details/<int:pk>/", BookingDetailUpdateView.as_view(), name="booking-detail"),

    path("<int:pk>/status/", BookingStatusUpdateView.as_view(), name="booking-status-update"),

    # -------------------------
    # PROVIDER ROUTES
    # -------------------------
    path("appointments/", ProviderBookingsView.as_view(), name="provider-bookings"),
    path("appointments/pending/", ProviderPendingBookingsView.as_view(), name="provider-pending-bookings"),
    path("appointments/<int:pk>/accept/", ProviderAcceptBookingView.as_view(), name="provider-accept-booking"),

    # -------------------------
    # ADMIN ROUTES
    path("admin/all/", AdminBookingsView.as_view(), name="admin-bookings"),
]

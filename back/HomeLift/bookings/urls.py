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

    # -------------------------
    # USER ROUTES
    # -------------------------
    # GET   /bookings/        → list user's bookings
    # POST  /bookings/        → create booking
    path("", BookingListCreateView.as_view(), name="booking-list-create"),

    # GET   /bookings/<pk>/   → get specific booking (owner / provider / admin)
    # DELETE /bookings/<pk>/  → cancel booking (owner / provider / admin)
    path("<int:pk>/", BookingDetailUpdateView.as_view(), name="booking-detail"),

    # -------------------------
    # BOOKING STATUS UPDATE
    # -------------------------
    # PATCH /bookings/<pk>/status/
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

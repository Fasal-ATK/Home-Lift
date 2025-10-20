from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'service',
        'provider',
        'booking_date',
        'booking_time',
        'status',
        'price',
        'advance',
        'created_at',
    )
    list_filter = (
        'status',
        'booking_date',
        'created_at',
        'provider',
    )
    search_fields = (
        'user__email',
        'user__username',
        'service__name',
        'full_name',
        'phone',
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'advance')

    fieldsets = (
        ('Booking Details', {
            'fields': (
                'user',
                'service',
                'provider',
                'status',
            )
        }),
        ('Customer Info', {
            'fields': (
                'full_name',
                'phone',
                'address',
                'notes',
            )
        }),
        ('Appointment', {
            'fields': (
                ('booking_date', 'booking_time'),
            )
        }),
        ('Payment', {
            'fields': (
                'price',
                'advance',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )

    def get_queryset(self, request):
        """Optimize queryset for related fields."""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'service', 'provider')

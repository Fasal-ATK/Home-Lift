from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    service_name = serializers.ReadOnlyField(source='service.name')
    provider_name = serializers.ReadOnlyField(source='provider.username')

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'service', 'service_name', 'provider', 'provider_name',
            'full_name', 'phone', 'address', 'notes',
            'booking_date', 'booking_time',
            'status', 'price', 'advance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('advance', 'created_at', 'updated_at')

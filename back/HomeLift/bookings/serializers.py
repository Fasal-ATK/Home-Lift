from rest_framework import serializers
from .models import Booking
from core.models import Address
from core.serializers import AddressSerializer  # import your existing serializer


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    service_name = serializers.ReadOnlyField(source='service.name')
    provider_name = serializers.ReadOnlyField(source='provider.username')
    address = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(), write_only=True
    )
    address_details = AddressSerializer(source='address', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user',
            'service', 'service_name',
            'provider', 'provider_name',
            'full_name', 'phone',
            'address', 'address_details',  # include both for flexibility
            'notes', 'booking_date', 'booking_time',
            'status', 'price', 'advance',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('advance', 'created_at', 'updated_at')

    def validate_address(self, address):
        """Ensure the selected address belongs to the current user."""
        user = self.context['request'].user
        if address.user != user:
            raise serializers.ValidationError("You can only use your own saved addresses.")
        return address

    def create(self, validated_data):
        """Attach user automatically before creation."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

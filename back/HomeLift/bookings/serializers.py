from rest_framework import serializers
from .models import Booking
from core.models import Address
from core.serializers import AddressSerializer  # import your existing serializer


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    service_name = serializers.ReadOnlyField(source='service.name')
    provider_name = serializers.ReadOnlyField(source='provider.username')
    address = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(), write_only=True, required=False, allow_null=True
    )
    address_details = AddressSerializer(source='address', read_only=True)
    service_description = serializers.ReadOnlyField(source='service.description')
    service_image = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='service.category.name')
    user_email = serializers.SerializerMethodField()
    provider_contact = serializers.SerializerMethodField()
    customer_contact = serializers.SerializerMethodField()

    # helpful flags for front-end
    is_owner = serializers.SerializerMethodField(read_only=True)
    is_assigned_to_user = serializers.SerializerMethodField(read_only=True)
    remaining_payment = serializers.SerializerMethodField(read_only=True)
    is_fully_paid = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user',
            'service', 'service_name',
            'provider', 'provider_name',
            'full_name', 'phone',
            'address', 'address_details',
            'notes', 'booking_date', 'booking_time',
            'status', 'price', 'advance', 'remaining_payment',
            'is_advance_paid', 'is_fully_paid', 'is_refunded',
            'created_at', 'updated_at',
            # UI helpers
            'is_owner', 'is_assigned_to_user',
            # Enriched data
            'service_description', 'service_image', 'category_name',
            'provider_contact', 'user_email', 'customer_contact',
        ]
        read_only_fields = ('advance', 'created_at', 'updated_at', 'is_owner', 'is_assigned_to_user', 'is_refunded', 'remaining_payment')

    def get_remaining_payment(self, obj):
        if obj.price and obj.advance:
            return obj.price - obj.advance
        return obj.price or 0

    def get_is_fully_paid(self, obj):
        # 1. Check if price matches advance (edge case)
        if obj.price and obj.advance and (obj.price - obj.advance) <= 0:
             return obj.is_advance_paid
        
        # 2. Check if there's a successful payment of type 'remaining'
        # We import here to avoid circular dependency
        from payments.models import Payment
        return Payment.objects.filter(
            booking=obj, 
            status='succeeded', 
            metadata__payment_type='remaining'
        ).exists()

    def get_is_owner(self, obj):
        request = self.context.get('request', None)
        if not request or not getattr(request, "user", None):
            return False
        return bool(obj.user_id == request.user.id)

    def get_is_assigned_to_user(self, obj):
        request = self.context.get('request', None)
        if not request or not getattr(request, "user", None):
            return False
        return bool(obj.provider_id == request.user.id)

    def validate_address(self, address):
        """Ensure the selected address belongs to the current user."""
        user = self.context['request'].user
        if address and address.user != user:
            raise serializers.ValidationError("You can only use your own saved addresses.")
        return address

    def get_service_image(self, obj):
        request = self.context.get('request')
        if obj.service.icon:
            return request.build_absolute_uri(obj.service.icon.url) if request else obj.service.icon.url
        return None

    def get_provider_contact(self, obj):
        if obj.provider and obj.status in ['confirmed', 'in_progress', 'completed']:
            phone_obj = getattr(obj.provider, 'phone', None)
            return {
                "name": f"{obj.provider.first_name} {obj.provider.last_name}".strip() or obj.provider.username,
                "phone": str(phone_obj) if phone_obj else None,
                "email": obj.provider.email
            }
        return None

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_customer_contact(self, obj):
        # Always available for provider/admin, or the owner themselves
        if not obj.user:
            return None
        return {
            "name": obj.full_name,
            "phone": obj.phone,
            "email": obj.user.email
        }

    def create(self, validated_data):
        """Attach user automatically before creation."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

from django.db import transaction
from rest_framework import serializers
from .models import Address, Ticket


class AddressSerializer(serializers.ModelSerializer):
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )

    class Meta:
        model = Address
        fields = [
            "id",
            "user",
            "title",
            "address_line",
            "city",
            "state",
            "postal_code",
            "country",
            "latitude",
            "longitude",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def validate(self, data):
        # Use explicit None checks (0.0 is a valid coordinate)
        lat = data.get("latitude", None)
        lon = data.get("longitude", None)

        if (lat is None) ^ (lon is None):  # xor: only one provided
            raise serializers.ValidationError("Both latitude and longitude must be provided together.")

        # Range validation (if provided)
        if lat is not None:
            # DecimalField values are Decimal instances — convert to float for comparisons
            try:
                lat_val = float(lat)
                lon_val = float(lon)
            except (TypeError, ValueError):
                raise serializers.ValidationError("Latitude and longitude must be numeric.")
            if not (-90.0 <= lat_val <= 90.0):
                raise serializers.ValidationError("Latitude must be between -90 and 90.")
            if not (-180.0 <= lon_val <= 180.0):
                raise serializers.ValidationError("Longitude must be between -180 and 180.")

        return data

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Address title must be at least 2 characters.")
        if len(value) > 50:
            raise serializers.ValidationError("Address title cannot exceed 50 characters.")
        return value

    def validate_postal_code(self, value):
        import re
        value = value.strip()
        if not re.match(r'^[1-9][0-9]{5}$', value):
            raise serializers.ValidationError(
                "Enter a valid 6-digit Indian PIN code (e.g. 682001)."
            )
        return value

    def validate_city(self, value):
        import re
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("City must be at least 2 characters.")
        if not re.match(r'^[A-Za-z][A-Za-z\s.-]*$', value):
            raise serializers.ValidationError("City name can only contain letters, spaces, hyphens, or dots.")
        return value

    def validate_state(self, value):
        import re
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("State must be at least 2 characters.")
        if not re.match(r'^[A-Za-z][A-Za-z\s.-]*$', value):
            raise serializers.ValidationError("State name can only contain letters, spaces, hyphens, or dots.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user

        # Enforce address limit per user
        if Address.objects.filter(user=user).count() >= 10:
            raise serializers.ValidationError("Address limit reached. You can save a maximum of 10 addresses.")

        # Ensure user is always set server-side (ignore any client-sent user)
        validated_data["user"] = user

        # Use atomic block when flipping defaults to avoid race conditions
        with transaction.atomic():
            address = super().create(validated_data)
            if address.is_default:
                Address.objects.filter(user=user).exclude(id=address.id).update(is_default=False)

        return address

    def update(self, instance, validated_data):
        # Prevent client from changing the owner (user)
        validated_data.pop("user", None)

        with transaction.atomic():
            address = super().update(instance, validated_data)
            if address.is_default:
                Address.objects.filter(user=address.user).exclude(id=address.id).update(is_default=False)
        return address

class TicketSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Ticket
        fields = [
            'id', 'user', 'user_name', 'user_email', 'subject', 
            'description', 'ticket_type', 'status', 'admin_reply', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_email', 'admin_reply', 'status', 'created_at', 'updated_at']

    def validate_subject(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("Subject must be at least 5 characters.")
        if len(value) > 255:
            raise serializers.ValidationError("Subject cannot exceed 255 characters.")
        return value

    def validate_ticket_type(self, value):
        valid_types = {choice[0] for choice in Ticket.TICKET_TYPES}
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid ticket type. Must be one of: {', '.join(sorted(valid_types))}."
            )
        return value

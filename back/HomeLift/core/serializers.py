from django.db import transaction
from rest_framework import serializers
from .models import Address


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

    def create(self, validated_data):
        user = self.context["request"].user

        # Enforce address limit per user
        if Address.objects.filter(user=user).count() >= 10:
            raise serializers.ValidationError("You can only have up to 10 addresses.")

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

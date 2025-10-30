from rest_framework import serializers
from .models import Address

class AddressSerializer(serializers.ModelSerializer):
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )   
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True,
    )

    class Meta:
        model = Address
        fields = [
            'id', 'user', 'title', 'address_line', 'city', 'state',
            'postal_code', 'country', 'latitude', 'longitude',
            'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate(self, data):
        lat = data.get('latitude')
        lon = data.get('longitude')
        if (lat and not lon) or (lon and not lat):
            raise serializers.ValidationError("Both latitude and longitude must be provided together.")
        return data

    def create(self, validated_data):
        user = self.context['request'].user
            # 🚫 Enforce address limit
        if Address.objects.filter(user=user).count() >= 10:
            raise serializers.ValidationError("You can only have up to 10 addresses.")
        validated_data['user'] = user
        address = super().create(validated_data)
        if address.is_default:
            Address.objects.filter(user=user).exclude(id=address.id).update(is_default=False)
        return address

    def update(self, instance, validated_data):
        address = super().update(instance, validated_data)
        if address.is_default:
            Address.objects.filter(user=address.user).exclude(id=address.id).update(is_default=False)
        return address

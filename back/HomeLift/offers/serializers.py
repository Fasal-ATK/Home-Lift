from rest_framework import serializers
from .models import Offer

class OfferSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    service_name = serializers.ReadOnlyField(source='service.name', allow_null=True)
    service_price = serializers.ReadOnlyField(source='service.price', allow_null=True)
    service_icon = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            'id', 'title', 'description', 'discount_type', 'discount_value', 'max_discount',
            'service', 'service_name', 'service_price',
            'service_icon',
            'start_date', 'end_date', 'is_active', 'image', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_service_icon(self, obj):
        if obj.service and obj.service.icon:
            return obj.service.icon.url
        return None

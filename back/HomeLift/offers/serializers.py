from rest_framework import serializers
from .models import Offer

class OfferSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name', allow_null=True)
    service_name = serializers.ReadOnlyField(source='service.name', allow_null=True)
    category_icon = serializers.SerializerMethodField()
    service_icon = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            'id', 'title', 'description', 'discount_type', 'discount_value', 'max_discount',
            'category', 'service', 'category_name', 'service_name',
            'category_icon', 'service_icon',
            'start_date', 'end_date', 'is_active', 'image', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_category_icon(self, obj):
        if obj.category and obj.category.icon:
            return obj.category.icon.url
        return None

    def get_service_icon(self, obj):
        if obj.service and obj.service.icon:
            return obj.service.icon.url
        return None

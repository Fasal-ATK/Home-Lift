from rest_framework import serializers
from .models import Offer

class OfferSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    service_name = serializers.ReadOnlyField(source='service.name')

    class Meta:
        model = Offer
        fields = [
            'id', 'title', 'description', 'discount_type', 'discount_value', 'max_discount',
            'category', 'service', 'category_name', 'service_name',
            'start_date', 'end_date', 'is_active', 'image', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

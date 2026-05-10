from rest_framework import serializers
from .models import Offer
from datetime import date

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

    def validate(self, attrs):
        discount_type = attrs.get('discount_type', getattr(self.instance, 'discount_type', 'percentage'))
        discount_value = attrs.get('discount_value', getattr(self.instance, 'discount_value', 0))
        
        if discount_value < 0:
            raise serializers.ValidationError({"discount_value": "Discount value cannot be negative."})

        if discount_type == 'percentage' and discount_value > 100:
            raise serializers.ValidationError({"discount_value": "Percentage discount cannot exceed 100."})

        service = attrs.get('service', getattr(self.instance, 'service', None))
        
        if discount_type == 'fixed' and service:
            if discount_value > service.price:
                raise serializers.ValidationError({"discount_value": f"Fixed discount cannot exceed the service price (₹{service.price})."})

        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        
        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({"end_date": "End date cannot be earlier than start date."})
            
            from django.utils import timezone
            if not self.instance and start_date < timezone.localtime(timezone.now()).date():
                raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})

        is_active = attrs.get('is_active', getattr(self.instance, 'is_active', True))
        
        if service and is_active:
            existing_offers = Offer.objects.filter(service=service, is_active=True)
            if self.instance:
                existing_offers = existing_offers.exclude(id=self.instance.id)
                
            if start_date and end_date:
                overlapping = existing_offers.filter(
                    start_date__lte=end_date,
                    end_date__gte=start_date
                )
                if overlapping.exists():
                    raise serializers.ValidationError({"service": "An active offer for this service already exists during this period."})
            
        return attrs

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_service_icon(self, obj):
        if obj.service and obj.service.icon:
            return obj.service.icon.url
        return None

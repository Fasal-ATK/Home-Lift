from rest_framework import serializers
from .models import Category, Service
from django.utils import timezone
from django.db.models import Q

class CategorySerializer(serializers.ModelSerializer):
    icon = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    active_offer = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'is_active', 'active_offer']

    def get_active_offer(self, obj):
        from offers.models import Offer
        from offers.serializers import OfferSerializer
        now = timezone.now().date()

        # Category-level offers only (where service is null)
        offer = Offer.objects.filter(
            category=obj,
            service__isnull=True,
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-discount_value').first()

        if offer:
            return OfferSerializer(offer).data
        return None



class ServiceSerializer(serializers.ModelSerializer):
    icon = serializers.ImageField(required=False, allow_null=True)
    description = serializers.CharField(allow_blank=True, required=False)
    is_active = serializers.BooleanField(default=True)
    active_offer = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'description',
            'price',
            'duration',
            'is_active',
            'category',
            'icon',
            'active_offer',
        ]

    def get_active_offer(self, obj):
        from offers.models import Offer
        from offers.serializers import OfferSerializer
        now = timezone.now().date()

        # Priority: 1. Service-specific offer, 2. Category offer
        # We order by -discount_value to give the customer the best deal if multiple apply
        offer = Offer.objects.filter( 
            Q(service=obj) | Q(category=obj.category, service__isnull=True), 
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-discount_value').first()

        if offer:
            return OfferSerializer(offer).data
        return None
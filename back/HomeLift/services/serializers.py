from rest_framework import serializers
from .models import Category, Service
from django.utils import timezone
from django.db.models import Q

class CategorySerializer(serializers.ModelSerializer):
    icon = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'is_active']

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Category name must be at least 2 characters.")
        qs = Category.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )
        return value




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

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Service name must be at least 2 characters.")
        qs = Service.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A service with this name already exists.")
        return value

    def validate_price(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Service price must be greater than zero.")
        return value

    def validate_duration(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("Service duration must be at least 1 minute.")
        return value

    def get_active_offer(self, obj):
        from offers.models import Offer
        from offers.serializers import OfferSerializer
        # Use localtime to ensure we match the current day in the project's locality
        now = timezone.localtime(timezone.now()).date()

        # Priority: 1. Service-specific offer, 2. Global offer (service is null)
        # We order by -discount_value to give the customer the best deal if multiple apply
        offer = Offer.objects.filter( 
            Q(service=obj) | Q(service__isnull=True), 
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-discount_value').first()

        if offer:
            return OfferSerializer(offer).data
        return None
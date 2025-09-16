from rest_framework import serializers
from .models import (
    ProviderApplication, 
    ProviderApplicationService, 
    ProviderDetails, 
    ProviderService
)
from services.models import Service

# -----------------------------
# Temporary Provider Application forms
# -----------------------------
class ProviderApplicationServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    id_doc = serializers.FileField(required=False, allow_null=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    experience_years = serializers.IntegerField(required=False, min_value=0)

    class Meta:
        model = ProviderApplicationService
        fields = ['id', 'service', 'service_name', 'id_doc', 'price', 'experience_years']


class ProviderApplicationSerializer(serializers.ModelSerializer):
    services = ProviderApplicationServiceSerializer(many=True)

    class Meta:
        model = ProviderApplication
        fields = [
            'id',
            'id_doc',
            'status',
            'rejection_reason',
            'created_at',
            'replied_at',
            'expiration_date',
            'services',
        ]
        read_only_fields = ['status', 'replied_at', 'expiration_date', 'created_at']

    def validate(self, attrs):
        user = self.context['request'].user

        # Example rule: Prevent multiple pending/active applications
        if ProviderApplication.objects.filter(user=user, status__in=["pending", "approved"]).exists():
            raise serializers.ValidationError(
                {"non_field_errors": ["You already have an active or pending application."]}
            )

        return attrs

    def create(self, validated_data):
        services_data = validated_data.pop('services', [])
        user = validated_data.pop('user', None)
        application = ProviderApplication.objects.create(user=user, **validated_data)

        for service_data in services_data:
            ProviderApplicationService.objects.create(application=application, **service_data)

        return application


# -----------------------------
# Approved Provider Services
# -----------------------------
class ProviderServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = ProviderService
        fields = ['id', 'service', 'service_name', 'doc', 'price', 'experience_years', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class ProviderDetailsSerializer(serializers.ModelSerializer):
    services = ProviderServiceSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ProviderDetails
        fields = ['id', 'user', 'user_name', 'is_active', 'approved_at', 'approved_by', 'services']
        read_only_fields = ['approved_at', 'approved_by', 'id']

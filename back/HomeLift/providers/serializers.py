from rest_framework import serializers
from .models import (
    ProviderApplication, 
    ProviderApplicationService, 
    ProviderDetails, 
    ProviderService
)
from services.models import Service


# -----------------------------
# Temporary Provider Services in Application
# -----------------------------
class ProviderApplicationServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = ProviderApplicationService
        fields = ['id', 'service', 'service_name', 'id_doc', 'price', 'experience_years']


# -----------------------------
# Temporary Provider Application
# -----------------------------
class ProviderApplicationSerializer(serializers.ModelSerializer):
    services = ProviderApplicationServiceSerializer(many=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ProviderApplication
        fields = [
            'id', 'user', 'user_name', 'id_doc', 'document_type', 
            'status', 'rejection_reason', 'created_at', 'replied_at', 
            'expiration_date', 'services'
        ]
        read_only_fields = ['status', 'replied_at', 'expiration_date', 'created_at']

    def create(self, validated_data):
        services_data = validated_data.pop('services', [])
        application = ProviderApplication.objects.create(**validated_data)
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


# -----------------------------
# Approved Provider Details
# -----------------------------
class ProviderDetailsSerializer(serializers.ModelSerializer):
    services = ProviderServiceSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ProviderDetails
        fields = ['id', 'user', 'user_name', 'is_active', 'approved_at', 'approved_by', 'services']
        read_only_fields = ['approved_at', 'approved_by', 'id']

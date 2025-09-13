#services/serializers.py
from rest_framework import serializers
from .models import Category, Service

class CategorySerializer(serializers.ModelSerializer):

    icon = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'is_active']



class ServiceSerializer(serializers.ModelSerializer):
    icon = serializers.ImageField(required=False, allow_null=True)
    description = serializers.CharField(allow_blank=True, required=False)
    is_active = serializers.BooleanField(default=True)

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
        ]
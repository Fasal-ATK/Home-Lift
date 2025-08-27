#services/serializers.py
from rest_framework import serializers
from .models import Category, Service

class CategorySerializer(serializers.ModelSerializer):

    icon_url = serializers.SerializerMethodField(read_only=True)
    icon = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'icon_url', 'is_active']

    def get_icon_url(self, obj):
        if obj.icon:
            return obj.icon.url
        return None


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"

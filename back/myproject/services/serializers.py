#services/serializers.py
from rest_framework import serializers
from .models import Category, Service

class CategorySerializer(serializers.ModelSerializer):

    # icon_url = serializers.SerializerMethodField(read_only=True)
    icon = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'is_active']



class ServiceSerializer(serializers.ModelSerializer):

    icon_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Service
        fields = [ 'id', 'name', 'description', 'price', 'duration', 'is_active', 'category', 'icon_url',]

    def get_icon_url(self, obj):
        if obj.icon:
            try:
                return obj.icon.url
            except Exception:
                return None
        return None
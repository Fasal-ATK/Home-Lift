#services/serializers.py
from rest_framework import serializers
from .models import Category, Service

class CategorySerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'is_active']

    def get_icon(self, obj):
        if obj.icon:
            return obj.icon.url  
        return None


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"

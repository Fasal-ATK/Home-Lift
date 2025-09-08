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
        fields = [
            'id',
            'name',
            'description',
            'price',
            'duration',
            'is_active',
            'category',
            'icon',   # ✅ include icon for upload
            'icon_url',   # ✅ separate URL for frontend
        ]
        extra_kwargs = {
            'icon': {'write_only': True},  # optional: so API accepts file upload
        }

    def get_icon_url(self, obj):
        if obj.icon:
            try:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.icon.url)
                return obj.icon.url
            except Exception:
                return None
        return None
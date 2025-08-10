from django.contrib import admin
from django.utils.html import format_html
from .models import ProviderDetails, ProviderService


@admin.register(ProviderDetails)
class ProviderDetailsAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'is_active', 'created_at', 'profile_picture_preview')
    list_filter = ('status', 'is_active', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'profile_picture_preview')
    list_editable = ('status', 'is_active')

    def profile_picture_preview(self, obj):
        if obj.profile_picture_url:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius:5px; object-fit:cover;" />',
                obj.profile_picture_url
            )
        return "❌"
    profile_picture_preview.short_description = "Profile Picture"


@admin.register(ProviderService)
class ProviderServiceAdmin(admin.ModelAdmin):
    list_display = ('provider', 'service', 'price', 'experience_years', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'service')
    search_fields = ('provider__username', 'service__name')
    readonly_fields = ('created_at',)
    list_editable = ('price', 'experience_years', 'is_active')





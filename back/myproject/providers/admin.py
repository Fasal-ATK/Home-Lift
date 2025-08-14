from django.contrib import admin
from .models import ProviderDetails, ProviderService, ProviderApplication


@admin.register(ProviderDetails)
class ProviderDetailsAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at',)
    list_editable = ('is_active',)


@admin.register(ProviderService)
class ProviderServiceAdmin(admin.ModelAdmin):
    list_display = ('provider', 'service', 'price', 'experience_years', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'service')
    search_fields = ('provider__username', 'service__name')
    readonly_fields = ('created_at',)
    list_editable = ('price', 'experience_years', 'is_active')


@admin.register(ProviderApplication)
class ProviderApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'created_at', 'replied_at')
    list_filter = ('status', 'created_at', 'replied_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'replied_at')
    list_editable = ('status',)

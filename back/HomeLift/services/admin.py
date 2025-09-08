from django.contrib import admin
from .models import Category, Service
from django.utils.html import format_html


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'icon_tag', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
    list_editable = ('is_active',)

    def icon_tag(self, obj):
        if obj.icon:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:contain;"/>', obj.icon.url)
        return "—"
    icon_tag.short_description = 'Icon'



@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'icon_tag', 'duration', 'is_active',)
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'category__name')
    readonly_fields = ('created_at',)
    list_editable = ('price', 'duration', 'is_active')

    def icon_tag(self, obj):
        if obj.icon:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:contain;"/>', obj.icon.url)
        return "—"
    icon_tag.short_description = 'Icon'

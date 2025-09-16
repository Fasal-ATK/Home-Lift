from django.contrib import admin
from .models import ProviderDetails, ProviderService, ProviderApplication, ProviderApplicationService
from django.utils.html import format_html


# -----------------------------
# Inline for ProviderService
# -----------------------------
class ProviderServiceInline(admin.TabularInline):
    model = ProviderService
    extra = 0
    readonly_fields = ('doc', 'created_at')
    fields = ('service', 'doc', 'price', 'experience_years', 'is_active')
    can_delete = True

# -----------------------------
# Provider Details Admin
# -----------------------------
@admin.register(ProviderDetails)
class ProviderDetailsAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_active', 'created_at', 'approved_at', 'approved_by')
    list_filter = ('is_active', 'created_at', 'approved_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'approved_at', 'approved_by')
    list_editable = ('is_active',)
    inlines = [ProviderServiceInline]

# -----------------------------
# Inline for ProviderApplicationService
# -----------------------------
class ProviderApplicationServiceInline(admin.TabularInline):
    model = ProviderApplicationService
    extra = 0
    fields = ('service', 'id_doc_preview', 'price', 'experience_years')  # show preview instead of raw field
    readonly_fields = ('id_doc_preview',)  # make preview readonly
    can_delete = True

    def id_doc_preview(self, obj):
        if obj.id_doc:
            # If it's an image, render thumbnail, else show clickable link
            url = obj.id_doc.url
            if any(obj.id_doc.url.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']):
                return format_html('<a href="{}" target="_blank"><img src="{}" style="max-height: 100px;" /></a>', url, url)
            return format_html('<a href="{}" target="_blank">View Document</a>', url)
        return "No document uploaded"

    id_doc_preview.short_description = "Document"
# -----------------------------
# Provider Application Admin
# -----------------------------
@admin.register(ProviderApplication)
class ProviderApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'created_at', 'replied_at', 'expiration_date')
    list_filter = ('status', 'created_at', 'replied_at', 'expiration_date')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'replied_at', 'expiration_date')
    list_editable = ('status',)
    inlines = [ProviderApplicationServiceInline]

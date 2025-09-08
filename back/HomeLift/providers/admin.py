from django.contrib import admin
from .models import ProviderDetails, ProviderService, ProviderApplication, ProviderApplicationService

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
    readonly_fields = ('id_doc',)
    fields = ('service', 'id_doc', 'price', 'experience_years')
    can_delete = True

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

from django.contrib import admin
from .models import Address

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'title',
        'city',
        'state',
        'country',
        'is_default',
        'created_at',
    )
    list_filter = (
        'country',
        'state',
        'city',
        'is_default',
        'created_at',
    )
    search_fields = (
        'user__email',
        'user__username',
        'title',
        'address_line',
        'city',
        'state',
        'postal_code',
    )
    readonly_fields = (
        'created_at',
        'updated_at',
    )
    ordering = ('-created_at',)
    list_select_related = ('user',)
    
    fieldsets = (
        ("User Info", {
            'fields': ('user',)
        }),
        ("Address Details", {
            'fields': (
                'title',
                'address_line',
                'city',
                'state',
                'postal_code',
                'country',
            )
        }),
        ("Location (Optional)", {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ("Settings", {
            'fields': ('is_default',)
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Ensure that only one default address exists per user.
        """
        super().save_model(request, obj, form, change)
        if obj.is_default:
            Address.objects.filter(user=obj.user).exclude(id=obj.id).update(is_default=False)

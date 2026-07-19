from django.contrib import admin
from .models import Offer

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'discount_type', 'discount_value', 'service', 'start_date', 'end_date', 'is_active')
    list_filter = ('discount_type', 'is_active', 'start_date', 'end_date')
    search_fields = ('title', 'description', 'service__name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

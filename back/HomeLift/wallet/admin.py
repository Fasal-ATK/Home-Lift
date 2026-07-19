from django.contrib import admin
from .models import Wallet, WalletTransaction, WithdrawalRequest

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__email', 'user__phone')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'amount', 'transaction_type', 'status', 'created_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('wallet__user__email', 'wallet__user__username', 'transaction_id')
    readonly_fields = ('transaction_id', 'created_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'provider', 'amount', 'status', 'stripe_transfer_id', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('provider__email', 'provider__username', 'provider__phone', 'stripe_transfer_id')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


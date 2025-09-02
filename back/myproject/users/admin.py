from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # What to display in the user list
    list_display = (
        "id",
        "email",
        "username",
        "phone",
        # "is_provider",
        # "is_staff",
        "is_active",
    )
    list_filter = ("is_provider", "is_staff", "is_active")
    search_fields = ("email", "username", "phone")
    ordering = ("id",)

    # Fields layout in the admin detail/edit page
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "is_provider", "groups", "user_permissions")}),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )

    # Fields when creating a new user in the admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "phone", "password1", "password2", "is_provider", "is_staff", "is_active"),
        }),
    )

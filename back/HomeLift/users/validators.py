"""
Centralized validation functions for users, authentication, and profiles.
Shared across Serializers and Views to ensure consistent validation rules.
"""
import re
from rest_framework import serializers

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128

NAME_REGEX = re.compile(r"^[A-Za-z][A-Za-z\s'-]{0,29}$")
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{3,30}$")
INDIAN_PHONE_REGEX = re.compile(r"^(?:\+?91)?\d{10}$")
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_password_complexity(value):
    """
    Validates password strength for registration, reset, and change password:
    - Required and non-empty
    - Minimum 8 characters
    - Maximum 128 characters
    - Must contain at least one letter and at least one number
    - No whitespace allowed
    """
    if not value:
        raise serializers.ValidationError({
            "error": "password-required",
            "message": "Password is required."
        })
    if len(value) < PASSWORD_MIN_LENGTH:
        raise serializers.ValidationError({
            "error": "password-short",
            "message": f"Password must be at least {PASSWORD_MIN_LENGTH} characters long."
        })
    if len(value) > PASSWORD_MAX_LENGTH:
        raise serializers.ValidationError({
            "error": "password-long",
            "message": f"Password cannot exceed {PASSWORD_MAX_LENGTH} characters."
        })
    if re.search(r"\s", value):
        raise serializers.ValidationError({
            "error": "password-spaces",
            "message": "Password cannot contain spaces."
        })
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise serializers.ValidationError({
            "error": "password-weak",
            "message": "Password must contain both letters and numbers."
        })
    return value


def validate_login_password(value):
    """
    Validates password on login (enforces minimum length and basic validity).
    """
    if not value:
        raise serializers.ValidationError({
            "error": "password-required",
            "message": "Password is required."
        })
    if len(value) < PASSWORD_MIN_LENGTH:
        raise serializers.ValidationError({
            "error": "password-short",
            "message": f"Password must be at least {PASSWORD_MIN_LENGTH} characters long."
        })
    if len(value) > PASSWORD_MAX_LENGTH:
        raise serializers.ValidationError({
            "error": "password-long",
            "message": f"Password cannot exceed {PASSWORD_MAX_LENGTH} characters."
        })
    return value


def validate_first_name(value):
    """
    Validates first name: 2-30 characters, letters, spaces, hyphens, apostrophes.
    """
    if not value or not str(value).strip():
        raise serializers.ValidationError("First name is required.")
    value = str(value).strip()
    if len(value) < 2:
        raise serializers.ValidationError("First name must be at least 2 characters.")
    if len(value) > 30:
        raise serializers.ValidationError("First name cannot exceed 30 characters.")
    if not NAME_REGEX.match(value):
        raise serializers.ValidationError(
            "First name can only contain letters, spaces, hyphens, or apostrophes (2–30 chars)."
        )
    return value


def validate_last_name(value):
    """
    Validates last name: 2-30 characters, letters, spaces, hyphens, apostrophes.
    """
    if not value or not str(value).strip():
        raise serializers.ValidationError("Last name is required.")
    value = str(value).strip()
    if len(value) < 2:
        raise serializers.ValidationError("Last name must be at least 2 characters.")
    if len(value) > 30:
        raise serializers.ValidationError("Last name cannot exceed 30 characters.")
    if not NAME_REGEX.match(value):
        raise serializers.ValidationError(
            "Last name can only contain letters, spaces, hyphens, or apostrophes (2–30 chars)."
        )
    return value


def validate_username_format(value):
    """
    Validates username format: 3-30 chars, letters, numbers, underscores only.
    """
    if not value or not str(value).strip():
        raise serializers.ValidationError({
            "error": "username-required",
            "message": "Username is required."
        })
    value = str(value).strip()
    if not USERNAME_REGEX.match(value):
        raise serializers.ValidationError({
            "error": "username-invalid",
            "message": "Username must be 3–30 characters: letters, numbers, underscores only."
        })
    return value


def validate_phone_format(value, required=True):
    """
    Validates Indian phone number format (10 digits, optional +91 prefix).
    """
    if not value or not str(value).strip():
        if required:
            raise serializers.ValidationError({
                "error": "phone-required",
                "message": "Phone number is required."
            })
        return value
    value = str(value).strip()
    if not INDIAN_PHONE_REGEX.match(value):
        raise serializers.ValidationError({
            "error": "invalid-phone",
            "message": "Enter a valid 10‑digit phone number."
        })
    return value


def validate_email_format(value):
    """
    Validates email syntax.
    """
    if not value or not str(value).strip():
        raise serializers.ValidationError({
            "error": "email-required",
            "message": "Email is required."
        })
    value = str(value).strip().lower()
    if not EMAIL_REGEX.match(value):
        raise serializers.ValidationError({
            "error": "email-invalid",
            "message": "Enter a valid email address."
        })
    return value

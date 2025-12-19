from django.core.cache import cache   # ✅ REQUIRED
from rest_framework import serializers
from .models import CustomUser
import re


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'profile_picture',
            'first_name', 'last_name', 'phone',
            'is_staff', 'is_provider', 'is_active'
        ]
        read_only_fields = ['email']


# ---------------------------
# Signup        
# ---------------------------
class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True)

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'username', 'email', 'phone', 'password']

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError({
                "error": "username-exists",
                "message": "This username is already taken."
            })
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError({
                "error": "email-exists",
                "message": "An account with this email already exists."
            })
        return value

    def validate_phone(self, value):
        if not re.match(r'^\+?\d{10,15}$', value):
            raise serializers.ValidationError({
                "error": "invalid-phone",
                "message": "Enter a valid phone number (10–15 digits)."
            })
        if CustomUser.objects.filter(phone=value).exists():
            raise serializers.ValidationError({
                "error": "phone-exists",
                "message": "This phone number is already in use."
            })
        return value

    def create(self, validated_data):
        return CustomUser.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            phone=validated_data['phone'],
            password=validated_data['password']
        )


# ---------------------------
# Login
# ---------------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({
                "error": "not-exist",
                "message": "No account found with this email."
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                "error": "password-mismatch",
                "message": "Incorrect password."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "error": "account-blocked",
                "message": "Your account has been blocked."
            })

        attrs['user'] = user
        return attrs


# ---------------------------
# Reset Password (Forgot Flow)
# ---------------------------
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def save(self):
        email = self.validated_data["email"]

        # 🔐 OTP VERIFICATION CHECK
        if not cache.get(f"otp_verified_forgot-password_{email}"):
            raise serializers.ValidationError({
                "error": "otp-not-verified",
                "message": "OTP verification required."
            })

        user = CustomUser.objects.get(email=email)
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])

        # cleanup
        cache.delete(f"otp_verified_forgot-password_{email}")

        return user


# ---------------------------
# Change Password (Logged-in)
# ---------------------------
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError({
                "error": "incorrect-password",
                "message": "Current password is incorrect."
            })
        return value

    def validate_new_password(self, value):
        user = self.context['request'].user

        if user.check_password(value):
            raise serializers.ValidationError({
                "error": "same-password",
                "message": "New password must be different."
            })

        if not re.search(r'[A-Za-z]', value) or not re.search(r'\d', value):
            raise serializers.ValidationError({
                "error": "password-weak",
                "message": "Password must contain letters and numbers."
            })

        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=["password"])
        return user

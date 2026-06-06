from django.core.cache import cache   # ✅ REQUIRED
from rest_framework import serializers
from .models import CustomUser
import re


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=False, use_url=True)
    is_provider_active = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'profile_picture',
            'first_name', 'last_name', 'phone',
            'is_staff', 'is_provider', 'is_active', 'is_provider_active'
        ]
        read_only_fields = ['email']

    def get_is_provider_active(self, obj):
        if not obj.is_provider:
            return None
        try:
            return obj.provider_details.is_active
        except:
            return False

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Ensure profile_picture returns the absolute URL correctly from CloudinaryResource
        if instance.profile_picture:
            if hasattr(instance.profile_picture, 'url'):
                representation['profile_picture'] = instance.profile_picture.url
            elif isinstance(instance.profile_picture, str):
                # Fallback if it is somehow a string
                if instance.profile_picture.startswith('http'):
                    representation['profile_picture'] = instance.profile_picture
                else:
                    # Not an absolute URL, but keep it so it's not None
                    representation['profile_picture'] = instance.profile_picture
            else:
                representation['profile_picture'] = str(instance.profile_picture)
        else:
            representation['profile_picture'] = None
        return representation


# ---------------------------
# Signup        
# ---------------------------
class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True)
    otp = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'username', 'email', 'phone', 'password', 'otp']

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

    def validate_password(self, value):
        if not re.search(r'[A-Za-z]', value) or not re.search(r'\d', value):
            raise serializers.ValidationError({
                "error": "password-weak",
                "message": "Password must contain letters and numbers."
            })
        if len(value) < 8:
            raise serializers.ValidationError({
                "error": "password-short",
                "message": "Password must be at least 8 characters long."
            })
        return value

    def validate(self, attrs):
        email = attrs.get("email")
        otp = attrs.get("otp")
        
        cached_otp = cache.get(f"otp_signup_{email}")
        if not cached_otp or str(cached_otp) != str(otp):
            raise serializers.ValidationError({
                "error": "invalid-otp",
                "message": "Invalid or expired OTP. Please request a new one."
            })
            
        return attrs

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            phone=validated_data['phone'],
            password=validated_data['password']
        )
        cache.delete(f"otp_signup_{validated_data['email']}")
        cache.delete(f"otp_verified_signup_{validated_data['email']}")
        return user


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

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError({
                "error": "not-found",
                "message": "No account found with this email."
            })
        return value

    def validate_new_password(self, value):
        if not re.search(r'[A-Za-z]', value) or not re.search(r'\d', value):
            raise serializers.ValidationError({
                "error": "password-weak",
                "message": "Password must contain letters and numbers."
            })
        return value

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

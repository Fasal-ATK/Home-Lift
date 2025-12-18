from rest_framework import serializers
from .models import CustomUser
import re


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username','profile_picture',
            'first_name', 'last_name', 'phone',
            'is_staff', 'is_provider', 'is_active'
        ]
        read_only_fields = ['email',]


# Signup serializer for users
class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,

        error_messages={
            'required': 'Password is required',
            'blank': 'Password cannot be blank',
        }
    )
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
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            phone=validated_data['phone'],
            password=validated_data['password']
        )
        return user


# Login serializer for users
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
            if not user.last_login:
                raise serializers.ValidationError({
                    "error": "account-not-activated",
                    "message": "Your account has been blocked. Please contact support."
                })
            raise serializers.ValidationError({
                "error": "account-blocked",
                "message": "Your account has been blocked. Contact support."
            })

        attrs['user'] = user
        return attrs


# ========================================
# NEW: Password Reset Serializers
# ========================================

# Reset Password Serializer (for forgot password flow)
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        error_messages={
            'required': 'New password is required',
            'blank': 'Password cannot be blank',
            'min_length': 'Password must be at least 8 characters long'
        }
    )

    def validate_email(self, value):
        """Check if user with this email exists"""
        try:
            user = CustomUser.objects.get(email=value)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({
                "error": "email-not-found",
                "message": "No account found with this email address."
            })
        return value

    def validate_new_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError({
                "error": "password-too-short",
                "message": "Password must be at least 8 characters long."
            })
        
        # Check for both letters and numbers
        if not re.search(r'[A-Za-z]', value) or not re.search(r'\d', value):
            raise serializers.ValidationError({
                "error": "password-weak",
                "message": "Password must contain both letters and numbers."
            })
        
        return value

    def save(self):
        """Update user's password"""
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']
        
        user = CustomUser.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        
        return user


# Change Password Serializer (for authenticated users)
class ChangePasswordSerializer(serializers.Serializer):
    """For authenticated users changing their password"""
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        error_messages={
            'required': 'New password is required',
            'min_length': 'Password must be at least 8 characters long'
        }
    )

    def validate_current_password(self, value):
        """Verify current password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError({
                "error": "incorrect-password",
                "message": "Current password is incorrect."
            })
        return value

    def validate_new_password(self, value):
        """Validate new password strength"""
        if len(value) < 8:
            raise serializers.ValidationError({
                "error": "password-too-short",
                "message": "Password must be at least 8 characters long."
            })
        
        # Check password is different from current
        user = self.context['request'].user
        if user.check_password(value):
            raise serializers.ValidationError({
                "error": "same-password",
                "message": "New password must be different from current password."
            })
        
        # Check for both letters and numbers
        if not re.search(r'[A-Za-z]', value) or not re.search(r'\d', value):
            raise serializers.ValidationError({
                "error": "password-weak",
                "message": "Password must contain both letters and numbers."
            })
        
        return value

    def save(self):
        """Update user's password"""
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        return user
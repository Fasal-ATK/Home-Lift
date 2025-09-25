from rest_framework import serializers
from .models import CustomUser
import re


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username',
            'first_name', 'last_name', 'phone',
            'is_staff', 'is_provider', 'is_active'
        ]
        read_only_fields = ['id', 'email', 'username']


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

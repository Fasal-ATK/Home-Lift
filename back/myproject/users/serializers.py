from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'first_name', 'last_name', 'phone', 'is_staff','is_provider']
        read_only_fields = fields


# Signup serializer for users
class SignupSerialzer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            'required': 'Password is required',
            'blank': 'Password cannot be blank',
        }
    )

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'username', 'email', 'phone', 'password']

    def validate_password(self, value):
        validate_password(value)
        return value
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username = validated_data['username'],
            first_name = validated_data['first_name'],
            last_name = validated_data['last_name'],
            email = validated_data['email'],
            phone = validated_data['phone'],
            password = validated_data['password']
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
                    "message": "Please verify your email to activate your account."
                })
            raise serializers.ValidationError({
                "error": "account-blocked",
                "message": "Your account has been blocked. Contact support."
            })

        attrs['user'] = user
        print(attrs)
        return attrs
    
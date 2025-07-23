from rest_framework import serializers
from users.models import CustomUser



class AdminLoginSerializer(serializers.Serializer):
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
                "error": "account-inactive",
                "message": "Your admin account is inactive."
            })

        if not user.is_staff:
            print("User is not an admin")
            raise serializers.ValidationError({
                "error": "not-admin",
                "message": "You are not authorized to access admin login."
            })
        attrs['user'] = user
        return attrs 
 
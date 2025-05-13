from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password

class SignupSerialzer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
    )
    class Meta:
        model = CustomUser
        fields = ['first_name','last_name','username','email','phone','password']
    
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
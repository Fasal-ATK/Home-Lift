from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = PhoneNumberField(unique=True, region='IN')

    USERNAME_FIELD = 'email'  # ✅ email is the login field
    REQUIRED_FIELDS = ['username', 'phone'] 

    
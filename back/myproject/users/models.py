from django.contrib.auth.models import AbstractUser
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = PhoneNumberField(unique=True, region='IN')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone']

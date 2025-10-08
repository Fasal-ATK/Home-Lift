from django.contrib.auth.models import AbstractUser
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from cloudinary.models import CloudinaryField

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = PhoneNumberField(unique=True, region='IN',null=True, blank=True)
    profile_picture = CloudinaryField(
        'image',
        folder='images/profiles',
        blank=True,
        null=True,
        help_text="Profile picture for the user"
    )
    is_provider = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

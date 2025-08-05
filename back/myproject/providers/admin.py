from django.contrib import admin
from .models import ProviderDetails,ProviderService

# Register your models here.

admin.site.register(ProviderDetails)
admin.site.register(ProviderService)


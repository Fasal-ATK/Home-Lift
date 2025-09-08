from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ProviderApplication, ProviderApplicationService, ProviderDetails, ProviderService
from django.utils import timezone

@receiver(post_save, sender=ProviderApplication)
def handle_approved_application(sender, instance, created, **kwargs):
    if instance.status == 'approved' and not ProviderDetails.objects.filter(user=instance.user).exists():
        # Create ProviderDetails
        provider_detail = ProviderDetails.objects.create(
            user=instance.user,
            approved_at=timezone.now(),
            approved_by=None  # optionally pass admin user
        )
        
        # Copy services from ProviderApplicationService
        app_services = instance.services.all()
        for app_service in app_services:
            ProviderService.objects.create(
                provider=provider_detail,
                service=app_service.service,
                doc=app_service.id_doc,
                price=app_service.price,
                experience_years=app_service.experience_years
            )

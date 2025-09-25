from django.db.models.signals import post_save, post_delete
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
            
        # ✅ Set user as provider
        user = instance.user
        if not user.is_provider:
            user.is_provider = True
            user.save(update_fields=['is_provider'])


@receiver(post_delete, sender=ProviderDetails)
def reset_user_is_provider(sender, instance, **kwargs):
    user = instance.user
    if user and user.is_provider:   # Only reset if True
        user.is_provider = False
        user.save(update_fields=["is_provider"])
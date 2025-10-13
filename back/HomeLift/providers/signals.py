from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import ProviderApplication, ProviderApplicationService, ProviderDetails, ProviderService
from notifications.models import Notification


@receiver(post_save, sender=ProviderApplication)
def handle_provider_application_update(sender, instance, created, **kwargs):
    user = instance.user

    # --- When approved ---
    if instance.status == 'approved' and not ProviderDetails.objects.filter(user=user).exists():
        # Create ProviderDetails
        provider_detail = ProviderDetails.objects.create(
            user=user,
            approved_at=timezone.now(),
            approved_by=None  # optional: can pass admin user if available
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

        # Mark user as provider
        if not user.is_provider:
            user.is_provider = True
            user.save(update_fields=['is_provider'])

        # ✅ Create success notification
        Notification.objects.create(
            recipient=user,
            sender=None,  # system-generated
            type='provider',
            title='Provider Application Approved',
            message=f"Congratulations {user.username}! Your provider application has been approved."
        )

    # --- When rejected ---
    elif instance.status == 'rejected':
        # Remove provider flag if previously set (safety)
        if user.is_provider:
            user.is_provider = False
            user.save(update_fields=['is_provider'])

        # ✅ Create rejection notification
        reason = instance.rejection_reason or "No reason provided."
        Notification.objects.create(
            recipient=user,
            sender=None,  # system-generated
            type='provider',
            title='Provider Application Rejected',
            message=f"Your provider application has been rejected. Reason: {reason}"
        )


@receiver(post_delete, sender=ProviderDetails)
def reset_user_is_provider(sender, instance, **kwargs):
    user = instance.user
    if user and user.is_provider:  # Only reset if True
        user.is_provider = False
        user.save(update_fields=["is_provider"])

        # Optional cleanup notification
        Notification.objects.create(
            recipient=user,
            sender=None,
            type='system',
            title='Provider Profile Removed',
            message='Your provider profile has been removed from the system.'
        )


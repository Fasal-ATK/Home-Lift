# apps/your_app/signals.py
import logging
from django.apps import apps
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import ProviderApplication, ProviderApplicationService, ProviderDetails, ProviderService
from notifications.models import Notification
from notifications.utils import send_user_notification

logger = logging.getLogger(__name__)
User = apps.get_model(settings.AUTH_USER_MODEL)


def get_system_user():
    """Return a fallback system/admin user to receive system notifications."""
    return User.objects.filter(is_superuser=True).first() or User.objects.filter(is_staff=True).first()


def safe_create_notification(recipient, **kwargs):
    """
    Create Notification only if recipient exists. If recipient doesn't exist,
    send to system user instead. Logs decisions.
    """
    try:
        # If recipient is a user instance, check its existence in DB by PK
        if recipient is not None:
            if getattr(recipient, "pk", None) is None:
                # No PK — treat as invalid
                raise ValueError("recipient has no PK")
            if not User.objects.filter(pk=recipient.pk).exists():
                raise ValueError(f"recipient id={recipient.pk} does not exist")
            # create notification for valid recipient
            Notification.objects.create(recipient=recipient, **kwargs)
            # Trigger WebSocket notification
            send_user_notification(recipient.id, kwargs.get('message', ''))
            return

        # If recipient is None, route to system user
        system_user = get_system_user()
        if system_user:
            Notification.objects.create(recipient=system_user, **kwargs)
            logger.info("Routed notification to system_user because recipient was None.")
            return

        # No valid recipient at all — log and skip
        logger.warning("No valid recipient found for notification; skipping. kwargs=%s", kwargs)

    except (IntegrityError, ValueError) as exc:
        # If DB integrity would be violated or recipient invalid, fallback to system user
        logger.exception("Failed to create notification for recipient=%s: %s. Falling back to system user.", getattr(recipient, "pk", None), exc)
        system_user = get_system_user()
        if system_user:
            try:
                Notification.objects.create(recipient=system_user, **kwargs)
                logger.info("Fallback notification created for system_user.")
            except Exception:
                logger.exception("Failed to create fallback notification for system_user.")
        else:
            logger.error("No system_user available to receive fallback notification.")


@receiver(post_save, sender=ProviderApplication)
def handle_provider_application_update(sender, instance, created, **kwargs):
    """
    When a provider application is approved -> create ProviderDetails and services,
    mark user as provider, and notify the user (safely).
    When rejected, remove provider flag and notify (safely).
    """
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

        # Create success notification — use safe helper
        safe_create_notification(
            recipient=user,
            sender=None,  # system-generated
            type='provider',
            title='Provider Application Approved',
            message=f"Congratulations {getattr(user, 'username', '')}! Your provider application has been approved."
        )

    # --- When rejected ---
    elif instance.status == 'rejected':
        # Remove provider flag if previously set (safety)
        if user.is_provider:
            user.is_provider = False
            user.save(update_fields=['is_provider'])

        # Create rejection notification — use safe helper
        reason = instance.rejection_reason or "No reason provided."
        safe_create_notification(
            recipient=user,
            sender=None,  # system-generated
            type='provider',
            title='Provider Application Rejected',
            message=f"Your provider application has been rejected. Reason: {reason}"
        )


@receiver(pre_save, sender=ProviderDetails)
def track_provider_status_change(sender, instance, **kwargs):
    """
    Track changes to is_active status before saving.
    """
    if instance.pk:
        try:
            old_instance = ProviderDetails.objects.get(pk=instance.pk)
            instance._old_is_active = old_instance.is_active
        except ProviderDetails.DoesNotExist:
            instance._old_is_active = None
    else:
        instance._old_is_active = None


@receiver(post_save, sender=ProviderDetails)
def handle_provider_status_notification(sender, instance, created, **kwargs):
    """
    Send notification when a provider is blocked or unblocked.
    """
    if not created:
        old_is_active = getattr(instance, '_old_is_active', None)
        new_is_active = instance.is_active

        if old_is_active is not None and old_is_active != new_is_active:
            user = instance.user
            if new_is_active:
                title = "Account Unblocked"
                message = "Your provider account has been unblocked. You can now accept jobs again. please re-login to continue"
            else:
                title = "Account Blocked"
                message = "Your provider account has been blocked. Please contact support for more information."

            safe_create_notification(
                recipient=user,
                sender=None,
                type='provider',
                title=title,
                message=message
            )


@receiver(post_delete, sender=ProviderDetails)
def reset_user_is_provider(sender, instance, **kwargs):
    """
    When ProviderDetails is deleted, reset user's is_provider flag.
    Do NOT attempt to create a notification for a user who might be deleted concurrently.
    Instead, try to notify the system/admin account.
    """
    user = instance.user

    # Try update user flag if user still exists
    try:
        if user and User.objects.filter(pk=user.pk).exists():
            # Update the flag regardless of current value (defensive)
            user.is_provider = False
            user.save(update_fields=["is_provider"])
        else:
            logger.info("User for ProviderDetails(pk=%s) no longer exists; skipping is_provider reset.", getattr(instance, "pk", None))
    except Exception:
        logger.exception("Error while resetting user's is_provider flag for ProviderDetails(pk=%s).", getattr(instance, "pk", None))

    # Optional cleanup notification -> send to system user, not the possibly-deleted user
    safe_create_notification(
        recipient=None,  # force fallback to system/admin user
        sender=None,
        type='system',
        title='Provider Profile Removed',
        message=(
            f"Provider profile for {getattr(user, 'email', 'unknown')} (id={getattr(user, 'pk', 'unknown')}) was removed. "
            "If this was unexpected, please investigate or contact support."
        )
    )

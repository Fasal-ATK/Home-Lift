# bookings/signals.py
import logging
from django.apps import apps
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Booking
from notifications.models import Notification

logger = logging.getLogger(__name__)
User = apps.get_model(settings.AUTH_USER_MODEL)


def get_system_user():
    """Return a fallback system/admin user to receive system notifications."""
    return User.objects.filter(is_superuser=True).first() or User.objects.filter(is_staff=True).first()


def safe_create_notification(recipient, **kwargs):
    """
    Minimal safe create helper: create notification only if recipient exists;
    otherwise route to a system user. Logs errors.
    """
    try:
        if recipient is not None:
            if getattr(recipient, "pk", None) is None:
                raise ValueError("recipient has no PK")
            if not User.objects.filter(pk=recipient.pk).exists():
                raise ValueError(f"recipient id={recipient.pk} does not exist")
            Notification.objects.create(recipient=recipient, **kwargs)
            return

        # fallback to system user
        system_user = get_system_user()
        if system_user:
            Notification.objects.create(recipient=system_user, **kwargs)
            logger.info("Routed notification to system_user because recipient was None.")
            return

        logger.warning("No valid recipient found for notification; skipping. kwargs=%s", kwargs)

    except (IntegrityError, ValueError) as exc:
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


@receiver(pre_save, sender=Booking)
def booking_pre_save(sender, instance, **kwargs):
    """
    Capture previous status (if any) so post_save can detect transitions.
    We attach it to the instance as _pre_save_status.
    """
    if not instance.pk:
        instance._pre_save_status = None
        return

    try:
        old = Booking.objects.filter(pk=instance.pk).values_list('status', flat=True).first()
        instance._pre_save_status = old
    except Exception:
        logger.exception("Could not fetch previous booking status for pk=%s", getattr(instance, "pk", None))
        instance._pre_save_status = None


@receiver(post_save, sender=Booking)
def booking_post_save(sender, instance, created, **kwargs):
    """
    If booking status transitioned to 'cancelled', send a system -> user notification:
    "You have cancelled the booking".
    """
    try:
        prev_status = getattr(instance, "_pre_save_status", None)

        # If it's newly created and status is cancelled, treat as transition only if prev_status != 'cancelled'
        if instance.status == "cancelled" and prev_status != "cancelled":
            # Build message
            service_name = getattr(instance.service, "name", "service")
            title = "Booking Cancelled"
            message = (
                f"You have cancelled booking #{instance.pk} for {service_name} "
                f"on {instance.booking_date} at {instance.booking_time}."
            )

            # Link the booking as content_object using GenericForeignKey fields:
            # We'll pass content_type and object_id so safe_create_notification can forward them.
            booking_ct = ContentType.objects.get_for_model(instance)

            safe_create_notification(
                recipient=instance.user,   # system -> user notification (recipient is booking.user)
                sender=None,              # system
                type='booking',
                title=title,
                message=message,
                content_type=booking_ct,
                object_id=instance.pk
            )
    except Exception:
        logger.exception("Error while handling booking cancellation notification for booking pk=%s", getattr(instance, "pk", None))

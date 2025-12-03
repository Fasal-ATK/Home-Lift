# bookings/signals.py
import logging
from django.apps import apps
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError, transaction
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Booking
from notifications.models import Notification

logger = logging.getLogger(__name__)
User = apps.get_model(settings.AUTH_USER_MODEL)


def get_system_user():
    """
    Return a fallback system/admin user to receive system notifications.
    Prefer superuser, then staff user.
    """
    return User.objects.filter(is_superuser=True).first() or User.objects.filter(is_staff=True).first()


def safe_create_notification(recipient, **kwargs):
    """
    Create Notification only if recipient exists. If recipient doesn't exist,
    send to system user instead. Use transaction.on_commit to ensure this runs
    after the DB transaction successfully commits.
    """
    def _create():
        try:
            # Validate recipient if provided
            if recipient is not None:
                if getattr(recipient, "pk", None) is None:
                    raise ValueError("recipient has no PK")
                if not User.objects.filter(pk=recipient.pk).exists():
                    raise ValueError(f"recipient id={recipient.pk} does not exist")
                Notification.objects.create(recipient=recipient, **kwargs)
                return

            # If recipient is None, route to system user
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

    # schedule creation after the surrounding transaction commits
    try:
        transaction.on_commit(_create)
    except Exception:
        # If transaction infrastructure is not available, attempt immediate create (best effort)
        logger.exception("transaction.on_commit failed; attempting immediate notification creation.")
        _create()


@receiver(pre_save, sender=Booking)
def booking_pre_save(sender, instance, **kwargs):
    """
    Store previous status (if exists) on the instance as _pre_save_status so
    post_save can compare and detect transitions.
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
    Handle booking state transitions:
      - when status -> 'cancelled' : notify booking.user (system -> user)
      - when status -> 'confirmed' : notify booking.user (provider -> user) and provider (system -> provider)
    Uses safe_create_notification which schedules creation after transaction commit.
    """
    try:
        prev_status = getattr(instance, "_pre_save_status", None)
        booking_ct = ContentType.objects.get_for_model(instance)

        # ---------- cancelled ----------
        if instance.status == "cancelled" and prev_status != "cancelled":
            try:
                service_name = getattr(instance.service, "name", "service")
                title = "Booking Cancelled"
                message = (
                    f"You have cancelled booking #{instance.pk} for {service_name} "
                    f"on {instance.booking_date} at {instance.booking_time}."
                )

                safe_create_notification(
                    recipient=instance.user,
                    sender=None,
                    type='booking',
                    title=title,
                    message=message,
                    content_type=booking_ct,
                    object_id=instance.pk
                )
            except Exception:
                logger.exception("Failed to schedule cancellation notification for booking pk=%s", instance.pk)

        # ---------- confirmed ----------
        if instance.status == "confirmed" and prev_status != "confirmed":
            provider = getattr(instance, "provider", None)
            try:
                service_name = getattr(instance.service, "name", "service")

                # Notify the booking owner (user) that provider accepted
                try:
                    title_u = "Booking Accepted"
                    provider_name = (provider.get_full_name() or provider.username) if provider else "Provider"
                    message_u = (
                        f"Good news — your booking #{instance.pk} for {service_name} "
                        f"on {instance.booking_date} at {instance.booking_time} has been accepted by "
                        f"{provider_name}."
                    )

                    safe_create_notification(
                        recipient=instance.user,
                        sender=provider if provider else None,
                        type='booking',
                        title=title_u,
                        message=message_u,
                        content_type=booking_ct,
                        object_id=instance.pk
                    )
                except Exception:
                    logger.exception("Failed to schedule user notification for confirmed booking pk=%s", instance.pk)

                # Notify the provider that they have been assigned (system -> provider)
                if provider:
                    try:
                        title_p = "Booking Assigned to You"
                        customer_name = instance.full_name or (instance.user.get_full_name() if hasattr(instance.user, "get_full_name") else getattr(instance.user, "username", "Customer"))
                        message_p = (
                            f"You have been assigned booking #{instance.pk} for {service_name} "
                            f"on {instance.booking_date} at {instance.booking_time}. "
                            f"Customer: {customer_name}."
                        )

                        safe_create_notification(
                            recipient=provider,
                            sender=None,
                            type='booking',
                            title=title_p,
                            message=message_p,
                            content_type=booking_ct,
                            object_id=instance.pk
                        )
                    except Exception:
                        logger.exception("Failed to schedule provider notification for confirmed booking pk=%s", instance.pk)

            except Exception:
                logger.exception("Error while preparing confirmed notifications for booking pk=%s", instance.pk)

    except Exception:
        logger.exception("Error while handling booking post_save for booking pk=%s", getattr(instance, "pk", None))

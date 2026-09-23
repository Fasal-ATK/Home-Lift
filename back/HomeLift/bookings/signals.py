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
from notifications.utils import send_user_notification

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
                # Trigger WebSocket notification with title + type
                send_user_notification(
                    recipient.id,
                    kwargs.get('message', ''),
                    title=kwargs.get('title', ''),
                    notification_type=kwargs.get('type', 'system'),
                )
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
    Handle booking state transitions and send rich notifications:
      - new booking created : notify provider (user -> provider)
      - status -> 'cancelled' : notify booking.user (system -> user)
      - status -> 'confirmed' : notify booking.user (provider -> user) and provider (system -> provider)
      - status -> 'completed' : notify booking.user (system -> user)
    """
    try:
        prev_status = getattr(instance, "_pre_save_status", None)
        booking_ct = ContentType.objects.get_for_model(instance)
        service_name = getattr(instance.service, "name", "service")
        booking_date = instance.booking_date
        booking_time = instance.booking_time

        # ---------- new booking created ----------
        if created:
            provider = getattr(instance, "provider", None)
            if provider:
                try:
                    customer_name = (
                        instance.full_name
                        or (instance.user.get_full_name() if hasattr(instance.user, "get_full_name") else None)
                        or getattr(instance.user, "username", "A customer")
                    )
                    title_p = "📋 New Booking Request"
                    message_p = (
                        f"You have a new booking request for '{service_name}' "
                        f"on {booking_date} at {booking_time} from {customer_name}. "
                        f"Open your job requests to accept or decline."
                    )
                    safe_create_notification(
                        recipient=provider,
                        sender=instance.user,
                        type='booking',
                        title=title_p,
                        message=message_p,
                        content_type=booking_ct,
                        object_id=instance.pk
                    )
                except Exception:
                    logger.exception("Failed to schedule new-booking notification for provider, booking pk=%s", instance.pk)

        # ---------- cancelled ----------
        if instance.status == "cancelled" and prev_status != "cancelled":
            # 1. Notify User
            try:
                title = "❌ Booking Cancelled"
                message = (
                    f"Your booking #{instance.pk} for '{service_name}' "
                    f"on {booking_date} at {booking_time} has been cancelled. "
                    f"If you paid an advance, a refund will be credited to your wallet shortly."
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

            # 2. Process Refund to Wallet
            if instance.is_advance_paid and not instance.is_refunded:
                try:
                    # Lazy import to avoid circular dependencies
                    Wallet = apps.get_model('wallet', 'Wallet')
                    WalletTransaction = apps.get_model('wallet', 'WalletTransaction')

                    with transaction.atomic():
                        wallet, _ = Wallet.objects.get_or_create(user=instance.user, wallet_type='user')
                        wallet.balance += instance.advance
                        wallet.save(update_fields=['balance'])

                        WalletTransaction.objects.create(
                            wallet=wallet,
                            amount=instance.advance,
                            transaction_type='credit',
                            status='completed',
                            description=f"Refund for cancelled booking #{instance.pk}"
                        )

                        # Mark as refunded to prevent duplicate refunds
                        Booking.objects.filter(pk=instance.pk).update(is_refunded=True)
                        instance.is_refunded = True

                    # Force set it again just in case update() didn't reflect in memory immediately
                    instance.is_refunded = True

                    logger.info("Refunded advance of %s for booking %s to user %s wallet", instance.advance, instance.pk, instance.user.email)
                except Exception:
                    logger.exception("Failed to refund advance for booking %s", instance.pk)

        # ---------- confirmed ----------
        if instance.status == "confirmed" and prev_status != "confirmed":
            provider = getattr(instance, "provider", None)
            try:
                # Notify the booking owner (user) that provider accepted
                try:
                    provider_name = (provider.get_full_name() or provider.username) if provider else "your provider"
                    title_u = "✅ Booking Accepted!"
                    message_u = (
                        f"Great news! {provider_name} has accepted your booking #{instance.pk} "
                        f"for '{service_name}' on {booking_date} at {booking_time}. "
                        f"Please complete your advance payment to confirm the slot."
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
                        customer_name = (
                            instance.full_name
                            or (instance.user.get_full_name() if hasattr(instance.user, "get_full_name") else None)
                            or getattr(instance.user, "username", "Customer")
                        )
                        title_p = "🔧 Job Assigned to You"
                        message_p = (
                            f"You've accepted booking #{instance.pk} for '{service_name}' "
                            f"on {booking_date} at {booking_time}. "
                            f"Customer: {customer_name}. Check your schedule and be ready!"
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

        # ---------- completed ----------
        if instance.status == "completed" and prev_status != "completed":
            try:
                title = "🎉 Service Completed!"
                message = (
                    f"Your '{service_name}' service (booking #{instance.pk}) has been marked as completed. "
                    f"We hope everything went smoothly! "
                    f"Please take a moment to rate your experience and leave a review."
                )

                safe_create_notification(
                    recipient=instance.user,
                    sender=None,  # System notification
                    type='booking',
                    title=title,
                    message=message,
                    content_type=booking_ct,
                    object_id=instance.pk
                )
            except Exception:
                logger.exception("Failed to schedule completion notification for booking pk=%s", instance.pk)


    except Exception:
        logger.exception("Error while handling booking post_save for booking pk=%s", getattr(instance, "pk", None))

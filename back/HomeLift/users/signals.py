# your_app/signals.py
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import CustomUser
import cloudinary
from cloudinary import uploader
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=CustomUser)
def delete_old_profile_picture_on_change(sender, instance, **kwargs):
    """
    Before saving a CustomUser, if the profile_picture changed, delete the old cloudinary image.
    """
    if not instance.pk:
        # New user, nothing to delete
        return

    print(f"DEBUG: pre_save signal triggered for user {instance.pk}")
    try:
        old = CustomUser.objects.get(pk=instance.pk)
    except CustomUser.DoesNotExist:
        print("DEBUG: User does not exist (new user)")
        return

    old_file = old.profile_picture
    new_file = instance.profile_picture
    
    print(f"DEBUG: Old file: {old_file}")
    print(f"DEBUG: New file: {new_file}")

    # If old exists and it's different from new (and not empty)
    if old_file and old_file != new_file:
        print("DEBUG: Old file is different from new file. Deleting old file.")
        # try:
        #     # Preferred: use the FieldFile delete method
        #     old_file.delete(save=False)
        #     logger.info(f"Deleted old profile picture for user {instance.pk} via field delete.")
        # except Exception as e:
        #     print(f"DEBUG: Error deleting old file: {e}")
        #     # Fallback: try Cloudinary uploader destroy using public_id or name
        #     try:
        #         public_id = getattr(old_file, 'public_id', None) or getattr(old_file, 'name', None)
        #         if public_id:
        #             uploader.destroy(public_id)
        #             logger.info(f"Deleted old profile picture for user {instance.pk} via uploader.destroy.")
        #     except Exception as e2:
        #         logger.exception(f"Failed to delete old profile picture for user {instance.pk}: {e2}")


@receiver(post_delete, sender=CustomUser)
def delete_profile_picture_on_user_delete(sender, instance, **kwargs):
    """
    When a user is deleted, remove their profile picture from Cloudinary.
    """
    try:
        file = instance.profile_picture
        if file:
            try:
                file.delete(save=False)
                logger.info(f"Deleted profile picture on user delete for user {instance.pk}.")
            except Exception:
                public_id = getattr(file, 'public_id', None) or getattr(file, 'name', None)
                if public_id:
                    try:
                        uploader.destroy(public_id)
                        logger.info(f"Deleted profile picture via uploader.destroy on user delete for user {instance.pk}.")
                    except Exception as e:
                        logger.exception(f"Failed to delete profile picture via uploader.destroy: {e}")
    except Exception as e:
        logger.exception(f"Error in post_delete signal for user {getattr(instance, 'pk', 'unknown')}: {e}")

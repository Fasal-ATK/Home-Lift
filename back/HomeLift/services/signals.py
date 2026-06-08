from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from cloudinary.uploader import destroy
from .models import Category, Service


# ---- DELETE CASE ----
@receiver(post_delete, sender=Category)
def delete_category_icon(sender, instance, **kwargs):
    if instance.icon:
        destroy(instance.icon.public_id)

@receiver(post_delete, sender=Service)
def delete_service_icon(sender, instance, **kwargs):
    if instance.icon:
        destroy(instance.icon.public_id)

# ---- UPDATE CASE ----
def is_same_file(old_f, new_f):
    if not old_f and not new_f: return True
    if not old_f or not new_f: return False
    old_id = getattr(old_f, 'public_id', str(old_f))
    new_str = str(new_f)
    new_id = getattr(new_f, 'public_id', new_str)
    return old_id == new_id or old_id in new_str

@receiver(pre_save, sender=Category)
def update_category_icon(sender, instance, **kwargs):
    if not instance.pk:
        return  # New record, no old file to delete
    try:
        old_instance = Category.objects.get(pk=instance.pk)
    except Category.DoesNotExist:
        return
    if old_instance.icon and not is_same_file(old_instance.icon, instance.icon) and old_instance.icon != instance.icon:
        destroy(old_instance.icon.public_id)

@receiver(pre_save, sender=Service)
def update_service_icon(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = Service.objects.get(pk=instance.pk)
    except Service.DoesNotExist:
        return
    if old_instance.icon and not is_same_file(old_instance.icon, instance.icon) and old_instance.icon != instance.icon:
        destroy(old_instance.icon.public_id)

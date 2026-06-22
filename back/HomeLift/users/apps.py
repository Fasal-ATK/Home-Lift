from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        import users.signals
        # Create default superuser if not exists
        from django.conf import settings
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@gmail.com')
        admin_username = getattr(settings, 'ADMIN_USERNAME', 'admin')
        admin_password = getattr(settings, 'ADMIN_PASSWORD', 'admin1234')
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(email=admin_email, username=admin_username, password=admin_password)
            print('SUPERUSER CREATED')
        # Ensure signals are imported
        # Note: keep this import at the end to avoid side effects during migrations
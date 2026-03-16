import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_lift.settings')
django.setup()
from django.core.management import call_command
try:
    print("Starting migration...")
    call_command('migrate', 'providers', interactive=False)
    print("Migration finished!")
except Exception as e:
    print("Error:", e)

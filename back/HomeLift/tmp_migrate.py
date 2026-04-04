import os
import django
import sys
from django.core.management import call_command
from io import StringIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_lift.settings')

try:
    django.setup()
    out = StringIO()
    call_command('makemigrations', 'chat', stdout=out, stderr=out)
    call_command('migrate', stdout=out, stderr=out)
    
    with open('migrate_log.txt', 'w') as f:
        f.write(out.getvalue())
        f.write("\nSuccess!\n")
except Exception as e:
    with open('migrate_log.txt', 'w') as f:
        f.write("Error: " + str(e))

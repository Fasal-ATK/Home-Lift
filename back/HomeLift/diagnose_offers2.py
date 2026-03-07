import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HomeLift.settings')
django.setup()

from offers.models import Offer
from services.models import Service

print("====== OFFERS ======")
for o in Offer.objects.all():
    print(f"ID={o.id} Title='{o.title}' Service={getattr(o.service, 'id', None)} Active={o.is_active} Start={o.start_date} End={o.end_date} Discount={o.discount_value}")

print("\n====== SERVICES ======")
for s in Service.objects.all()[:10]:
    print(f"ID={s.id} Name='{s.name}' Price={s.price}")

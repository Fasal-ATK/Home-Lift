import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HomeLift.settings')
django.setup()

try:
    from offers.models import Offer
    from services.models import Service
    from django.utils import timezone
    from django.db.models import Q

    now = timezone.now().date()
    print(f"DEBUG: Current date is {now}")

    offers = Offer.objects.all()
    print(f"DEBUG: Total offers in DB: {offers.count()}")

    for o in offers:
        print(f"DEBUG: Offer ID={o.id}, Title='{o.title}', Service={o.service_id}, Active={o.is_active}, Start={o.start_date}, End={o.end_date}")

    for s in Service.objects.all():
        # Test the query that runs in the serializer
        active_offer = Offer.objects.filter( 
            Q(service=s) | Q(service__isnull=True), 
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-discount_value').first()
        
        if active_offer:
            print(f"DEBUG: Service '{s.name}' (ID={s.id}) HAS ACTIVE OFFER: {active_offer.title}")
        else:
            print(f"DEBUG: Service '{s.name}' (ID={s.id}) has NO active offer.")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

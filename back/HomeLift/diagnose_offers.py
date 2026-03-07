import os
import django
import sys
from django.utils import timezone

# Add the project directory to sys.path
sys.path.append('d:\\Study\\Brototype\\week 24-28\\back\\HomeLift')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_lift.settings')
django.setup()

from offers.models import Offer
from services.models import Service, Category
from offers.serializers import OfferSerializer

def diagnose():
    now = timezone.now().date()
    print(f"Current Date: {now}")

    all_offers = Offer.objects.all()
    print(f"Total Offers in DB: {all_offers.count()}")

    active_offers = Offer.objects.filter(is_active=True)
    print(f"Total Active Offers (is_active=True): {active_offers.count()}")

    current_offers = active_offers.filter(start_date__lte=now, end_date__gte=now)
    print(f"Total Current Offers (dated): {current_offers.count()}")

    for o in current_offers:
        print(f"  - ID: {o.id}, Title: {o.title}, Cat: {o.category_id}, Srv: {o.service_id}, Start: {o.start_date}, End: {o.end_date}")

    # Test expansion logic
    expanded = []
    seen = set()
    
    # Srv specific
    for o in current_offers.filter(service__isnull=False):
        if o.service_id not in seen:
            expanded.append(o.title)
            seen.add(o.service_id)
            
    # Cat expansion
    for o in current_offers.filter(category__isnull=False, service__isnull=True):
        srvs = Service.objects.filter(category=o.category, is_active=True)
        print(f"  Category '{o.category.name}' has {srvs.count()} active services")
        for s in srvs:
            if s.id not in seen:
                expanded.append(f"{o.title} (expanded: {s.name})")
                seen.add(s.id)
                
    # Global
    for o in current_offers.filter(category__isnull=True, service__isnull=True):
        expanded.append(o.title)
        
    print(f"Expansion count: {len(expanded)}")
    for item in expanded: 
        print(f"  Result -> {item}")

if __name__ == "__main__":
    diagnose()
    
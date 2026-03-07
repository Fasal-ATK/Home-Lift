import os
import django
import sys
from django.utils import timezone

# Add the project directory to sys.path
sys.path.append('d:\\Study\\Brototype\\week 24-28\\back\\HomeLift')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_lift.settings')
django.setup()

from offers.models import Offer
from offers.serializers import OfferSerializer
from rest_framework.renderers import JSONRenderer

def test_public_offers():
    now = timezone.now().date()
    offers = Offer.objects.filter(
        is_active=True,
        start_date__lte=now,
        end_date__gte=now
    ).select_related('category', 'service')
    
    print(f"Total Active Offers found: {offers.count()}")
    
    expanded_data = []
    seen_service_ids = set()

    for offer in offers:
        print(f"Processing offer: {offer.title} (ID: {offer.id})")
        if offer.service:
            if offer.service_id not in seen_service_ids:
                data = OfferSerializer(offer).data
                expanded_data.append(data)
                seen_service_ids.add(offer.service_id)
                print(f"  Added service offer for {offer.service.name}")
        elif offer.category:
            services = offer.category.services.filter(is_active=True)
            print(f"  Found {services.count()} services for category {offer.category.name}")
            for service in services:
                if service.id not in seen_service_ids:
                    data = OfferSerializer(offer).data
                    data['service'] = service.id
                    data['service_name'] = service.name
                    data['service_icon'] = service.icon.url if service.icon else None
                    expanded_data.append(data)
                    seen_service_ids.add(service.id)
                    print(f"    Added expanded service offer for {service.name}")
        else:
            print("  Offer has no category or service - skip")

    print(f"Final Expanded Data Count: {len(expanded_data)}")
    for item in expanded_data:
        print(f"  - {item.get('service_name')} : {item.get('title')}")

if __name__ == "__main__":
    test_public_offers()

import os
import django
import sys
from decimal import Decimal
from django.utils import timezone

# Add the project directory to sys.path
sys.path.append('d:\\Study\\Brototype\\week 24-28\\back\\HomeLift')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_lift.settings')
django.setup()

from bookings.models import Booking
from services.models import Service, Category
from offers.models import Offer
from users.models import User
from core.models import Address
from rest_framework import serializers

# Mock Request for context
class MockRequest:
    def __init__(self, user):
        self.user = user

def test_booking_discount():
    now = timezone.now().date()
    
    # 1. Setup/Get data
    user = User.objects.filter(is_staff=False).first()
    if not user:
        print("No user found for testing")
        return
        
    service = Service.objects.filter(is_active=True).first()
    if not service:
        print("No service found for testing")
        return
        
    address = Address.objects.filter(user=user).first()
    if not address:
        # Create a temp address if needed
        address = Address.objects.create(
            user=user, title="Home", address_line="Test", city="Test", state="Test", postal_code="123456"
        )
        
    # 2. Ensure an active offer exists for this service or its category
    Offer.objects.filter(service=service).delete() # Cleanup
    Offer.objects.filter(category=service.category, service__isnull=True).delete()
    
    offer = Offer.objects.create(
        title="Test 50% Off",
        discount_type='percentage',
        discount_value=50,
        start_date=now - timezone.timedelta(days=1),
        end_date=now + timezone.timedelta(days=30),
        is_active=True,
        service=service
    )
    
    print(f"Service: {service.name}, Base Price: {service.price}")
    print(f"Offer: {offer.title}, Type: {offer.discount_type}, Value: {offer.discount_value}")
    
    # 3. Simulate Booking Creation via Serializer
    from bookings.serializers import BookingSerializer
    
    data = {
        "service": service.id,
        "full_name": "Test User",
        "phone": "1234567890",
        "address": address.id,
        "booking_date": str(now + timezone.timedelta(days=1)),
        "booking_time": "10:00:00",
        "price": float(service.price) # Frontend sends full price
    }
    
    serializer = BookingSerializer(data=data, context={'request': MockRequest(user)})
    if serializer.is_valid():
        booking = serializer.save()
        print(f"Booking Created Successfully ID: {booking.id}")
        print(f"Stored Price in DB: {booking.price} (Expected: {service.price * Decimal('0.5')})")
        print(f"Stored Advance in DB: {booking.advance}")
        
        # Verify
        expected_price = service.price * Decimal('0.5')
        if abs(booking.price - expected_price) < 0.01:
            print("✅ SUCCESS: Price correctly discounted!")
        else:
            print(f"❌ FAILURE: Price mismatch! Expected {expected_price}, got {booking.price}")
            
        booking.delete()
    else:
        print(f"❌ FAILURE: Serializer errors: {serializer.errors}")
        
    # Cleanup
    offer.delete()

if __name__ == "__main__":
    test_booking_discount()

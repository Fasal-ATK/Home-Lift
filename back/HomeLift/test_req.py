import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HomeLift.settings')
django.setup()

from users.models import CustomUser
from providers.models import ProviderDetails
from providers.views import ProviderMyServiceRequestsView
from rest_framework.test import APIRequestFactory
import traceback

try:
    u = CustomUser.objects.get(email='rulleracc1@gmail.com')
    print("User:", u)
    factory = APIRequestFactory()
    request = factory.get('/provider/my-service-requests/')
    request.user = u
    view = ProviderMyServiceRequestsView.as_view()
    response = view(request)
    print(response.status_code)
    print(response.data)
except Exception as e:
    traceback.print_exc()

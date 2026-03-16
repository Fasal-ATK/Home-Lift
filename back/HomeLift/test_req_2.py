import sys
sys.stdout = open('test_req.log','w')
sys.stderr = sys.stdout

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Home_Lift.settings')
django.setup()

from users.models import CustomUser
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
    print("Status:", response.status_code)
    try:
        response.render()
        print(response.content)
    except Exception as e2:
         traceback.print_exc()
except Exception as e:
    traceback.print_exc()

sys.stdout.close()

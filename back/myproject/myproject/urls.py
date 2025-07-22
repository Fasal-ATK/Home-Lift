from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('superuser/', admin.site.urls),
    path('user/', include('users.urls')),
    path('admin/', include('admins.urls')),
]

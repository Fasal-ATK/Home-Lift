#django URL configuration 
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('superuser/', admin.site.urls),
    path('user/', include('users.urls')),
    path('admin/', include('admins.urls')),
    path('services/', include('services.urls')),
    path('provider/', include('providers.urls')),
    path('booking/', include('bookings.urls')),
    path('core/', include('core.urls')),
    # path('review/', include('reviews.urls')),
    # path('payment/', include('payments.urls')),
    path('notification/', include('notifications.urls')),

]

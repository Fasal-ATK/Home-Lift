from django.urls import path
from .views import (
    ProviderApplicationCreateView,
    ProviderApplicationListView,
    ProviderApplicationUpdateStatusView
)

urlpatterns = [
    path('apply/', ProviderApplicationCreateView.as_view(), name='provider-apply'),

    path('my-applications/', ProviderApplicationListView.as_view(), name='my-applications'),
    path('admin/application/<int:id>/update/', ProviderApplicationUpdateStatusView.as_view(), name='admin-application-update'),
]


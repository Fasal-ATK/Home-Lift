from django.urls import path
from .views import NotificationListView, NotificationDetailView, NotificationBulkActionView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('bulk/', NotificationBulkActionView.as_view(), name='notification-bulk-action'),
    path('<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
]

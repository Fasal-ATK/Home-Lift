from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ProviderApplication, ProviderDetails, ProviderService, ProviderServiceRequest
from .serializers import (
    ProviderApplicationSerializer,
    ProviderDetailsSerializer,
    ProviderServiceSerializer,
    ProviderServiceSerializer,
    ProviderServiceRequestSerializer,
)
from core.permissions import IsNormalUser, IsAdminUserCustom, IsProviderUser
from bookings.models import Booking, Review
from services.models import Service
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth
from decimal import Decimal
import logging
import json

logger = logging.getLogger(__name__)

# ------------------------------
# Submit Provider Application
# ------------------------------
class ProviderApplicationCreateAPIView(APIView):
    permission_classes = [IsNormalUser]

    def post(self, request, *args, **kwargs):
        # 🔍 View-level guard
        if ProviderApplication.objects.filter(
            user=request.user,
            status__in=["pending", "approved"]
        ).exists():
            return Response(
                {"detail": "You already have an active or pending application."},
                status=status.HTTP_400_BAD_REQUEST
            )

        services_json = request.data.get("services")
        if services_json:
            try:
                services = json.loads(services_json)
                for i, service in enumerate(services):
                    file_key = f"service_doc_{i}"
                    if file_key in request.FILES:
                        service["id_doc"] = request.FILES[file_key]
            except Exception as e:
                return Response({"services": [f"Invalid format: {e}"]}, status=400)
        else:
            services = []

        payload = {
            "id_doc": request.FILES.get("id_doc"),
            "services": services,
            "user": request.user.id,
        }

        serializer = ProviderApplicationSerializer(
            data=payload, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.permissions import IsAuthenticated

class ProviderApplicationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Get the latest application for the user
        application = ProviderApplication.objects.filter(user=request.user).order_by('-created_at').first()
        
        if not application:
            # No application exists
            return Response({
                "status": None,
                "rejection_reason": None,
                "is_active": True
            }, status=status.HTTP_200_OK)

        # Use serializer for validation/formatting but only return needed fields
        serializer = ProviderApplicationSerializer(application, context={"request": request})
        data = serializer.data

        response_data = {
            "status": data["status"],
            "rejection_reason": data["rejection_reason"],
            "is_active": True  # Default
        }

        # If approved, get the actual active status
        if data["status"] == "approved":
            from .models import ProviderDetails
            details = ProviderDetails.objects.filter(user=request.user).first()
            if details:
                response_data["is_active"] = details.is_active

        return Response(response_data, status=status.HTTP_200_OK)



# ------------------------------
# List Current Users Applications
# ------------------------------
class ProviderApplicationListAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        from core.pagination import StandardResultsSetPagination
        applications = ProviderApplication.objects.filter(status__in=['pending']).order_by('-created_at')
        paginator = StandardResultsSetPagination()
        result_page = paginator.paginate_queryset(applications, request)
        serializer = ProviderApplicationSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ProviderApplicationUpdateStatusAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, id, *args, **kwargs):
        try:
            application = ProviderApplication.objects.get(id=id)
        except ProviderApplication.DoesNotExist:
            return Response({'detail': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        rejection_reason = request.data.get('rejection_reason', '')

        if status_value not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        application.status = status_value
        application.rejection_reason = rejection_reason if status_value == 'rejected' else ''
        application.replied_at = timezone.now()
        application.save()

        serializer = ProviderApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)



# ------------------------------
# Provider MANAGEMENT
# ------------------------------

class ProvidersListAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        from core.pagination import StandardResultsSetPagination
        from django.db.models import Q
        
        providers = ProviderDetails.objects.all().select_related('user').order_by('-created_at')

        # Filter: Search
        search_query = request.query_params.get('search')
        if search_query:
            providers = providers.filter(
                Q(user__username__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__phone_number__icontains=search_query)
            )

        # Filter: Status
        status_filter = request.query_params.get('status') # 'active' or 'inactive' or 'all'
        # Frontend ProviderManager sends 'active' or 'inactive'. If 'all', it ignores.
        # Wait, Frontend ProviderManager sends:
        # const matchesFilter = filter === 'all' ? true : filter === 'active' ? p.is_active : !p.is_active;
        # So I should accept 'status' param as 'active' / 'inactive'.
        
        if status_filter == 'active':
            providers = providers.filter(is_active=True)
        elif status_filter == 'inactive':
            providers = providers.filter(is_active=False)

        paginator = StandardResultsSetPagination()
        result_page = paginator.paginate_queryset(providers, request)
        serializer = ProviderDetailsSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

class ProviderDetailAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get_object(self, id):
        try:
            return ProviderDetails.objects.get(id=id)
        except ProviderDetails.DoesNotExist:
            return None

    def get(self, request, id, *args, **kwargs):
        provider = self.get_object(id)
        if not provider:
            return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProviderDetailsSerializer(provider)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, id, *args, **kwargs):
        provider = self.get_object(id)
        if not provider:
            return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProviderDetailsSerializer(provider, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# ------------------------------
# Get Current Provider Details (Me)
# ------------------------------
class ProviderMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            provider = ProviderDetails.objects.get(user=request.user)
        except ProviderDetails.DoesNotExist:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProviderDetailsSerializer(provider)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        try:
            provider = ProviderDetails.objects.get(user=request.user)
        except ProviderDetails.DoesNotExist:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Allow updating stripe_account_id
        if 'stripe_account_id' in request.data:
            provider.stripe_account_id = request.data['stripe_account_id']
            provider.save()
            return Response(ProviderDetailsSerializer(provider).data, status=status.HTTP_200_OK)
        
        return Response({"detail": "No valid fields to update."}, status=status.HTTP_400_BAD_REQUEST)


# ------------------------------
# Provider Service Requests  (provider side)
# ------------------------------
class ProviderMyServiceRequestsView(APIView):
    """GET  → list all of the provider's own service requests.
       POST → submit a new service-addition request (pending admin approval)."""
    permission_classes = [IsProviderUser]

    def _get_provider(self, user):
        try:
            return ProviderDetails.objects.get(user=user)
        except ProviderDetails.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        provider = self._get_provider(request.user)
        if not provider:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        requests_qs = ProviderServiceRequest.objects.filter(provider=provider) \
            .select_related('service', 'service__category')
        serializer = ProviderServiceRequestSerializer(requests_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        provider = self._get_provider(request.user)
        if not provider:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        service_id = request.data.get('service')
        if not service_id:
            return Response({"detail": "service field is required."}, status=status.HTTP_400_BAD_REQUEST)

        from services.models import Service as ServiceModel
        try:
            service_obj = ServiceModel.objects.get(pk=service_id, is_active=True)
        except ServiceModel.DoesNotExist:
            return Response({"detail": "Service not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # Guard: already an approved ProviderService?
        if ProviderService.objects.filter(provider=provider, service=service_obj).exists():
            return Response(
                {"detail": "You already offer this service."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Guard: already a pending request for this service?
        if ProviderServiceRequest.objects.filter(
            provider=provider, service=service_obj, status='pending'
        ).exists():
            return Response(
                {"detail": "You already have a pending request for this service."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ProviderServiceRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(provider=provider, service=service_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderMyServiceRequestDetailView(APIView):
    """DELETE → cancel a pending request."""
    permission_classes = [IsProviderUser]

    def _get_request(self, pk, user):
        try:
            provider = ProviderDetails.objects.get(user=user)
            return ProviderServiceRequest.objects.get(pk=pk, provider=provider)
        except (ProviderDetails.DoesNotExist, ProviderServiceRequest.DoesNotExist):
            return None

    def delete(self, request, pk, *args, **kwargs):
        sr = self._get_request(pk, request.user)
        if not sr:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)
        if sr.status != 'pending':
            return Response(
                {"detail": "Only pending requests can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )
        sr.delete()
        return Response({"detail": "Request cancelled."}, status=status.HTTP_204_NO_CONTENT)


class ProviderMyServiceDetailView(APIView):
    """PATCH → update active service (price, experience).
       DELETE → remove the service from provider's catalog."""
    permission_classes = [IsProviderUser]

    def _get_ps(self, pk, user):
        try:
            provider = ProviderDetails.objects.get(user=user)
            return ProviderService.objects.get(pk=pk, provider=provider)
        except (ProviderDetails.DoesNotExist, ProviderService.DoesNotExist):
            return None

    def patch(self, request, pk, *args, **kwargs):
        ps = self._get_ps(pk, request.user)
        if not ps:
            return Response({"detail": "Active service not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProviderServiceSerializer(ps, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        ps = self._get_ps(pk, request.user)
        if not ps:
            return Response({"detail": "Active service not found."}, status=status.HTTP_404_NOT_FOUND)
        
        ps.delete()
        return Response({"detail": "Service removed from your profile."}, status=status.HTTP_204_NO_CONTENT)


# -----------------------------------------------
# Admin — Review service requests
# -----------------------------------------------
class AdminServiceRequestListView(APIView):
    """GET → list all pending service requests (admin only)."""
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        from core.pagination import StandardResultsSetPagination
        qs = ProviderServiceRequest.objects.filter(status='pending') \
            .select_related('provider__user', 'service', 'service__category') \
            .order_by('-created_at')
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProviderServiceRequestSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminServiceRequestActionView(APIView):
    """PATCH → approve or reject a service request.
    Approving automatically creates the ProviderService entry."""
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, pk, *args, **kwargs):
        try:
            sr = ProviderServiceRequest.objects.select_related(
                'provider', 'service'
            ).get(pk=pk)
        except ProviderServiceRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('status')
        if action not in ('approved', 'rejected'):
            return Response({"detail": "status must be 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        rejection_reason = request.data.get('rejection_reason', '')
        if action == 'rejected' and not rejection_reason:
            return Response({"detail": "rejection_reason is required when rejecting."}, status=status.HTTP_400_BAD_REQUEST)

        sr.status = action
        sr.replied_at = timezone.now()
        if action == 'rejected':
            sr.rejection_reason = rejection_reason
        sr.save()

        if action == 'approved':
            # Create ProviderService only if not already present
            ProviderService.objects.get_or_create(
                provider=sr.provider,
                service=sr.service,
                defaults={
                    'price': sr.price,
                    'experience_years': sr.experience_years,
                    'is_active': True,
                    'doc': sr.doc,
                }
            )

        serializer = ProviderServiceRequestSerializer(sr)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProviderDashboardView(APIView):
    """
    GET /provider/dashboard/stats/  → Stats for the provider dashboard
    """
    permission_classes = [IsProviderUser]

    def get(self, request):
        provider_user = request.user
        
        now = timezone.now()
        time_range = request.query_params.get('time_range', 'all_time')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        date_filter = None
        end_date_filter = None

        if start_date and end_date:
            from datetime import datetime, timedelta
            date_filter = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
            end_date_filter = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d')).replace(hour=23, minute=59, second=59)
        elif time_range == 'this_week':
            from datetime import timedelta
            date_filter = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_range == 'this_month':
            date_filter = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif time_range == '6_months':
            from datetime import timedelta
            date_filter = now - timedelta(days=180)
        elif time_range == '1_year':
            from datetime import timedelta
            date_filter = now - timedelta(days=365)

        bookings_qs = Booking.objects.filter(provider=provider_user)
        
        if date_filter:
            bookings_qs = bookings_qs.filter(created_at__gte=date_filter)
        if end_date_filter:
            bookings_qs = bookings_qs.filter(created_at__lte=end_date_filter)
        
        # 📊 Overall Counts
        total_bookings = bookings_qs.count()
        completed_qs = bookings_qs.filter(status='completed')
        
        total_revenue = completed_qs.aggregate(Sum('price'))['price__sum'] or Decimal('0')
        # Platform takes 7% (History logic: your earnings = price * 0.93)
        your_earnings = total_revenue * Decimal('0.93')
        
        active_customers = bookings_qs.values('user').distinct().count()

        # ⭐ Average Rating
        avg_rating = Review.objects.filter(provider=provider_user).aggregate(Avg('rating'))['rating__avg'] or 0.0
        avg_rating = round(float(avg_rating), 1)
        
        # 📈 Monthly Data (Last 6 Months)
        monthly_stats = bookings_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(
            bookings=Count('id'),
            revenue=Sum('price')
        ).order_by('month')[:6]
        
        formatted_monthly = []
        for s in monthly_stats:
            month_str = s['month'].strftime('%b') if s['month'] else 'Unknown'
            formatted_monthly.append({
                "month": month_str,
                "bookings": s['bookings'],
                "revenue": float(s['revenue'] or 0) * 0.93 # your share
            })

        # 🥧 Booking Status Breakdown
        status_counts = bookings_qs.values('status').annotate(count=Count('status'))
        role_data = []
        for s in status_counts:
            role_data.append({
                "name": s['status'].replace('_', ' ').capitalize(),
                "value": s['count']
            })

        data = {
            "stats": {
                "total_bookings": total_bookings,
                "total_revenue": float(your_earnings),
                "active_customers": active_customers,
                "avg_rating": avg_rating,
            },
            "monthly_data": formatted_monthly,
            "status_data": role_data,
        }
        return Response(data)


class ProvidersByServiceView(APIView):
    """
    GET /provider/available-providers/?service_id=X
    Returns a list of active providers that offer the given service.
    """
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        service_id = request.query_params.get('service_id')
        if not service_id:
            return Response({"detail": "service_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({"detail": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

        # Find ProviderDetails who have this service in their approved 'ProviderService' list
        # And are active.
        provider_services = ProviderService.objects.filter(
            service=service,
            provider__is_active=True
        ).select_related('provider__user')

        results = []
        for ps in provider_services:
            user = ps.provider.user
            results.append({
                "id": user.id,
                "full_name": f"{user.first_name} {user.last_name}" if user.first_name else user.username,
                "email": user.email,
                "phone": user.phone_number
            })
        
        return Response(results)

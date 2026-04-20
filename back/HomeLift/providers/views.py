import logging
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth
from decimal import Decimal

from .models import ProviderApplication, ProviderDetails, ProviderService, ProviderServiceRequest
from .serializers import (
    ProviderApplicationSerializer,
    ProviderDetailsSerializer,
    ProviderServiceSerializer,
    ProviderServiceRequestSerializer,
)
from core.permissions import IsNormalUser, IsAdminUserCustom, IsProviderUser
from bookings.models import Booking, Review
from services.models import Service

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Submit Provider Application
# ──────────────────────────────────────────────────────────────────────────────
class ProviderApplicationCreateAPIView(APIView):
    permission_classes = [IsNormalUser]

    def post(self, request, *args, **kwargs):
        try:
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
                    return Response({"services": [f"Invalid format: {e}"]}, status=status.HTTP_400_BAD_REQUEST)
            else:
                services = []

            payload = {
                "id_doc": request.FILES.get("id_doc"),
                "services": services,
                "user": request.user.id,
            }

            serializer = ProviderApplicationSerializer(data=payload, context={"request": request})
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("ProviderApplicationCreateAPIView.post failed for user %s: %s", request.user.id, e)
            return Response(
                {"detail": "Failed to submit application. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ──────────────────────────────────────────────────────────────────────────────
# Provider Application Status (User)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderApplicationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            application = ProviderApplication.objects.filter(
                user=request.user
            ).order_by('-created_at').first()

            if not application:
                return Response({
                    "status": None,
                    "rejection_reason": None,
                    "is_active": True
                }, status=status.HTTP_200_OK)

            serializer = ProviderApplicationSerializer(application, context={"request": request})
            data = serializer.data

            response_data = {
                "status": data["status"],
                "rejection_reason": data["rejection_reason"],
                "is_active": True
            }

            if data["status"] == "approved":
                details = ProviderDetails.objects.filter(user=request.user).first()
                if details:
                    response_data["is_active"] = details.is_active

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("ProviderApplicationStatusView.get failed for user %s: %s", request.user.id, e)
            return Response(
                {"detail": "Failed to fetch application status. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ──────────────────────────────────────────────────────────────────────────────
# List Applications (Admin)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderApplicationListAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        try:
            from core.pagination import StandardResultsSetPagination
            applications = ProviderApplication.objects.filter(
                status__in=['pending']
            ).order_by('-created_at')
            paginator = StandardResultsSetPagination()
            result_page = paginator.paginate_queryset(applications, request)
            serializer = ProviderApplicationSerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger.exception("ProviderApplicationListAPIView.get failed: %s", e)
            return Response(
                {"detail": "Failed to fetch applications."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ──────────────────────────────────────────────────────────────────────────────
# Approve / Reject Application (Admin)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderApplicationUpdateStatusAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, id, *args, **kwargs):
        try:
            try:
                application = ProviderApplication.objects.get(id=id)
            except ProviderApplication.DoesNotExist:
                return Response({'detail': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

            status_value = request.data.get('status')
            rejection_reason = request.data.get('rejection_reason', '')

            if status_value not in ['approved', 'rejected']:
                return Response({'detail': 'Invalid status. Must be "approved" or "rejected".'}, status=status.HTTP_400_BAD_REQUEST)

            if status_value == 'rejected' and not rejection_reason.strip():
                return Response({'detail': 'rejection_reason is required when rejecting.'}, status=status.HTTP_400_BAD_REQUEST)

            application.status = status_value
            application.rejection_reason = rejection_reason if status_value == 'rejected' else ''
            application.replied_at = timezone.now()
            application.save()

            serializer = ProviderApplicationSerializer(application)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("ProviderApplicationUpdateStatusAPIView.patch failed for id %s: %s", id, e)
            return Response(
                {"detail": "Failed to update application status."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ──────────────────────────────────────────────────────────────────────────────
# Provider List (Admin)
# ──────────────────────────────────────────────────────────────────────────────
class ProvidersListAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        try:
            from core.pagination import StandardResultsSetPagination
            providers = ProviderDetails.objects.all().select_related('user').order_by('-created_at')

            search_query = request.query_params.get('search')
            if search_query:
                providers = providers.filter(
                    Q(user__username__icontains=search_query) |
                    Q(user__email__icontains=search_query) |
                    Q(user__first_name__icontains=search_query) |
                    Q(user__last_name__icontains=search_query) |
                    Q(user__phone_number__icontains=search_query)
                )

            status_filter = request.query_params.get('status')
            if status_filter == 'active':
                providers = providers.filter(is_active=True)
            elif status_filter == 'inactive':
                providers = providers.filter(is_active=False)

            paginator = StandardResultsSetPagination()
            result_page = paginator.paginate_queryset(providers, request)
            serializer = ProviderDetailsSerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)

        except Exception as e:
            logger.exception("ProvidersListAPIView.get failed: %s", e)
            return Response(
                {"detail": "Failed to fetch providers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ──────────────────────────────────────────────────────────────────────────────
# Provider Detail (Admin)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderDetailAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def _get_object(self, id):
        try:
            return ProviderDetails.objects.get(id=id)
        except ProviderDetails.DoesNotExist:
            return None

    def get(self, request, id, *args, **kwargs):
        provider = self._get_object(id)
        if not provider:
            return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProviderDetailsSerializer(provider)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, id, *args, **kwargs):
        try:
            provider = self._get_object(id)
            if not provider:
                return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)

            serializer = ProviderDetailsSerializer(provider, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("ProviderDetailAPIView.patch failed for id %s: %s", id, e)
            return Response(
                {"detail": "Failed to update provider."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ──────────────────────────────────────────────────────────────────────────────
# Get Current Provider Details (Me)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            provider = ProviderDetails.objects.get(user=request.user)
        except ProviderDetails.DoesNotExist:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("ProviderMeView.get failed for user %s: %s", request.user.id, e)
            return Response({"detail": "Failed to fetch provider profile."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = ProviderDetailsSerializer(provider)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        try:
            provider = ProviderDetails.objects.get(user=request.user)
        except ProviderDetails.DoesNotExist:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            if 'stripe_account_id' in request.data:
                provider.stripe_account_id = request.data['stripe_account_id']
                provider.save(update_fields=['stripe_account_id'])
                return Response(ProviderDetailsSerializer(provider).data, status=status.HTTP_200_OK)
            return Response({"detail": "No valid fields to update."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("ProviderMeView.patch failed for user %s: %s", request.user.id, e)
            return Response({"detail": "Failed to update provider profile."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────────────────
# Provider Service Requests (provider side)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderMyServiceRequestsView(APIView):
    """GET → list own service requests. POST → submit a new request."""
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
        try:
            qs = ProviderServiceRequest.objects.filter(provider=provider) \
                .select_related('service', 'service__category')
            serializer = ProviderServiceRequestSerializer(qs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("ProviderMyServiceRequestsView.get failed for user %s: %s", request.user.id, e)
            return Response({"detail": "Failed to fetch service requests."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, *args, **kwargs):
        provider = self._get_provider(request.user)
        if not provider:
            return Response({"detail": "Provider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            service_id = request.data.get('service')
            if not service_id:
                return Response({"detail": "service field is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                service_obj = Service.objects.get(pk=service_id, is_active=True)
            except Service.DoesNotExist:
                return Response({"detail": "Service not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

            if ProviderService.objects.filter(provider=provider, service=service_obj).exists():
                return Response({"detail": "You already offer this service."}, status=status.HTTP_400_BAD_REQUEST)

            if ProviderServiceRequest.objects.filter(
                provider=provider, service=service_obj, status='pending'
            ).exists():
                return Response({"detail": "You already have a pending request for this service."}, status=status.HTTP_400_BAD_REQUEST)

            serializer = ProviderServiceRequestSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(provider=provider, service=service_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("ProviderMyServiceRequestsView.post failed for user %s: %s", request.user.id, e)
            return Response({"detail": "Failed to submit service request."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────────────────
# Cancel a Pending Service Request (Provider)
# ──────────────────────────────────────────────────────────────────────────────
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
        try:
            sr = self._get_request(pk, request.user)
            if not sr:
                return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)
            if sr.status != 'pending':
                return Response({"detail": "Only pending requests can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            sr.delete()
            return Response({"detail": "Request cancelled."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception("ProviderMyServiceRequestDetailView.delete failed for pk %s user %s: %s",
                             pk, request.user.id, e)
            return Response({"detail": "Failed to cancel service request."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────────────────
# Update / Remove Active Service (Provider)
# ──────────────────────────────────────────────────────────────────────────────
class ProviderMyServiceDetailView(APIView):
    """PATCH → update active service (experience). DELETE → remove service."""
    permission_classes = [IsProviderUser]

    def _get_ps(self, pk, user):
        try:
            provider = ProviderDetails.objects.get(user=user)
            return ProviderService.objects.get(pk=pk, provider=provider)
        except (ProviderDetails.DoesNotExist, ProviderService.DoesNotExist):
            return None

    def patch(self, request, pk, *args, **kwargs):
        try:
            ps = self._get_ps(pk, request.user)
            if not ps:
                return Response({"detail": "Active service not found."}, status=status.HTTP_404_NOT_FOUND)
            serializer = ProviderServiceSerializer(ps, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("ProviderMyServiceDetailView.patch failed for pk %s user %s: %s",
                             pk, request.user.id, e)
            return Response({"detail": "Failed to update service."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk, *args, **kwargs):
        try:
            ps = self._get_ps(pk, request.user)
            if not ps:
                return Response({"detail": "Active service not found."}, status=status.HTTP_404_NOT_FOUND)
            ps.delete()
            return Response({"detail": "Service removed from your profile."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception("ProviderMyServiceDetailView.delete failed for pk %s user %s: %s",
                             pk, request.user.id, e)
            return Response({"detail": "Failed to remove service."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────────────────
# Admin — Review Service Requests
# ──────────────────────────────────────────────────────────────────────────────
class AdminServiceRequestListView(APIView):
    """GET → list all pending service requests (admin only)."""
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        try:
            from core.pagination import StandardResultsSetPagination
            qs = ProviderServiceRequest.objects.filter(status='pending') \
                .select_related('provider__user', 'service', 'service__category') \
                .order_by('-created_at')
            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(qs, request)
            serializer = ProviderServiceRequestSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger.exception("AdminServiceRequestListView.get failed: %s", e)
            return Response({"detail": "Failed to fetch service requests."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminServiceRequestActionView(APIView):
    """PATCH → approve or reject a service request."""
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, pk, *args, **kwargs):
        try:
            try:
                sr = ProviderServiceRequest.objects.select_related('provider', 'service').get(pk=pk)
            except ProviderServiceRequest.DoesNotExist:
                return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

            action = request.data.get('status')
            if action not in ('approved', 'rejected'):
                return Response({"detail": "status must be 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

            rejection_reason = request.data.get('rejection_reason', '')
            if action == 'rejected' and not rejection_reason.strip():
                return Response({"detail": "rejection_reason is required when rejecting."}, status=status.HTTP_400_BAD_REQUEST)

            sr.status = action
            sr.replied_at = timezone.now()
            if action == 'rejected':
                sr.rejection_reason = rejection_reason
            sr.save()

            if action == 'approved':
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

        except Exception as e:
            logger.exception("AdminServiceRequestActionView.patch failed for pk %s: %s", pk, e)
            return Response({"detail": "Failed to process request."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────────────────
# Provider Dashboard
# ──────────────────────────────────────────────────────────────────────────────
class ProviderDashboardView(APIView):
    """GET /provider/dashboard/stats/ → Stats for the provider dashboard."""
    permission_classes = [IsProviderUser]

    def get(self, request):
        try:
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
                end_date_filter = timezone.make_aware(
                    datetime.strptime(end_date, '%Y-%m-%d')
                ).replace(hour=23, minute=59, second=59)
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

            total_bookings = bookings_qs.count()
            completed_qs = bookings_qs.filter(status='completed')
            total_revenue = completed_qs.aggregate(Sum('price'))['price__sum'] or Decimal('0')
            your_earnings = total_revenue * Decimal('0.93')
            active_customers = bookings_qs.values('user').distinct().count()

            avg_rating = Review.objects.filter(
                provider=provider_user
            ).aggregate(Avg('rating'))['rating__avg'] or 0.0
            avg_rating = round(float(avg_rating), 1)

            monthly_stats = bookings_qs.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                bookings=Count('id'),
                revenue=Sum('price')
            ).order_by('month')[:6]

            formatted_monthly = [
                {
                    "month": s['month'].strftime('%b') if s['month'] else 'Unknown',
                    "bookings": s['bookings'],
                    "revenue": float(s['revenue'] or 0) * 0.93
                }
                for s in monthly_stats
            ]

            status_counts = bookings_qs.values('status').annotate(count=Count('status'))
            role_data = [
                {"name": s['status'].replace('_', ' ').capitalize(), "value": s['count']}
                for s in status_counts
            ]

            return Response({
                "stats": {
                    "total_bookings": total_bookings,
                    "total_revenue": float(your_earnings),
                    "active_customers": active_customers,
                    "avg_rating": avg_rating,
                },
                "monthly_data": formatted_monthly,
                "status_data": role_data,
            })

        except Exception as e:
            logger.exception("ProviderDashboardView.get failed for user %s: %s", request.user.id, e)
            return Response({"detail": "Failed to load dashboard stats."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────────────────────────────
# Providers by Service (Admin — for booking assignment)
# ──────────────────────────────────────────────────────────────────────────────
class ProvidersByServiceView(APIView):
    """GET /provider/available-providers/?service_id=X"""
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        try:
            service_id = request.query_params.get('service_id')
            if not service_id:
                return Response({"detail": "service_id is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                service = Service.objects.get(id=service_id)
            except Service.DoesNotExist:
                return Response({"detail": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

            provider_services = ProviderService.objects.filter(
                service=service,
                provider__is_active=True
            ).select_related('provider__user')

            results = []
            for ps in provider_services:
                user = ps.provider.user
                results.append({
                    "id": user.id,
                    "full_name": f"{user.first_name} {user.last_name}".strip() or user.username,
                    "email": user.email,
                    "phone": user.phone_number
                })

            return Response(results)

        except Exception as e:
            logger.exception("ProvidersByServiceView.get failed: %s", e)
            return Response({"detail": "Failed to fetch available providers."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

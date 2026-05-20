# import random
# import logging

# from django.conf import settings
# from django.core.cache import cache
# from django.core.mail import send_mail
# from django.shortcuts import get_object_or_404

# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework_simplejwt.tokens import RefreshToken, TokenError

# from google.oauth2 import id_token
# from google.auth.transport import requests

# from users.models import CustomUser

# logger = logging.getLogger(__name__)

# # Create your views here.
# class VerifyOtpView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")
#         if not email or not otp:
#             return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

#         cached_otp = cache.get(f"otp_{email}")
#         if cached_otp == otp:
#             cache.delete(f"otp_{email}")
#             return Response({"message": "OTP verified"}, status=status.HTTP_200_OK)

#         return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
    


# class SendOtpView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         if not email:
#             return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

#         if CustomUser.objects.filter(email=email).exists():
#             return Response({"error": "Email is already registered"}, status=status.HTTP_400_BAD_REQUEST)

#         otp = str(random.randint(100000, 999999))
#         print(otp)
#         cache.set(f"otp_{email}", otp, timeout=300)  # 5 minutes

#         send_mail(
#             subject="Your OTP Code",
#             message=f"Your OTP is: {otp}",
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             recipient_list=[email],
#         )
#         return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)


# class RefreshtokenView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         try:
#             refresh_token = request.COOKIES.get("refresh")
#             if not refresh_token:
#                 return Response({"error": "Refresh token not found"}, status=status.HTTP_400_BAD_REQUEST)

#             token = RefreshToken(refresh_token)
#             return Response({"access": str(token.access_token), "message": "Token refreshed successfully"}, status=status.HTTP_200_OK)

#         except TokenError as e:
#             return Response({"error": "invalid-token", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             logger.error("Token refresh error: %s", str(e))
#             return Response({"error": "internal-error", "message": "Unexpected error. Try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import Address, Ticket
from .serializers import AddressSerializer, TicketSerializer
from .permissions import IsAdminUserCustom
from users.models import CustomUser
from providers.models import ProviderDetails
from bookings.models import Booking, Review
from django.db.models import Sum, Count, Avg
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta


class AddressListCreateView(APIView):
    """
    Handles:
    - GET /user/address/ → List all user addresses
    - POST /user/address/ → Create a new address
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user=request.user)
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AddressSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    """
    Handles:
    - GET /user/address/<id>/ → Retrieve single address
    - PATCH /user/address/<id>/ → Update address
    - DELETE /user/address/<id>/ → Delete address
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Address, pk=pk, user=user)

    def get(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = AddressSerializer(address)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = AddressSerializer(address, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        address = self.get_object(pk, request.user)
        address.delete()
        return Response({"message": "Address deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# ─── Ticket Views ────────────────────────────────────────────────────────────

class TicketListCreateView(APIView):
    """
    GET  /core/tickets/        → User's own tickets
    POST /core/tickets/        → Submit a new ticket (user or provider)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tickets = Ticket.objects.filter(user=request.user).order_by('-created_at')
        return Response(TicketSerializer(tickets, many=True).data)

    def post(self, request):
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketDetailView(APIView):
    """
    GET /core/tickets/<pk>/  → View a single ticket (owner only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk, user=request.user)
        return Response(TicketSerializer(ticket).data)


class AdminTicketListView(APIView):
    """
    GET  /core/admin/tickets/          → All tickets
    """
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        from core.pagination import StandardResultsSetPagination
        from django.db.models import Q
        
        status_filter = request.query_params.get('status')
        type_filter   = request.query_params.get('ticket_type')
        search        = request.query_params.get('search')
        
        qs = Ticket.objects.all().order_by('-created_at')
        
        if status_filter:
            qs = qs.filter(status=status_filter)
        if type_filter:
            qs = qs.filter(ticket_type=type_filter)
        if search:
            qs = qs.filter(
                Q(subject__icontains=search) |
                Q(description__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search)
            )
            
        paginator = StandardResultsSetPagination()
        result_page = paginator.paginate_queryset(qs, request)
        serializer = TicketSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminTicketReplyView(APIView):
    """
    PATCH /core/admin/tickets/<pk>/reply/  → Admin replies & updates status
    """
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk)
        reply  = request.data.get('admin_reply', '').strip()
        new_status = request.data.get('status', ticket.status)

        if new_status not in dict(Ticket.STATUS_CHOICES):
            return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        ticket.admin_reply = reply
        ticket.status = new_status
        ticket.save(update_fields=['admin_reply', 'status', 'updated_at'])
        return Response(TicketSerializer(ticket).data)


class AdminDashboardView(APIView):
    """
    GET /core/admin/dashboard/  → Stats for the admin dashboard
    """
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        now = timezone.now()
        time_range = request.query_params.get('time_range', 'all_time')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        date_filter = None
        end_date_filter = None

        if start_date and end_date:
            from datetime import datetime
            date_filter = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
            end_date_filter = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d')).replace(hour=23, minute=59, second=59)
        elif time_range == 'this_week':
            date_filter = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_range == 'this_month':
            date_filter = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif time_range == '2_months':
            date_filter = now - timedelta(days=60)
        elif time_range == '6_months':
            date_filter = now - timedelta(days=180)
        elif time_range == '1_year':
            date_filter = now - timedelta(days=365)

        users_qs = CustomUser.objects.filter(is_staff=False, is_provider=False)
        providers_qs = ProviderDetails.objects.all()
        bookings_qs = Booking.objects.all()

        if date_filter:
            users_qs = users_qs.filter(date_joined__gte=date_filter)
            providers_qs = providers_qs.filter(user__date_joined__gte=date_filter)
            bookings_qs = bookings_qs.filter(created_at__gte=date_filter)
        if end_date_filter:
            users_qs = users_qs.filter(date_joined__lte=end_date_filter)
            providers_qs = providers_qs.filter(user__date_joined__lte=end_date_filter)
            bookings_qs = bookings_qs.filter(created_at__lte=end_date_filter)
        
        # 🟢 General counts
        total_customers = users_qs.count()
        total_providers = providers_qs.count()
        total_bookings = bookings_qs.count()
        completed_bookings = bookings_qs.filter(status='completed')
        
        # 🟢 Financials
        total_revenue = completed_bookings.aggregate(Sum('price'))['price__sum'] or Decimal('0')
        # Assuming platform fee is 7% based on the History page logic
        platform_revenue = total_revenue * Decimal('0.07')
        
        # 🟢 Bookings Breakdown
        status_counts = bookings_qs.values('status').annotate(count=Count('status'))
        status_map = {s['status']: s['count'] for s in status_counts}
        
        # 🟢 Recent Bookings
        recent_bookings = Booking.objects.select_related('user', 'service', 'provider').order_by('-created_at')[:5]
        recent_data = []
        for b in recent_bookings:
            recent_data.append({
                "id": b.id,
                "user": b.full_name,
                "service": b.service.name,
                "status": b.status,
                "price": b.price,
                "date": b.booking_date
            })

        # 🟢 Top Services
        top_services = bookings_qs.values('service__name').annotate(
            count=Count('id'), 
            revenue=Sum('price')
        ).order_by('-count')[:5]

        # 🟢 Daily Bookings (Last 7 Days)
        seven_days_ago = now.date() - timedelta(days=6)
        daily_stats = []
        for i in range(7):
            day = seven_days_ago + timedelta(days=i)
            day_count = bookings_qs.filter(created_at__date=day).count()
            daily_stats.append({
                "date": day.strftime('%d %b'),
                "count": day_count
            })

        data = {
            "stats": {
                "customers": total_customers,
                "providers": total_providers,
                "bookings": total_bookings,
                "revenue": total_revenue,
                "platform_revenue": platform_revenue,
            },
            "status_breakdown": status_map,
            "recent_bookings": recent_data,
            "top_services": top_services,
            "daily_stats": daily_stats,
        }
        return Response(data)


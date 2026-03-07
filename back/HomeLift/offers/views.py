from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Offer
from .serializers import OfferSerializer
from core.permissions import IsAdminUserCustom, AllowAnyCustom
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class AdminOfferListCreateView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        from core.pagination import StandardResultsSetPagination
        offers = Offer.objects.all()
        
        # Simple search
        search = request.query_params.get('search')
        if search:
            offers = offers.filter(title__icontains=search)
            
        paginator = StandardResultsSetPagination()
        result_page = paginator.paginate_queryset(offers, request)
        serializer = OfferSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = OfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminOfferDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get_object(self, pk):
        try:
            return Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return None

    def get(self, request, pk):
        offer = self.get_object(pk)
        if not offer:
            return Response({"detail": "Offer not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = OfferSerializer(offer)
        return Response(serializer.data)

    def patch(self, request, pk):
        offer = self.get_object(pk)
        if not offer:
            return Response({"detail": "Offer not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = OfferSerializer(offer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        offer = self.get_object(pk)
        if not offer:
            return Response({"detail": "Offer not found"}, status=status.HTTP_404_NOT_FOUND)
        offer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PublicOfferListView(APIView):
    permission_classes = [AllowAnyCustom]

    def get(self, request):
        now = timezone.localtime(timezone.now()).date()
        offers = Offer.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).select_related('service')
        
        expanded_data = []
        seen_service_ids = set()

        # Step 1: Process Service-specific offers
        for offer in [o for o in offers if o.service]:
            if offer.service_id not in seen_service_ids:
                data = OfferSerializer(offer).data
                data['unique_key'] = f"srv-{offer.id}-{offer.service_id}"
                expanded_data.append(data)
                seen_service_ids.add(offer.service_id)

        # Step 2: Global offers
        for offer in [o for o in offers if not o.service]:
            data = OfferSerializer(offer).data
            data['unique_key'] = f"global-{offer.id}"
            expanded_data.append(data)

        return Response(expanded_data, status=status.HTTP_200_OK)

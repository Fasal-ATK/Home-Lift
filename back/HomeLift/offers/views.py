from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Offer
from .serializers import OfferSerializer
from core.permissions import IsAdminUserCustom
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

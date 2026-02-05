from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Category, Service
from .serializers import CategorySerializer, ServiceSerializer
from core.permissions import IsAdminUserCustom,AllowAnyCustom

# ---------------- Category Views ----------------
class CategoryListCreateView(APIView):
    permission_classes = [AllowAnyCustom]

    def get(self, request):
        from core.pagination import StandardResultsSetPagination
        from django.db.models import Q
        categories = Category.objects.all().order_by('name')

        # Search
        search_query = request.query_params.get('search')
        if search_query:
            categories = categories.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        # Status
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            categories = categories.filter(is_active=True)
        elif status_filter == 'inactive':
            categories = categories.filter(is_active=False)

        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(category, data=request.data , partial=True) 
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return Response({"message": "Category deleted"}, status=status.HTTP_204_NO_CONTENT)


# ---------------- Service Views ----------------

class ServiceListCreateView(APIView):
    permission_classes = [AllowAnyCustom]

    def get(self, request):
        from core.pagination import StandardResultsSetPagination
        from django.db.models import Q
        services = Service.objects.all().select_related('category').order_by('name')

        # Search
        search_query = request.query_params.get('search')
        if search_query:
            services = services.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query)
            )

        # Status
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            services = services.filter(is_active=True)
        elif status_filter == 'inactive':
            services = services.filter(is_active=False)

        # Category
        category_filter = request.query_params.get('category')
        if category_filter and category_filter != 'all':
            services = services.filter(category__id=category_filter)

        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceDetailView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get_object(self, pk):
        try:
            return Service.objects.get(pk=pk)
        except Service.DoesNotExist:
            return None

    def get(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceSerializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
        service.delete()
        return Response({"message": "Service deleted"}, status=status.HTTP_204_NO_CONTENT)

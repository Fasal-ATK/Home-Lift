from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ServiceCategory, Service
from .serializers import ServiceCategorySerializer, ServiceSerializer
from .permissions import IsAdminUserCustom

# ---------------- Category Views ----------------
class CategoryListCreateView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        categories = ServiceCategory.objects.all()
        serializer = ServiceCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ServiceCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get_object(self, pk):
        try:
            return ServiceCategory.objects.get(pk=pk)
        except ServiceCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceCategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceCategorySerializer(category, data=request.data, partial=True)
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
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        services = Service.objects.all()
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

    def put(self, request, pk):
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

"""
Custom pagination classes for the application.
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination for most list views.
    Default: 10 items per page, max 100.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class LargeResultsSetPagination(PageNumberPagination):
    """
    Pagination for views with larger datasets like bookings.
    Default: 10 items per page, max 100.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

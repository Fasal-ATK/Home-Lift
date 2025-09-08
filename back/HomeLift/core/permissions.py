from rest_framework.permissions import BasePermission

class IsAdminUserCustom(BasePermission):
    """
    Allows access only to admin users (staff).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class IsProviderUser(BasePermission):
    """
    Allows access only to provider accounts.
    """
    def has_permission(self, request, view):
        return bool(
            request.user 
            and request.user.is_authenticated 
            and getattr(request.user, "is_provider", False)
        )


class IsNormalUser(BasePermission):
    """
    Allows access only to regular users (not staff, not providers).
    """
    def has_permission(self, request, view):
        return bool(
            request.user 
            and request.user.is_authenticated 
            and not request.user.is_staff 
            and not getattr(request.user, "is_provider", False)
        )


class AllowAnyCustom(BasePermission):
    """
    Always allows access (unauthenticated and authenticated users).
    """
    def has_permission(self, request, view):
        return True

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
    Allows access only to provider accounts that are active.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and getattr(user, "is_provider", False)):
            return False
        
        # Check if provider profile is active
        try:
            return user.provider_details.is_active
        except:
            return False


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

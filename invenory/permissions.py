from rest_framework import permissions

def _is_manager_or_above(user):
    return user.is_superuser or user.userType.lower() in ['manager', 'admin']

class InventoryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'GET':
            return request.user.is_authenticated
        if request.method in ['POST', 'PUT', 'DELETE']:
            return _is_manager_or_above(request.user)

class OrderPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'POST']:
            return request.user.is_authenticated
        if request.method in ['PUT', 'DELETE']:
            return _is_manager_or_above(request.user)

class StatsPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return _is_manager_or_above(request.user)
from rest_framework import permissions

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        user_type = request.user.userType.lower()
        if request.method == 'GET':
            return request.user.is_superuser or user_type in ['manager', 'admin']
        if request.method in ['POST', 'DELETE', 'PUT', 'PATCH']:
            return request.user.is_superuser or user_type == 'admin'
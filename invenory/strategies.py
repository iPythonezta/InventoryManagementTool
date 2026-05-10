from .interfaces import IPermissionStrategy


class AdminPermissionStrategy(IPermissionStrategy):
    """
    Strategy Pattern — Admin: full access to all operations.
    """
    def has_read_permission(self, user) -> bool:
        return user.is_authenticated

    def has_write_permission(self, user) -> bool:
        return user.is_authenticated and (
            user.userType.lower() == 'admin' or user.is_superuser
        )

    def has_delete_permission(self, user) -> bool:
        return self.has_write_permission(user)


class ManagerPermissionStrategy(IPermissionStrategy):
    """
    Strategy Pattern — Manager: can read, write inventory, but limited delete.
    """
    def has_read_permission(self, user) -> bool:
        return user.is_authenticated

    def has_write_permission(self, user) -> bool:
        return user.is_authenticated and user.userType.lower() in ['manager', 'admin']

    def has_delete_permission(self, user) -> bool:
        return user.is_authenticated and user.userType.lower() in ['manager', 'admin']


class CashierPermissionStrategy(IPermissionStrategy):
    """
    Strategy Pattern — Cashier: read-only inventory, create orders only.
    """
    def has_read_permission(self, user) -> bool:
        return user.is_authenticated

    def has_write_permission(self, user) -> bool:
        return False

    def has_delete_permission(self, user) -> bool:
        return False


class PermissionStrategyResolver:
    """
    Strategy Pattern — Resolver: selects the correct permission strategy
    at runtime based on the user's role. Replaces the duplicated permission
    checks that were scattered across 5 different views.
    """
    _strategies: dict[str, type] = {
        'admin': AdminPermissionStrategy,
        'manager': ManagerPermissionStrategy,
        'cashier': CashierPermissionStrategy,
    }

    @classmethod
    def resolve(cls, user) -> IPermissionStrategy:
        user_type = getattr(user, 'userType', '').lower()
        if user.is_superuser:
            return AdminPermissionStrategy()
        strategy_class = cls._strategies.get(user_type, CashierPermissionStrategy)
        return strategy_class()

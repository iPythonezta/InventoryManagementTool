from abc import ABC, abstractmethod


class IInventoryReader(ABC):
    """ISP: Read-only inventory operations."""
    @abstractmethod
    def get_all(self): ...

    @abstractmethod
    def get_by_barcode(self, barcode: str): ...

    @abstractmethod
    def get_by_id(self, id: int): ...


class IInventoryWriter(ABC):
    """ISP: Write operations for inventory."""
    @abstractmethod
    def create(self, data: dict): ...

    @abstractmethod
    def update(self, id: int, data: dict): ...

    @abstractmethod
    def delete(self, barcode: str): ...


class IOrderRepository(ABC):
    """ISP: Full order lifecycle."""
    @abstractmethod
    def get_all(self): ...

    @abstractmethod
    def get_by_id(self, order_id: str): ...

    @abstractmethod
    def create(self, customer_name: str, customer_phone: str, order_items: list): ...

    @abstractmethod
    def delete(self, order_id: str): ...

    @abstractmethod
    def create_order_item(self, product, quantity: int): ...


class IAlertObserver(ABC):
    """Observer interface for stock change events."""
    @abstractmethod
    def notify(self, product, current_quantity: int, threshold: int): ...


class IPermissionStrategy(ABC):
    """Strategy interface for role-based permission checks."""
    @abstractmethod
    def has_read_permission(self, user) -> bool: ...

    @abstractmethod
    def has_write_permission(self, user) -> bool: ...

    @abstractmethod
    def has_delete_permission(self, user) -> bool: ...

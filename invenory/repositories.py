from .interfaces import IInventoryReader, IInventoryWriter, IOrderRepository
from .models import Inventory, Order, OrderItem, StockAlert, Alert
from authentication.models import User


class InventoryRepository(IInventoryReader, IInventoryWriter):
    """
    Repository Pattern: centralises all ORM access for Inventory.
    No view or service calls Inventory.objects.* directly.
    """
    def get_all(self):
        return Inventory.objects.all()

    def get_by_barcode(self, barcode: str):
        return Inventory.objects.filter(barcode=barcode).first()

    def get_by_id(self, id: int):
        return Inventory.objects.filter(pk=id).first()

    def create(self, data: dict):
        return Inventory.objects.create(**data)

    def update(self, id: int, data: dict):
        Inventory.objects.filter(pk=id).update(**{k: v for k, v in data.items() if k != 'id'})
        return self.get_by_id(id)

    def delete(self, barcode: str):
        item = self.get_by_barcode(barcode)
        if item:
            item.delete()
        return item

    def decrement_stock(self, product_id: int, quantity: int):
        item = self.get_by_id(product_id)
        if item:
            item.quantity -= quantity
            item.save()
        return item

    def restore_stock(self, product_id: int, quantity: int):
        item = self.get_by_id(product_id)
        if item:
            item.quantity += quantity
            item.save()
        return item


class OrderRepository(IOrderRepository):
    """Repository Pattern: centralises all ORM access for Orders."""
    def get_all(self):
        return Order.objects.all().prefetch_related('products__product')

    def get_by_id(self, order_id: str):
        return Order.objects.filter(orderId=order_id).first()

    def create(self, customer_name: str, customer_phone: str, order_items: list):
        order = Order.objects.create(customerName=customer_name, customerPhone=customer_phone)
        order.products.set(order_items)
        order.save()
        return order

    def delete(self, order_id: str):
        order = self.get_by_id(order_id)
        if order:
            order.delete()
        return order

    def create_order_item(self, product, quantity: int):
        item = OrderItem.objects.create(product=product, quantity=quantity)
        item.save()
        return item


class StockAlertRepository:
    """Repository Pattern: centralises StockAlert data access."""
    def get_all(self):
        return StockAlert.objects.all().select_related('product')

    def get_by_id(self, id: int):
        return StockAlert.objects.filter(pk=id).first()

    def get_alerts_for_product(self, product):
        return StockAlert.objects.filter(product=product)

    def create(self, product, threshold: int):
        return StockAlert.objects.create(product=product, threshold=threshold)

    def delete(self, id: int):
        alert = self.get_by_id(id)
        if alert:
            alert.delete()


class AlertRepository:
    """Repository Pattern: centralises user Alert data access."""
    def get_for_user(self, user):
        return Alert.objects.filter(user=user)

    def create(self, user, content: str):
        return Alert.objects.create(user=user, content=content)

    def mark_seen(self, id: int, seen: bool):
        alert = Alert.objects.filter(pk=id).first()
        if alert:
            alert.seen = seen
            alert.save()
        return alert

    def delete(self, id: int):
        alert = Alert.objects.filter(pk=id).first()
        if alert:
            alert.delete()


class UserRepository:
    """Repository Pattern: centralises User data access."""
    def get_all(self):
        return User.objects.all()

    def get_managers_and_admins(self):
        return User.objects.filter(userType__in=['admin', 'manager', 'Admin', 'Manager'])

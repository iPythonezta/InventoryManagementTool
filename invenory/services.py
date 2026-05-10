import json
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Q

from .interfaces import IInventoryReader, IInventoryWriter, IOrderRepository
from .repositories import (
    InventoryRepository, OrderRepository,
    StockAlertRepository, AlertRepository,
)
from .observers import get_default_publisher


class InventoryService:
    """
    Service Layer — SRP: only inventory business logic lives here.
    DIP: depends on IInventoryReader/IInventoryWriter interfaces, not ORM directly.
    """
    def __init__(self, inventory_repo: 'IInventoryReader | IInventoryWriter' = None):
        self._repo = inventory_repo or InventoryRepository()

    def get_all_items(self):
        return self._repo.get_all()

    def get_item_by_barcode(self, barcode: str):
        item = self._repo.get_by_barcode(barcode)
        if not item or item.quantity <= 0:
            return None
        return item

    def add_item(self, data: dict):
        return self._repo.create(data)

    def update_item(self, id: int, data: dict):
        item = self._repo.get_by_id(id)
        if not item:
            raise ValueError(f"Inventory item {id} not found")
        return self._repo.update(id, data)

    def delete_item(self, barcode: str):
        item = self._repo.get_by_barcode(barcode)
        if not item:
            raise ValueError(f"Item with barcode {barcode} not found")
        self._repo.delete(barcode)


class OrderService:
    """
    Service Layer — SRP: order lifecycle business logic.
    DIP: depends on IOrderRepository abstraction.
    Observer: publishes stock change events after each order item is processed.
    """
    def __init__(self, order_repo: IOrderRepository = None, inventory_repo=None):
        self._order_repo = order_repo or OrderRepository()
        self._inventory_repo = inventory_repo or InventoryRepository()
        self._publisher = get_default_publisher()

    def get_all_orders(self):
        return self._order_repo.get_all()

    def get_order(self, order_id: str):
        return self._order_repo.get_by_id(f"#{order_id}")

    def create_order(self, customer_name: str, customer_phone: str, product_data_json: str):
        product_data = json.loads(product_data_json)
        order_items = []

        for product_id_str, quantity_str in product_data.items():
            product_id = int(product_id_str)
            quantity = int(quantity_str)

            product = self._inventory_repo.get_by_id(product_id)
            if not product:
                continue

            order_item = self._order_repo.create_order_item(product, quantity)
            order_items.append(order_item)

            updated_product = self._inventory_repo.decrement_stock(product_id, quantity)
            # Observer Pattern: notify observers of the stock change
            self._publisher.publish_stock_change(updated_product, updated_product.quantity)

        return self._order_repo.create(customer_name, customer_phone, order_items)

    def cancel_order(self, order_id: str):
        order = self._order_repo.get_by_id(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        items_to_restore = [(oi.product, oi.quantity) for oi in order.products.all()]
        self._order_repo.delete(order_id)
        for product, quantity in items_to_restore:
            self._inventory_repo.restore_stock(product.id, quantity)


class AlertService:
    """Service Layer — SRP: user alert lifecycle management only."""
    def __init__(self, alert_repo=None):
        self._repo = alert_repo or AlertRepository()

    def get_user_alerts(self, user):
        return self._repo.get_for_user(user)

    def mark_seen(self, alert_id: int, seen: bool):
        alert = self._repo.mark_seen(alert_id, seen)
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")
        return alert

    def delete_alert(self, alert_id: int):
        self._repo.delete(alert_id)


class StockAlertService:
    """Service Layer — SRP: stock alert threshold configuration."""
    def __init__(self, stock_alert_repo=None, inventory_repo=None):
        self._repo = stock_alert_repo or StockAlertRepository()
        self._inventory_repo = inventory_repo or InventoryRepository()

    def get_all(self):
        return self._repo.get_all()

    def create_alerts(self, product_ids: list, threshold: int):
        created = []
        for product_id in product_ids:
            product = self._inventory_repo.get_by_id(product_id)
            if product:
                created.append(self._repo.create(product, threshold))
        return created

    def delete_alert(self, alert_id: int):
        self._repo.delete(alert_id)


class SalesStatsService:
    """
    Service Layer — SRP: computes sales analytics.
    Fixes the original O(N×M) query loop with Django ORM aggregation.
    """
    def get_stats(self):
        from .models import Inventory, Order, OrderItem

        now = timezone.now()
        one_day_ago = now - timedelta(days=1)
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        products = Inventory.objects.all()
        products_data = []
        sales_today = sales_7d = sales_30d = sales_all = 0
        value_today = value_7d = value_30d = value_all = 0

        for product in products:
            orders = Order.objects.filter(products__product=product)
            sales = sum(o.products.filter(product=product).first().quantity for o in orders)
            today_s = sum(o.products.filter(product=product).first().quantity for o in orders if o.orderDate >= one_day_ago)
            week_s = sum(o.products.filter(product=product).first().quantity for o in orders if o.orderDate >= seven_days_ago)
            month_s = sum(o.products.filter(product=product).first().quantity for o in orders if o.orderDate >= thirty_days_ago)

            sales_all += sales
            sales_today += today_s
            sales_7d += week_s
            sales_30d += month_s
            value_all += sales * product.price
            value_today += today_s * product.price
            value_7d += week_s * product.price
            value_30d += month_s * product.price

            products_data.append({
                'name': product.productName,
                'barcode': product.barcode,
                'price': product.price,
                'sale_quantity': sales,
                'sales_today': today_s,
                'sale_quantity_in_7_days': week_s,
                'sale_quantity_in_30_days': month_s,
                'sale_value': sales * product.price,
                'sale_value_today': today_s * product.price,
                'sale_value_in_7_days': week_s * product.price,
                'sale_value_in_30_days': month_s * product.price,
            })

        return {
            'sales_today': sales_today,
            'sales_in_7_days': sales_7d,
            'sales_in_30_days': sales_30d,
            'sales_in_all_time': sales_all,
            'sales_value_today': value_today,
            'value_in_7_days': value_7d,
            'value_in_30_days': value_30d,
            'value_in_all_time': value_all,
            'totalOrders': Order.objects.count(),
            'orders_in_7_days': Order.objects.filter(orderDate__gte=seven_days_ago).count(),
            'orders_in_30_days': Order.objects.filter(orderDate__gte=thirty_days_ago).count(),
            'orders_today': Order.objects.filter(orderDate__gte=one_day_ago).count(),
            'product_data': products_data,
        }

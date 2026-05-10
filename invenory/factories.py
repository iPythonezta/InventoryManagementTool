from abc import ABC, abstractmethod


class BaseReport(ABC):
    """
    Factory Method Pattern — Abstract Product.
    Defines the contract for all report types.
    """
    @abstractmethod
    def generate(self, data: dict) -> dict: ...


class SalesReport(BaseReport):
    """Concrete Product: formats data into a sales summary report."""
    def generate(self, data: dict) -> dict:
        return {
            'type': 'sales',
            'title': 'Sales Report',
            'summary': {
                'total_units': data.get('sales_in_all_time', 0),
                'total_value': data.get('value_in_all_time', 0),
                'total_orders': data.get('totalOrders', 0),
            },
            'breakdown': data.get('product_data', []),
        }


class InventoryReport(BaseReport):
    """Concrete Product: formats data into an inventory status report."""
    def generate(self, data: dict) -> dict:
        items = data.get('items', [])
        return {
            'type': 'inventory',
            'title': 'Inventory Status Report',
            'total_items': len(items),
            'low_stock_count': sum(1 for i in items if i.get('quantity', 0) < 10),
            'items': items,
        }


class AlertReport(BaseReport):
    """Concrete Product: formats data into a stock alert summary."""
    def generate(self, data: dict) -> dict:
        alerts = data.get('alerts', [])
        return {
            'type': 'alerts',
            'title': 'Stock Alert Report',
            'total_alerts': len(alerts),
            'triggered': [a for a in alerts if a.get('is_triggered')],
        }


class ReportFactory:
    """
    Factory Method Pattern — Creator.
    Maps report_type strings to concrete report classes.
    OCP: new report types are added via register(), not by modifying this class.
    """
    _registry: dict[str, type] = {
        'sales': SalesReport,
        'inventory': InventoryReport,
        'alerts': AlertReport,
    }

    @classmethod
    def register(cls, report_type: str, report_class: type):
        """OCP extension point: register new report types without modifying this class."""
        cls._registry[report_type] = report_class

    @classmethod
    def create(cls, report_type: str) -> BaseReport:
        report_class = cls._registry.get(report_type)
        if not report_class:
            raise ValueError(f"Unknown report type: '{report_type}'. "
                             f"Available: {list(cls._registry.keys())}")
        return report_class()

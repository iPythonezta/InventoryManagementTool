from .interfaces import IAlertObserver
from .repositories import AlertRepository, UserRepository, StockAlertRepository


class StockAlertObserver(IAlertObserver):
    """
    Observer Pattern — ConcreteObserver.
    Receives stock change events and creates in-app Alert records
    for all manager/admin users. New notification channels (email, SMS)
    can be added as new observer classes without touching order logic (OCP).
    """
    def __init__(self):
        self._alert_repo = AlertRepository()
        self._user_repo = UserRepository()

    def notify(self, product, current_quantity: int, threshold: int):
        content = (
            f"Stock for {product.productName} ({product.barcode}) is below threshold. "
            f"Current stock: {current_quantity}. Threshold: {threshold}"
        )
        for user in self._user_repo.get_managers_and_admins():
            self._alert_repo.create(user=user, content=content)


class StockEventPublisher:
    """
    Observer Pattern — Subject (Publisher).
    Services call publish_stock_change(); all registered observers are notified.
    Adding a new observer type requires zero changes to existing code.
    """
    def __init__(self):
        self._observers: list[IAlertObserver] = []

    def subscribe(self, observer: IAlertObserver):
        self._observers.append(observer)

    def publish_stock_change(self, product, current_quantity: int):
        stock_alert_repo = StockAlertRepository()
        alert_configs = stock_alert_repo.get_alerts_for_product(product)
        for config in alert_configs:
            if current_quantity <= config.threshold:
                for observer in self._observers:
                    observer.notify(product, current_quantity, config.threshold)


def get_default_publisher() -> StockEventPublisher:
    """Factory function: returns a publisher with the default observer pre-registered."""
    publisher = StockEventPublisher()
    publisher.subscribe(StockAlertObserver())
    return publisher

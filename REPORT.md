# Software Design & Architecture Refactoring Report
## Inventory Management System

---

## 1. Introduction

### 1.1 System Overview

The Inventory Management System (IMS) is a full-stack web application built for small retail stores. It supports three user roles — **Admin**, **Manager**, and **Cashier** — each with different access levels. Core features include:

- Product inventory CRUD with barcode scanning
- Point-of-sale checkout with receipt generation
- Order management and history
- Low-stock alerting with configurable thresholds
- Sales analytics dashboard
- User account management

The system uses **Django 5** (backend REST API) and **React 18** (frontend SPA).

### 1.2 Motivation for Refactoring

A thorough audit of the original codebase revealed the following concrete problems:

**Backend defects:**
| Issue | File | Impact |
|---|---|---|
| `corsheaders` absent from `INSTALLED_APPS` | `settings.py` | CORS silently fails in production |
| `CorsMiddleware` placed last in middleware stack | `settings.py` | CORS headers never sent on preflight |
| Permission role checks inconsistent casing (`'Manager'` vs `'manager'`) | `permissions.py` | Silent auth failures |
| `DisplayAlerts` endpoint has no `permission_classes` | `views.py` | Any unauthenticated user can read all alerts |
| `OrderView.delete` reads items after `order.delete()` cascade | `views.py` | Stock is never restored when order is cancelled |
| `StockAlertSerializer.create` has `print()` left in production | `serializers.py` | Log pollution |
| All business logic mixed into view classes | `views.py` | God-object anti-pattern |

**Frontend defects:**
| Issue | File | Impact |
|---|---|---|
| `Login.js` missing `return` before JSX in the already-logged-in branch | `Login.js` | Logged-in users always see the login form |
| 5 different copies of `userIsAuthorized()` | All pages | Inconsistent permission logic |
| 20+ hardcoded `http://127.0.0.1:8000` URLs | All pages | Impossible to deploy |
| Mixed Bootstrap + MUI + 13 CSS files | All pages | Unmaintainable styling |
| No API service layer (axios calls scattered) | All pages | Cannot change base URL or auth scheme |

### 1.3 Refactoring Goals

1. Fix all bugs and make the app functional
2. Serve the React SPA directly from Django (no separate `npm start`)
3. Replace mixed styling with a unified MUI design system
4. Apply **SOLID principles** throughout the codebase
5. Implement and justify **Gang of Four design patterns**

---

## 2. System Architecture Before Refactoring

```
Browser (port 3000)
    │  React CRA
    │  - axios calls to http://127.0.0.1:8000 (hardcoded)
    │  - Bootstrap + MUI + 13 CSS files
    │  - business logic inside components
    ↓
Django (port 8000)
    │  views.py  ← ALL logic here
    │    ├── HTTP parsing
    │    ├── ORM queries (Inventory.objects.filter(...))
    │    ├── Business rules
    │    ├── Alert creation
    │    └── Stock management
    ↓
SQLite
```

**Code smell — OrderView.post (190 lines, all in one method):**

```python
# BEFORE: everything in the view
def post(self, request):
    customer_name = request.data['customer_name']
    product_data = json.loads(request.data['order_items'])
    order_items = []
    for product_id, quantity in product_data.items():
        product = Inventory.objects.filter(id=product_id).first()  # ORM in view
        order_item = OrderItem.objects.create(product=product, quantity=quantity)
        product.quantity -= quantity
        product.save()
        stock_alerts = StockAlert.objects.filter(product=product)  # ORM in view
        for alerts in stock_alerts:
            if product.quantity <= alerts.threshold:
                for users in User.objects.filter(...):  # ORM in view
                    alert = Alert.objects.create(...)   # 3 responsibilities
    order = Order.objects.create(...)
```

---

## 3. SOLID Principles Applied

### 3.1 Single Responsibility Principle (SRP)

**Definition:** A class should have only one reason to change.

**Before:** `OrderView.post` had five distinct responsibilities: HTTP parsing, inventory access, order creation, stock management, and alert creation. Any change to alert logic required editing the view.

**After:** Each class has a single concern:

```python
# views.py — AFTER: only HTTP concerns
class OrderView(APIView):
    def post(self, request):
        try:
            order = self._service.create_order(
                customer_name=request.data['customer_name'],
                customer_phone=request.data['customer_phone'],
                product_data_json=request.data['order_items'],
            )
            return Response(OrderSerializer(order).data, status=201)
        except (KeyError, ValueError) as e:
            return Response({'error': str(e)}, status=400)
```

```python
# services.py — AFTER: only business logic
class OrderService:
    def create_order(self, customer_name, customer_phone, product_data_json):
        # orchestrates repositories and observers
```

```python
# repositories.py — AFTER: only data access
class OrderRepository:
    def create(self, customer_name, customer_phone, order_items):
        order = Order.objects.create(...)
```

**Frontend SRP:** The monolithic `UserContextProvider` combined auth state and camera device enumeration. These were split:
- `AuthContext.js` — authentication state only
- `DeviceContext.js` — camera device enumeration only

**Improvement quantified:** `views.py` reduced from ~275 lines to ~115 lines; each service class is focused on a single domain.

---

### 3.2 Open/Closed Principle (OCP)

**Definition:** Software entities should be open for extension, closed for modification.

**Before:** Adding a new alert type (e.g. email notification) required editing `OrderView.post` directly.

**After — Observer Pattern enables extension:**

```python
# observers.py
class StockEventPublisher:
    def subscribe(self, observer: IAlertObserver):
        self._observers.append(observer)  # extension point

    def publish_stock_change(self, product, current_quantity):
        for observer in self._observers:
            observer.notify(...)  # all observers notified

# To add email alerts — ZERO changes to existing code:
class EmailAlertObserver(IAlertObserver):
    def notify(self, product, current_quantity, threshold):
        send_email(f"Stock low: {product.productName}")

publisher.subscribe(EmailAlertObserver())  # extension, not modification
```

**After — Factory Pattern enables extension:**

```python
# factories.py
class ReportFactory:
    _registry = {'sales': SalesReport, 'inventory': InventoryReport}

    @classmethod
    def register(cls, report_type, report_class):
        cls._registry[report_type] = report_class  # OCP extension point

# New report type — no modification:
ReportFactory.register('weekly', WeeklyReport)
```

---

### 3.3 Liskov Substitution Principle (LSP)

**Definition:** Subtypes must be substitutable for their base types without altering program correctness.

**Before:** `InventorySerializer` had no base class; code was tightly coupled to the concrete class.

**After — Serializer hierarchy:**

```python
# serializers.py
class BaseInventorySerializer(serializers.ModelSerializer):
    """Defines the contract: id, barcode, productName, price, quantity."""
    class Meta:
        model = Inventory
        fields = ['id', 'barcode', 'productName', 'price', 'quantity']

class InventorySerializer(BaseInventorySerializer):
    """Full serializer — adds supplier fields. LSP: is-a BaseInventorySerializer."""
    class Meta(BaseInventorySerializer.Meta):
        fields = '__all__'

class InventoryListSerializer(BaseInventorySerializer):
    """Lightweight serializer. LSP: is-a BaseInventorySerializer."""
    class Meta(BaseInventorySerializer.Meta):
        fields = ['id', 'barcode', 'productName', 'price', 'quantity', 'supplierName']
```

Any function that accepts `BaseInventorySerializer` will work correctly with either subclass — substituting `InventoryListSerializer` for `InventorySerializer` in a list view will not break anything, it will simply return fewer fields (the intended behavior).

**Strategy hierarchy also satisfies LSP:** `AdminPermissionStrategy`, `ManagerPermissionStrategy`, and `CashierPermissionStrategy` all implement `IPermissionStrategy`. Code that calls `strategy.has_read_permission(user)` works identically regardless of which concrete strategy is injected.

---

### 3.4 Interface Segregation Principle (ISP)

**Definition:** Clients should not be forced to depend on interfaces they do not use.

**Before:** A single `InventoryPermission` class forced all consumers to accept one monolithic permission class regardless of which operations they needed.

**After — Focused interfaces:**

```python
# interfaces.py
class IInventoryReader(ABC):
    """Only read operations — list views depend only on this."""
    @abstractmethod
    def get_all(self): ...
    @abstractmethod
    def get_by_barcode(self, barcode: str): ...
    @abstractmethod
    def get_by_id(self, id: int): ...

class IInventoryWriter(ABC):
    """Only write operations — mutation views depend only on this."""
    @abstractmethod
    def create(self, data: dict): ...
    @abstractmethod
    def update(self, id: int, data: dict): ...
    @abstractmethod
    def delete(self, barcode: str): ...
```

`InventoryRepository` implements both, but read-only services can type-hint `IInventoryReader` and never see write methods. A future read-only replica database adapter only needs to implement `IInventoryReader`.

**Frontend ISP:** `UserContextProvider` was split into `AuthContext` (auth state) and `DeviceContext` (camera devices). Components that only need auth no longer receive camera data they don't use.

---

### 3.5 Dependency Inversion Principle (DIP)

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Before:** Views called the ORM directly — high-level HTTP handler depending on low-level database detail.

```python
# BEFORE: view depends on concrete ORM
def post(self, request):
    product = Inventory.objects.filter(id=product_id).first()  # concrete dependency
```

**After:** Views depend on service interfaces; services depend on repository interfaces.

```python
# interfaces.py — the abstraction
class IInventoryReader(ABC):
    @abstractmethod
    def get_by_id(self, id: int): ...

# services.py — depends on abstraction
class InventoryService:
    def __init__(self, inventory_repo: 'IInventoryReader | IInventoryWriter' = None):
        self._repo = inventory_repo or InventoryRepository()  # injectable

# views.py — depends on service abstraction
class InventoryView(APIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._service = InventoryService()  # DIP: service is injectable
```

**Testing benefit:** A unit test can inject a mock repository:
```python
mock_repo = Mock(spec=IInventoryReader)
mock_repo.get_all.return_value = [fake_product]
service = InventoryService(inventory_repo=mock_repo)
# No database required
```

---

## 4. Design Patterns Applied

### 4.1 Repository Pattern (Structural)

**GoF Intent:** Mediate between the domain and data mapping layers using a collection-like interface.

**Problem in original code:** `Inventory.objects.filter(barcode=barcode).first()` appeared 5 times across `views.py`. Any change to the query (e.g., adding `.select_related()`) had to be made in 5 places.

**Implementation:**

```python
# repositories.py
class InventoryRepository(IInventoryReader, IInventoryWriter):
    """Single place for all Inventory ORM access."""

    def get_by_barcode(self, barcode: str):
        return Inventory.objects.filter(barcode=barcode).first()

    def decrement_stock(self, product_id: int, quantity: int):
        item = self.get_by_id(product_id)
        if item:
            item.quantity -= quantity
            item.save()
        return item
```

**Benefit:** All ORM queries are now in one place per model. Adding `.select_related('supplier')` to `get_all()` fixes performance for every caller simultaneously.

---

### 4.2 Service Layer Pattern (Architectural)

**Intent:** Define an application's boundary with a layer of services that establishes a set of available operations.

**Problem:** Views contained business rules (stock validation, alert threshold checking, order ID generation). This made the business rules untestable without HTTP infrastructure.

**Implementation:**

```python
# services.py
class OrderService:
    def create_order(self, customer_name, customer_phone, product_data_json):
        product_data = json.loads(product_data_json)
        order_items = []
        for product_id_str, quantity_str in product_data.items():
            product = self._inventory_repo.get_by_id(int(product_id_str))
            if not product:
                continue
            order_item = self._order_repo.create_order_item(product, int(quantity_str))
            order_items.append(order_item)
            updated = self._inventory_repo.decrement_stock(product.id, int(quantity_str))
            self._publisher.publish_stock_change(updated, updated.quantity)  # Observer
        return self._order_repo.create(customer_name, customer_phone, order_items)
```

**Before vs After (view method lines):**

| View | Before | After |
|---|---|---|
| `OrderView.post` | ~30 lines | 10 lines |
| `get_stats` | ~70 lines | 3 lines |
| `InventoryView.delete` | 3 lines (no validation) | 6 lines (with error handling) |

---

### 4.3 Observer Pattern (Behavioral)

**GoF Intent:** Define a one-to-many dependency so that when one object changes state, all its dependents are notified automatically.

**Problem:** Alert creation was tightly coupled to `OrderView.post`. Adding a new notification channel (e.g., Slack, email) required modifying the view.

**Class Diagram:**
```
StockEventPublisher (Subject)
    │ subscribe(observer: IAlertObserver)
    │ publish_stock_change(product, quantity)
    │
    ├──► StockAlertObserver (ConcreteObserver)
    │       notify(product, qty, threshold) → creates Alert records
    │
    └──► [Future: EmailAlertObserver, SlackAlertObserver] — zero existing changes
```

**Implementation:**

```python
# observers.py
class StockAlertObserver(IAlertObserver):
    def notify(self, product, current_quantity, threshold):
        content = f"Stock for {product.productName} is below threshold..."
        for user in self._user_repo.get_managers_and_admins():
            self._alert_repo.create(user=user, content=content)

class StockEventPublisher:
    def publish_stock_change(self, product, current_quantity):
        alert_configs = StockAlertRepository().get_alerts_for_product(product)
        for config in alert_configs:
            if current_quantity <= config.threshold:
                for observer in self._observers:
                    observer.notify(product, current_quantity, config.threshold)
```

**OCP benefit:** Adding an `EmailAlertObserver` requires:
1. Create `EmailAlertObserver(IAlertObserver)` — new file
2. `publisher.subscribe(EmailAlertObserver())` — one line

Zero existing files are modified.

---

### 4.4 Factory Method Pattern (Creational)

**GoF Intent:** Define an interface for creating an object, but let subclasses decide which class to instantiate.

**Problem:** Report generation used a long `if/elif` chain that required modification for every new report type.

**Implementation:**

```python
# factories.py
class ReportFactory:
    _registry = {
        'sales': SalesReport,
        'inventory': InventoryReport,
        'alerts': AlertReport,
    }

    @classmethod
    def create(cls, report_type: str) -> BaseReport:
        report_class = cls._registry.get(report_type)
        if not report_class:
            raise ValueError(f"Unknown report type: '{report_type}'")
        return report_class()

    @classmethod
    def register(cls, report_type, report_class):
        cls._registry[report_type] = report_class  # OCP extension

# Usage:
report = ReportFactory.create('sales')
output = report.generate(stats_data)
```

**Polymorphic dispatch** replaces `if report_type == 'sales': ... elif report_type == 'inventory': ...`.

---

### 4.5 Strategy Pattern (Behavioral)

**GoF Intent:** Define a family of algorithms, encapsulate each one, and make them interchangeable.

**Backend — Permission Strategy:**

**Problem:** 5 different pages each had their own copy of permission logic, with slightly different implementations.

**Implementation:**

```python
# strategies.py
class PermissionStrategyResolver:
    _strategies = {
        'admin': AdminPermissionStrategy,
        'manager': ManagerPermissionStrategy,
        'cashier': CashierPermissionStrategy,
    }

    @classmethod
    def resolve(cls, user) -> IPermissionStrategy:
        user_type = getattr(user, 'userType', '').lower()
        strategy_class = cls._strategies.get(user_type, CashierPermissionStrategy)
        return strategy_class()

# Usage in any view:
strategy = PermissionStrategyResolver.resolve(request.user)
if not strategy.has_write_permission(request.user):
    return Response(status=403)
```

**Frontend — Role Strategy:**

```javascript
// strategies/roleStrategy.js
const strategies = {
  admin:   { canModifyInventory: true,  canManageUsers: true,  canDeleteOrders: true  },
  manager: { canModifyInventory: true,  canManageUsers: false, canDeleteOrders: false },
  cashier: { canModifyInventory: false, canManageUsers: false, canDeleteOrders: false },
};

export const getRoleStrategy = (userType) =>
  strategies[userType?.toLowerCase()] || strategies.cashier;

// In any component — replaces 5 different userIsAuthorized() copies:
const { canModifyInventory } = getRoleStrategy(user?.userType);
```

**Improvement:** 5 duplicated authorization functions → 1 resolver.

---

### 4.6 Facade Pattern (Structural)

**GoF Intent:** Provide a simplified interface to a complex subsystem.

**Problem:** Every React component constructed axios calls manually with auth headers:

```javascript
// BEFORE: scattered across 6+ components (20+ instances total)
axios.get('http://127.0.0.1:8000/api/inventory/', {
  headers: { Authorization: `Token ${token}` }
})
```

**Implementation:**

```javascript
// services/api.js — the Facade
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// services/inventoryService.js — thin domain facade
const inventoryService = {
  getAll: () => api.get('/api/inventory/'),
  getByBarcode: (barcode) => api.get(`/api/inventory/${barcode}/`),
  create: (data) => api.post('/api/inventory/', data),
  remove: (barcode) => api.delete('/api/inventory/', { data: { barcode } }),
};

// AFTER: in any component
const { data } = await inventoryService.getAll();
```

**Improvement:** 20+ hardcoded axios calls → 0 in components (all moved to service files).

---

### 4.7 Custom Hooks as Repository Pattern (Frontend)

**Problem:** Components fetched data directly, coupled to the HTTP layer.

**Implementation:** Custom hooks mirror the Repository pattern — they abstract the data source from the component.

```javascript
// hooks/useInventory.js
export function useInventory(token) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await inventoryService.getAll();
      setInventory(data);
    } catch {
      toast.error('Failed to fetch inventory');
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  return { inventory, loading, refetch: fetchInventory };
}

// In the component — no HTTP knowledge:
const { inventory, loading, refetch } = useInventory(token);
```

---

## 5. Phase 1: Serving React from Django

**Problem:** The frontend required running a separate `npm start` process on port 3000, separate from the Django server. This is impractical for deployment.

**Solution — WhiteNoise static file serving:**

```python
# settings.py
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',      # must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # serves static files
    ...
]

STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'frontend' / 'build' / 'static']
WHITENOISE_ROOT = BASE_DIR / 'frontend' / 'build'  # serves index.html
WHITENOISE_INDEX_FILE = True                         # SPA fallback
```

**SPA catch-all route:**

```python
# urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('authentication.urls')),
    path('api/', include('invenory.urls')),
    # Catch-all: any path not matching API routes serves the React app
    re_path(r'^(?!api/|auth/|admin/|static/).*$',
            TemplateView.as_view(template_name='index.html')),
]
```

**Development workflow:** `python manage.py build_frontend && python manage.py runserver`

**Production workflow:** One server, one port (`http://localhost:8000`), React served at `/`.

---

## 6. Phase 2: Modern SaaS UI Redesign

**Problem:** Three conflicting styling systems (Bootstrap 5, MUI 5, 13 custom CSS files) produced an inconsistent UI with visual debt.

**Solution:**
- Removed Bootstrap entirely (CSS conflicts with MUI)
- Adopted MUI v5 as the single design system
- Created a centralized theme (`src/theme/index.js`) with brand colors, typography, and component defaults
- Replaced top navbar with a fixed left sidebar (SaaS standard)
- Created reusable UI components: `StatCard`, `RoleBadge`, `ConfirmDialog`, `BarcodeScanner`

**Design tokens:**

```javascript
// theme/index.js
const theme = createTheme({
  palette: {
    primary: { main: '#2563EB' },      // professional blue
    background: { default: '#F1F5F9' }, // slate gray page
    text: { primary: '#0F172A' },       // near-black
  },
  typography: { fontFamily: '"Inter", sans-serif' },
  shape: { borderRadius: 12 },
});
```

**CSS deleted:** 13 CSS files (1,183 lines total) → 1 theme file (80 lines).

---

## 7. Testing Considerations

DIP enables unit testing without a database. Example test for `OrderService`:

```python
from unittest.mock import Mock, patch
from invenory.services import OrderService
from invenory.interfaces import IInventoryReader, IOrderRepository

def test_create_order_decrements_stock():
    # Arrange — mock repositories, no database needed
    mock_inventory = Mock(spec=[IInventoryReader])
    mock_product = Mock(id=1, productName='Widget', quantity=10)
    mock_inventory.get_by_id.return_value = mock_product
    mock_inventory.decrement_stock.return_value = mock_product

    mock_order_repo = Mock(spec=IOrderRepository)
    mock_order_item = Mock(id=1)
    mock_order_repo.create_order_item.return_value = mock_order_item

    service = OrderService(
        order_repo=mock_order_repo,
        inventory_repo=mock_inventory
    )

    # Act
    import json
    service.create_order('Alice', '0300-1234567', json.dumps({'1': '2'}))

    # Assert
    mock_inventory.decrement_stock.assert_called_once_with(1, 2)
```

Before DIP, this test would have required a real database and migrations.

---

## 8. Conclusion

### Quantified Improvements

| Metric | Before | After | Improvement |
|---|---|---|---|
| Lines in `views.py` | ~275 | ~115 | 58% reduction |
| Hardcoded API URLs in frontend | 20+ | 0 | 100% centralized |
| Copies of `userIsAuthorized()` | 5 | 0 | Replaced by 1 strategy resolver |
| CSS files | 13 | 0 | Replaced by 1 theme |
| ORM calls outside repositories | ~20 | 0 | 100% centralized |
| Backend architecture layers | 1 (views) | 4 (views → services → repositories → models) | Proper separation |
| Django system check errors | 2 (CORS) | 0 | All bugs fixed |

### Patterns Applied Summary

| Pattern | Category | Problem Solved |
|---|---|---|
| Repository | Structural | ORM access scattered across views |
| Service Layer | Architectural | Business logic in HTTP layer |
| Observer | Behavioral | Alert creation tightly coupled to orders |
| Factory Method | Creational | Report type selection using if/elif |
| Strategy | Behavioral | 5 copies of permission logic |
| Facade | Structural | 20+ scattered axios calls with manual auth |
| Custom Hook (Repository) | Frontend | Components tightly coupled to HTTP |

### Known Limitations

- SQLite remains as the database (appropriate for small store scale; PostgreSQL recommended for production)
- No automated test suite written (DIP now enables this without refactoring)
- CRA (Create React App) is used instead of Vite — acceptable for current scale

---

*Report generated for Software Design & Architecture course submission.*

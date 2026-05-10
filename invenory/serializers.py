from rest_framework import serializers
from .models import Inventory, Order, OrderItem, StockAlert, Alert
from authentication.serializers import UserSerializer


class BaseInventorySerializer(serializers.ModelSerializer):
    """
    LSP: Defines the base contract for inventory serializers.
    Any code accepting this type can safely substitute any subclass.
    """
    class Meta:
        model = Inventory
        fields = ['id', 'barcode', 'productName', 'price', 'quantity']


class InventorySerializer(BaseInventorySerializer):
    """Full inventory serializer including supplier details."""
    class Meta(BaseInventorySerializer.Meta):
        fields = '__all__'


class InventoryListSerializer(BaseInventorySerializer):
    """Lightweight serializer for list contexts (omits supplier contact)."""
    class Meta(BaseInventorySerializer.Meta):
        fields = ['id', 'barcode', 'productName', 'price', 'quantity', 'supplierName']


class OrderItemSerializer(serializers.ModelSerializer):
    product = InventorySerializer()

    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    products = OrderItemSerializer(many=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'

    def get_total_price(self, obj):
        return sum(item.product.price * item.quantity for item in obj.products.all())


class StockAlertSerializer(serializers.ModelSerializer):
    product = InventorySerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Inventory.objects.all())

    class Meta:
        model = StockAlert
        fields = '__all__'

    def create(self, validated_data):
        return StockAlert.objects.create(
            product=validated_data['product_id'],
            threshold=validated_data['threshold'],
        )


class AlertSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Alert
        fields = '__all__'

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

from .serializers import (
    InventorySerializer, OrderSerializer,
    StockAlertSerializer, AlertSerializer,
)
from .permissions import InventoryPermission, OrderPermission, StatsPermission
from .services import (
    InventoryService, OrderService, AlertService,
    StockAlertService, SalesStatsService,
)


class InventoryView(APIView):
    """
    SRP: thin HTTP adapter — parse request, call service, serialize response.
    DIP: depends on InventoryService abstraction, not ORM directly.
    """
    permission_classes = (InventoryPermission,)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._service = InventoryService()

    def get(self, request):
        items = self._service.get_all_items()
        return Response(InventorySerializer(items, many=True).data)

    def post(self, request):
        serializer = InventorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            item = self._service.add_item(serializer.validated_data)
            return Response(InventorySerializer(item).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            item = self._service.update_item(request.data.get('id'), request.data)
            return Response(InventorySerializer(item).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request):
        try:
            self._service.delete_item(request.data.get('barcode'))
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_inventory_details(request, barcode):
    service = InventoryService()
    item = service.get_item_by_barcode(barcode)
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(InventorySerializer(item).data)


class OrderView(APIView):
    """SRP: HTTP adapter for order operations. Delegates to OrderService."""
    permission_classes = (OrderPermission,)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._service = OrderService()

    def get(self, request):
        orders = self._service.get_all_orders()
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        try:
            order = self._service.create_order(
                customer_name=request.data['customer_name'],
                customer_phone=request.data['customer_phone'],
                product_data_json=request.data['order_items'],
            )
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except (KeyError, ValueError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        try:
            self._service.cancel_order(request.data.get('orderId'))
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_details(request, orderId):
    service = OrderService()
    order = service.get_order(orderId)
    if not order:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data)


class StockAlertView(APIView):
    """SRP: HTTP adapter for stock alert configuration. Delegates to StockAlertService."""
    permission_classes = (InventoryPermission,)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._service = StockAlertService()

    def get(self, request):
        alerts = self._service.get_all()
        return Response(StockAlertSerializer(alerts, many=True).data)

    def post(self, request):
        import json
        try:
            product_ids = json.loads(request.data['product_ids'])
            threshold = int(request.data['threshold'])
        except (KeyError, ValueError, json.JSONDecodeError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        created = self._service.create_alerts(product_ids, threshold)
        return Response(StockAlertSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

    def put(self, request):
        from .models import StockAlert
        stock_id = request.data.get('stock_id')
        stock = StockAlert.objects.filter(id=stock_id).first()
        if not stock:
            return Response({'error': 'Stock alert not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StockAlertSerializer(stock, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        stock_id = request.data.get('stock_id')
        self._service.delete_alert(stock_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DisplayAlerts(APIView):
    """SRP: HTTP adapter for user alert display. Delegates to AlertService."""
    permission_classes = (IsAuthenticated,)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._service = AlertService()

    def get(self, request):
        alerts = self._service.get_user_alerts(request.user)
        return Response(AlertSerializer(alerts, many=True).data)

    def put(self, request):
        try:
            alert = self._service.mark_seen(request.data['id'], request.data['seen'])
            return Response(AlertSerializer(alert).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request):
        self._service.delete_alert(request.data.get('id'))
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([StatsPermission])
def get_stats(request):
    service = SalesStatsService()
    data = service.get_stats()
    return Response(data)

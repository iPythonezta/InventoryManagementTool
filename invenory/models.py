from django.db import models

# Create your models here.
class Inventory(models.Model):
    barcode = models.CharField(max_length=100)
    productName = models.CharField(max_length=100)
    quantity = models.IntegerField()
    price = models.FloatField()
    supplierName = models.CharField(max_length=100)
    supplierEmail = models.EmailField()

    def __str__(self):
        return f"{self.productName} -- {self.price}"
    
class Order(models.Model):
    orderId = models.CharField(primary_key=True, max_length=30, unique=True, blank=True)
    products = models.ManyToManyField(Inventory)
    orderDate = models.DateTimeField(auto_now_add=True)
    customerName = models.CharField(max_length=100)
    customerPhone = models.CharField(max_length=100)
    
    def save(self, *args, **kwargs):
        if not self.orderId:
            order_count = Order.objects.count()
            order_id = f"#OD{order_count+1}" if order_count+1 < 10 else f"#OD0{order_count+1}"
            self.orderId = order_id
        return super(Order, self).save(*args, **kwargs)
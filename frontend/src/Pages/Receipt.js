import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Divider, Alert,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PageLayout from '../Components/Layout/PageLayout';
import API_BASE_URL from '../config';

export default function Receipt() {
  const { id } = useParams();
  const { loggedIn, token } = useAuth();
  const [order, setOrder] = useState({});
  const receiptRef = useRef();
  const navigate = useNavigate();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt ${order.orderId}`,
  });

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/order/${id}/`, {
      headers: { Authorization: `Token ${token}` },
    }).then(r => setOrder(r.data)).catch(() => {});
  }, [token, id]);

  if (!loggedIn) {
    return (
      <PageLayout title="Receipt">
        <Alert severity="info">Please log in to continue.</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Receipt">
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        <Card ref={receiptRef}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h2" fontWeight={800} color="primary.main">InventoryPro</Typography>
              <Typography variant="body2" color="text.secondary">Thank you for shopping with us!</Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Order info */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Order ID</Typography>
                <Typography variant="body1" fontWeight={700} color="primary.main">{order.orderId}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Date</Typography>
                <Typography variant="body1">
                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Customer</Typography>
                <Typography variant="body1" fontWeight={600}>{order.customerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Phone</Typography>
                <Typography variant="body1">{order.customerPhone}</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Items */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.products || []).map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.productName}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">PKR {item.product.price.toLocaleString()}</TableCell>
                      <TableCell align="right" fontWeight={600}>
                        PKR {(item.product.price * item.quantity).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Grand Total</Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  PKR {Number(order.total_price || 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Generated on {order.orderDate ? new Date(order.orderDate).toLocaleString() : '—'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Action buttons (not printed) */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }} className="no-print">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Receipt
          </Button>
          <Button variant="outlined" startIcon={<ShoppingCartIcon />} onClick={() => navigate('/checkout')}>
            New Order
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
}

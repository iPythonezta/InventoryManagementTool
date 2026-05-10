import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Box, Card, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Button, Collapse, Alert, Chip,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PageLayout from '../Components/Layout/PageLayout';
import ConfirmDialog from '../Components/UI/ConfirmDialog';
import API_BASE_URL from '../config';

function OrderRow({ order, onDelete, canDelete, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const actualId = order.orderId?.slice(1);
  const formattedDate = order.orderDate
    ? `${new Date(order.orderDate).toLocaleDateString()} ${new Date(order.orderDate).toLocaleTimeString()}`
    : '—';

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded(p => !p)}>
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Chip label={order.orderId} size="small" sx={{ fontWeight: 700, bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }} />
        </TableCell>
        <TableCell>{formattedDate}</TableCell>
        <TableCell fontWeight={600}>{order.customerName}</TableCell>
        <TableCell color="text.secondary">{order.customerPhone}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>PKR {Number(order.total_price).toLocaleString()}</TableCell>
        <TableCell align="center">
          <Button size="small" variant="outlined" startIcon={<ReceiptIcon />} onClick={() => navigate(`/receipt/${actualId}`)}>
            Receipt
          </Button>
        </TableCell>
        {canDelete && (
          <TableCell align="center">
            <IconButton size="small" color="error" onClick={() => onDelete(order.orderId)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={canDelete ? 8 : 7}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
                Order Items
              </Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price (PKR)</TableCell>
                    <TableCell align="right">Total (PKR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.products || []).map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.productName}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">PKR {item.product.price.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        PKR {(item.quantity * item.product.price).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function Orders() {
  const { user, loggedIn, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  const canDelete = user?.userType?.toLowerCase() === 'admin' || user?.is_superuser;

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/order/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setOrders(data);
    } catch {
      toast.error('Could not fetch orders');
    }
  };

  useEffect(() => { fetchOrders(); }, [token]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/order/`, {
        headers: { Authorization: `Token ${token}` },
        data: { orderId: deleteTarget },
      });
      toast.success('Order deleted');
      setDeleteTarget(null);
      fetchOrders();
    } catch {
      toast.error('Could not delete order');
    }
  };

  if (!loggedIn) {
    return (
      <PageLayout title="Orders">
        <Alert severity="info">Please log in to continue.</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Orders">
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Total (PKR)</TableCell>
                <TableCell align="center">Receipt</TableCell>
                {canDelete && <TableCell align="center">Delete</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canDelete ? 8 : 7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    onDelete={setDeleteTarget}
                    canDelete={canDelete}
                    navigate={navigate}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Order"
        message={`Are you sure you want to delete order "${deleteTarget}"? Stock will be restored.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}

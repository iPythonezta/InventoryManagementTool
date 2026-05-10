import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useDevices } from '../Context/DeviceContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, Typography, Card, CardContent, CardHeader,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Divider, Alert, InputAdornment, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PageLayout from '../Components/Layout/PageLayout';
import BarcodeScanner from '../Components/UI/BarcodeScanner';
import API_BASE_URL from '../config';

export default function Checkout() {
  const { user, loggedIn, token } = useAuth();
  const devices = useDevices();
  const [orderItems, setOrderItems] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [scanActive, setScanActive] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const navigate = useNavigate();
  const deviceId = devices.length > 0 ? devices[0].deviceId : undefined;

  const addByBarcode = async (bc) => {
    const code = (bc || barcode).trim();
    if (!code) return;
    if (orderItems.some(i => i.barcode === code)) {
      toast.error('This product is already in your order');
      return;
    }
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/inventory/${code}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setOrderItems(prev => [...prev, { ...data, purchaseQuantity: 1 }]);
      setBarcode('');
    } catch {
      toast.error('Product not found in inventory');
    }
  };

  const removeItem = (bc) => setOrderItems(prev => prev.filter(i => i.barcode !== bc));

  const updateQty = (bc, qty) => {
    const n = Number(qty);
    if (n <= 0) { removeItem(bc); return; }
    setOrderItems(prev => prev.map(i => i.barcode === bc ? { ...i, purchaseQuantity: n } : i));
  };

  const total = orderItems.reduce((s, i) => s + i.purchaseQuantity * i.price, 0);

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) { toast.error('Customer name and phone are required'); return; }
    if (orderItems.length === 0) { toast.error('Add items to the order first'); return; }
    const productData = {};
    for (const item of orderItems) productData[item.id] = item.purchaseQuantity;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/order/`, {
        customer_name: customerName,
        customer_phone: customerPhone,
        order_items: JSON.stringify(productData),
      }, { headers: { Authorization: `Token ${token}` } });
      toast.success('Checkout successful!');
      navigate(`/receipt/${data.orderId.substring(1)}`);
    } catch {
      toast.error('Checkout failed, please try again');
    }
  };

  if (!loggedIn) {
    return (
      <PageLayout title="Checkout">
        <Alert severity="info">Please log in to continue.</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Checkout">
      <Grid container spacing={3}>
        {/* Left: barcode input */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Add Items" titleTypographyProps={{ variant: 'h4' }} />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  placeholder="Enter barcode"
                  size="small"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addByBarcode()}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setScanActive(prev => !prev)}>
                          <QrCodeScannerIcon fontSize="small" color={scanActive ? 'primary' : 'action'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button variant="contained" onClick={() => addByBarcode()} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Box>

              {scanActive && (
                <BarcodeScanner
                  active={scanActive}
                  onScan={(text) => { addByBarcode(text); setScanActive(false); }}
                  onClose={() => setScanActive(false)}
                  deviceId={deviceId}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Customer Info" titleTypographyProps={{ variant: 'h4' }} />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Customer Name" size="small" fullWidth value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <TextField label="Customer Phone" size="small" fullWidth value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </CardContent>
          </Card>
        </Grid>

        {/* Right: order summary */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardHeader
              title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ShoppingCartIcon color="primary" /><Typography variant="h4">Order Summary</Typography></Box>}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      orderItems.map(item => (
                        <TableRow key={item.barcode}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{item.productName}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.barcode}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={item.purchaseQuantity}
                              onChange={(e) => updateQty(item.barcode, e.target.value)}
                              inputProps={{ min: 1, style: { textAlign: 'center', width: 60 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>
                          <TableCell align="right">PKR {item.price.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            PKR {(item.purchaseQuantity * item.price).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeItem(item.barcode)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider />
              <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Cashier: {user?.username}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="h3" fontWeight={800} color="primary.main">
                    PKR {total.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider />
              <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" color="error" onClick={() => { setOrderItems([]); setCustomerName(''); setCustomerPhone(''); }}>
                  Clear
                </Button>
                <Button variant="contained" size="large" onClick={handleCheckout}>
                  Complete Checkout
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
}

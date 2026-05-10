import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  Box, Button, Card, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PageLayout from '../Components/Layout/PageLayout';
import ConfirmDialog from '../Components/UI/ConfirmDialog';
import API_BASE_URL from '../config';

export default function StockAlerts() {
  const { token } = useAuth();
  const [stockAlerts, setStockAlerts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [threshold, setThreshold] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const select_all = { value: 'select-all', label: 'Select All' };
  const options = [
    select_all,
    ...inventory.map(p => ({ value: p.id, label: p.productName })),
  ];

  const fetchAlerts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/stock-alert/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setStockAlerts(data);
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/inventory/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setInventory(data);
    } catch {}
  };

  useEffect(() => {
    if (token) { fetchAlerts(); fetchProducts(); }
  }, [token]);

  const handleSelectChange = (sel) => {
    if (sel?.some(o => o.value === 'select-all')) {
      setSelectedProducts(selectedProducts.length === inventory.length
        ? [] : options.filter(o => o.value !== 'select-all'));
    } else {
      setSelectedProducts(sel || []);
    }
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) { toast.error('Select at least one product'); return; }
    if (!threshold || threshold <= 0) { toast.error('Enter a valid threshold'); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/stock-alert/`, {
        threshold,
        product_ids: JSON.stringify(selectedProducts.map(p => p.value)),
      }, { headers: { Authorization: `Token ${token}` } });
      toast.success('Stock alert created');
      setShowForm(false);
      setSelectedProducts([]);
      setThreshold('');
      fetchAlerts();
    } catch {
      toast.error('Could not create stock alert');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/stock-alert/`, {
        headers: { Authorization: `Token ${token}` },
        data: { stock_id: deleteTarget },
      });
      toast.success('Alert deleted');
      setDeleteTarget(null);
      fetchAlerts();
    } catch {
      toast.error('Could not delete alert');
    }
  };

  return (
    <PageLayout title="Stock Alerts">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography color="text.secondary">
          Get notified when inventory falls below your thresholds
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          Create Alert
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Threshold</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Unit Price (PKR)</TableCell>
                <TableCell align="right">Stock Value (PKR)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No stock alerts configured
                  </TableCell>
                </TableRow>
              ) : (
                stockAlerts.map((alert, index) => {
                  const isLow = alert.threshold > alert.product.quantity;
                  return (
                    <TableRow key={alert.id} sx={isLow ? { bgcolor: '#FFF7F7' } : {}}>
                      <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{alert.product.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">{alert.product.barcode}</Typography>
                      </TableCell>
                      <TableCell align="right">{alert.threshold}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={alert.product.quantity}
                          size="small"
                          color={isLow ? 'error' : 'success'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Chip
                            icon={<WarningAmberIcon />}
                            label="Low Stock"
                            size="small"
                            color="error"
                          />
                        ) : (
                          <Chip label="In Stock" size="small" color="success" />
                        )}
                      </TableCell>
                      <TableCell align="right">PKR {alert.product.price.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        PKR {(alert.product.quantity * alert.product.price).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(alert.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Stock Alert</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '16px !important' }}>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Products</Typography>
            <Select
              options={options}
              isMulti
              isSearchable
              value={selectedProducts}
              onChange={handleSelectChange}
              placeholder="Select products..."
              styles={{
                control: (base) => ({ ...base, borderRadius: 8, borderColor: '#E2E8F0', minHeight: 42 }),
                menu: (base) => ({ ...base, borderRadius: 8, zIndex: 9999 }),
              }}
            />
          </Box>
          <TextField
            label="Stock Threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            fullWidth
            size="small"
            helperText="Alert fires when stock quantity falls to or below this number"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create Alert</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Stock Alert"
        message="Are you sure you want to delete this stock alert?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}

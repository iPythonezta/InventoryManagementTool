import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useDevices } from '../Context/DeviceContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Barcode from 'react-barcode';
import {
  Box, Button, Card, TextField, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Alert, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PageLayout from '../Components/Layout/PageLayout';
import BarcodeScanner from '../Components/UI/BarcodeScanner';
import ConfirmDialog from '../Components/UI/ConfirmDialog';
import API_BASE_URL from '../config';

const emptyForm = { barcode: '', productName: '', price: 0, quantity: '', supplierName: '', supplierEmail: '' };

export default function Inventory() {
  const { user, loggedIn, token } = useAuth();
  const devices = useDevices();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editMode, setEditMode] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanTarget, setScanTarget] = useState('form');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canModify = user?.userType?.toLowerCase() === 'manager' || user?.userType?.toLowerCase() === 'admin' || user?.is_superuser;
  const canDelete = user?.userType?.toLowerCase() === 'admin' || user?.is_superuser;
  const deviceId = devices.length > 0 ? devices[0].deviceId : undefined;

  const fetchInventory = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/inventory/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setInventory(data);
      setFilteredInventory(data);
    } catch {
      toast.error('Could not fetch inventory');
    }
  };

  useEffect(() => { fetchInventory(); }, [token]);

  useEffect(() => {
    if (!query) { setFilteredInventory(inventory); return; }
    const q = query.toLowerCase();
    setFilteredInventory(inventory.filter(i =>
      i.productName.toLowerCase().includes(q) ||
      i.barcode.toLowerCase().includes(q) ||
      i.supplierName.toLowerCase().includes(q)
    ));
  }, [query, inventory]);

  const handleFieldChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_BASE_URL}/api/inventory/`, formData, { headers: { Authorization: `Token ${token}` } });
        toast.success('Item updated');
      } else {
        await axios.post(`${API_BASE_URL}/api/inventory/`, formData, { headers: { Authorization: `Token ${token}` } });
        toast.success('Item added');
      }
      setShowForm(false);
      setFormData(emptyForm);
      setEditMode(false);
      fetchInventory();
    } catch {
      toast.error(editMode ? 'Could not update item' : 'Could not add item');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/inventory/`, {
        headers: { Authorization: `Token ${token}` },
        data: { barcode: deleteTarget },
      });
      toast.success('Item deleted');
      setDeleteTarget(null);
      fetchInventory();
    } catch {
      toast.error('Could not delete item');
    }
  };

  const handleEdit = (item) => {
    setFormData({ id: item.id, barcode: item.barcode, productName: item.productName, price: item.price, quantity: item.quantity, supplierName: item.supplierName, supplierEmail: item.supplierEmail });
    setEditMode(true);
    setShowForm(true);
  };

  const handleScan = (text) => {
    if (scanTarget === 'form') {
      setFormData(prev => ({ ...prev, barcode: text }));
    } else {
      setQuery(text);
    }
    setScanActive(false);
  };

  if (!loggedIn) {
    return (
      <PageLayout title="Inventory">
        <Alert severity="info">Please log in to continue.</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Inventory">
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name, barcode, or supplier"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            endAdornment: (
              <IconButton size="small" onClick={() => { setScanTarget('search'); setScanActive(true); }}>
                <QrCodeScannerIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
        {canModify && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData(emptyForm); setEditMode(false); setShowForm(true); }}>
            Add Item
          </Button>
        )}
      </Box>

      {scanActive && scanTarget === 'search' && (
        <BarcodeScanner active={scanActive} onScan={handleScan} onClose={() => setScanActive(false)} deviceId={deviceId} />
      )}

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell align="right">Price (PKR)</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Contact</TableCell>
                {canModify && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>{index + 1}</TableCell>
                  <TableCell>
                    <Barcode value={item.barcode} height={40} width={1.2} fontSize={11} format="CODE128" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{item.productName}</Typography>
                  </TableCell>
                  <TableCell align="right">PKR {item.price.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={item.quantity}
                      size="small"
                      color={item.quantity <= 5 ? 'error' : item.quantity <= 20 ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{item.supplierEmail}</TableCell>
                  {canModify && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton size="small" color="primary" onClick={() => handleEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {canDelete && (
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(item.barcode)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredInventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              label="Barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleFieldChange}
              fullWidth
              size="small"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<QrCodeScannerIcon />}
              onClick={() => { setScanTarget('form'); setScanActive(true); setShowForm(false); }}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Scan
            </Button>
          </Box>
          <TextField label="Product Name" name="productName" value={formData.productName} onChange={handleFieldChange} fullWidth size="small" />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Price (PKR)" name="price" type="number" value={formData.price} onChange={handleFieldChange} fullWidth size="small" />
            <TextField label="Stock Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleFieldChange} fullWidth size="small" />
          </Box>
          <TextField label="Supplier Name" name="supplierName" value={formData.supplierName} onChange={handleFieldChange} fullWidth size="small" />
          <TextField label="Supplier Email" name="supplierEmail" type="email" value={formData.supplierEmail} onChange={handleFieldChange} fullWidth size="small" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editMode ? 'Update' : 'Add Item'}</Button>
        </DialogActions>
      </Dialog>

      {/* Scan modal (outside form dialog) */}
      {scanActive && scanTarget === 'form' && (
        <Dialog open={scanActive} onClose={() => setScanActive(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogContent>
            <BarcodeScanner
              active={scanActive}
              onScan={(text) => { handleScan(text); setShowForm(true); }}
              onClose={() => { setScanActive(false); setShowForm(true); }}
              deviceId={deviceId}
            />
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Item"
        message={`Are you sure you want to delete item with barcode "${deleteTarget}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}

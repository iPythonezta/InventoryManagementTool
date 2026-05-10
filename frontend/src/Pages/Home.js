import { useAuth } from '../Context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box, Grid, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton,
  TextField, InputAdornment, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PageLayout from '../Components/Layout/PageLayout';
import StatCard from '../Components/UI/StatCard';
import API_BASE_URL from '../config';

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 Days' },
  { value: 'month', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

export default function Home() {
  const { loggedIn, token, user } = useAuth();
  const [stats, setStats] = useState({});
  const [timeRange, setTimeRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthorized = user?.userType?.toLowerCase() === 'admin' || user?.userType?.toLowerCase() === 'manager';

  useEffect(() => {
    if (!token || !isAuthorized) return;
    axios.get(`${API_BASE_URL}/api/sales/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to fetch statistics'));
  }, [token]);

  const filteredProducts = (stats.product_data || []).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unitsSold = {
    today: stats.sales_today,
    week: stats.sales_in_7_days,
    month: stats.sales_in_30_days,
    all: stats.sales_in_all_time,
  }[timeRange] ?? 0;

  const ordersCount = {
    today: stats.orders_today,
    week: stats.orders_in_7_days,
    month: stats.orders_in_30_days,
    all: stats.totalOrders,
  }[timeRange] ?? 0;

  const revenue = {
    today: stats.sales_value_today,
    week: stats.value_in_7_days,
    month: stats.value_in_30_days,
    all: stats.value_in_all_time,
  }[timeRange] ?? 0;

  const getProductValue = (p, field) => ({
    today: p[`${field}_today`] ?? p[field] ?? 0,
    week: p[`${field}_in_7_days`] ?? p[field] ?? 0,
    month: p[`${field}_in_30_days`] ?? p[field] ?? 0,
    all: p[field] ?? 0,
  }[timeRange]);

  if (!loggedIn) {
    return (
      <PageLayout title="Dashboard">
        <Alert severity="info">Please log in to view the dashboard.</Alert>
      </PageLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <PageLayout title="Dashboard">
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Welcome, {user?.username}!</Typography>
            <Typography color="text.secondary">
              You are logged in as a <strong>{user?.userType}</strong>. Use the sidebar to navigate.
            </Typography>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dashboard">
      {/* Time range selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3" color="text.secondary">
          {TIME_RANGES.find(r => r.value === timeRange)?.label} Overview
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(_, v) => v && setTimeRange(v)}
          size="small"
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 0.5 }}
        >
          {TIME_RANGES.map(r => (
            <ToggleButton
              key={r.value}
              value={r.value}
              sx={{
                border: 'none', borderRadius: '8px !important', px: 2, fontWeight: 600, fontSize: '0.8125rem',
                '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } },
              }}
            >
              {r.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Units Sold" value={unitsSold} unit="units" icon={<ShoppingBagIcon />} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Orders" value={ordersCount} unit="orders" icon={<TrendingUpIcon />} color="secondary.main" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Revenue (PKR)" value={`PKR ${revenue.toLocaleString()}`} icon={<AttachMoneyIcon />} color="warning.main" />
        </Grid>
      </Grid>

      {/* Product breakdown */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4">Product Sales Breakdown</Typography>
            <TextField
              placeholder="Search by name or barcode"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 260 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Unit Price (PKR)</TableCell>
                  <TableCell align="right">Units Sold</TableCell>
                  <TableCell align="right">Sales Value (PKR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.barcode}</Typography>
                    </TableCell>
                    <TableCell align="right">PKR {p.price.toLocaleString()}</TableCell>
                    <TableCell align="right">{getProductValue(p, 'sale_quantity')}</TableCell>
                    <TableCell align="right">PKR {getProductValue(p, 'sale_value').toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

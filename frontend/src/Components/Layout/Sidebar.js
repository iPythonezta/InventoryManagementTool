import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Badge, Popover, Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_BASE_URL from '../../config';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/', roles: ['admin', 'manager', 'cashier'] },
  { label: 'Inventory', icon: <InventoryIcon />, path: '/inventory', roles: ['admin', 'manager', 'cashier'] },
  { label: 'Checkout', icon: <ShoppingCartIcon />, path: '/checkout', roles: ['admin', 'manager', 'cashier'] },
  { label: 'Orders', icon: <ReceiptIcon />, path: '/orders', roles: ['admin', 'manager', 'cashier'] },
  { label: 'Stock Alerts', icon: <WarningAmberIcon />, path: '/stock-alerts', roles: ['admin', 'manager'] },
  { label: 'Users', icon: <PeopleIcon />, path: '/users', roles: ['admin'] },
];

export default function Sidebar() {
  const { user, token, loggedIn, setLoggedIn, setToken, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const userType = user?.userType?.toLowerCase() || '';
  const visibleNav = loggedIn
    ? navItems.filter(item => item.roles.includes(userType) || user?.is_superuser)
    : [{ label: 'Home', icon: <HomeIcon />, path: '/', roles: [] }];

  const fetchAlerts = () => {
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/user/alerts/`, {
      headers: { Authorization: `Token ${token}` },
    }).then(r => setAlerts(r.data)).catch(() => {});
  };

  useEffect(() => { fetchAlerts(); }, [token]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/token/logout`, null, {
        headers: { Authorization: `Token ${token}` },
      });
    } catch {}
    localStorage.removeItem('token');
    setLoggedIn(false);
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const handleChangeStatus = async (e, id, seen) => {
    e.stopPropagation();
    try {
      await axios.put(`${API_BASE_URL}/api/user/alerts/`, { id, seen }, {
        headers: { Authorization: `Token ${token}` },
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, seen } : a));
    } catch {}
  };

  const handleDeleteAlert = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE_URL}/api/user/alerts/`, {
        headers: { Authorization: `Token ${token}` },
        data: { id },
      });
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alert deleted');
    } catch {
      toast.error('Could not delete alert');
    }
  };

  const unreadCount = alerts.filter(a => !a.seen).length;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#0F172A',
          color: '#CBD5E1',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, letterSpacing: '-0.02em' }}>
          InventoryPro
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          Management System
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav Items */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {visibleNav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  color: active ? '#FFFFFF' : '#94A3B8',
                  bgcolor: active ? 'rgba(37,99,235,0.3)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#FFFFFF' },
                  transition: 'all 0.15s ease',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? '#60A5FA' : '#64748B' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                />
                {active && (
                  <Box sx={{ width: 3, height: 20, bgcolor: '#2563EB', borderRadius: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Notifications */}
      {loggedIn && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Tooltip title="Notifications" placement="right">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            PaperProps={{
              sx: {
                width: 340, maxHeight: 420, overflow: 'auto',
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
              <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
            </Box>
            {alerts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No new alerts</Typography>
              </Box>
            ) : (
              alerts.map(alert => (
                <Box
                  key={alert.id}
                  sx={{
                    px: 2, py: 1.5,
                    borderBottom: '1px solid #F8FAFC',
                    bgcolor: alert.seen ? 'transparent' : '#EFF6FF',
                    display: 'flex', alignItems: 'flex-start', gap: 1,
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                      {alert.content}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title={alert.seen ? 'Mark unread' : 'Mark read'}>
                      <IconButton size="small" onClick={(e) => handleChangeStatus(e, alert.id, !alert.seen)}>
                        {alert.seen
                          ? <MarkEmailUnreadIcon sx={{ fontSize: 16, color: '#64748B' }} />
                          : <MarkEmailReadIcon sx={{ fontSize: 16, color: '#2563EB' }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={(e) => handleDeleteAlert(e, alert.id)}>
                        <DeleteIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))
            )}
          </Popover>
        </Box>
      )}

      {/* User section */}
      <Box sx={{ px: 2, py: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {loggedIn && user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#2563EB', fontSize: '0.875rem' }}>
              {user.email?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'capitalize' }}>
                {user.userType}
              </Typography>
            </Box>
          </Box>
        ) : null}
        <ListItemButton
          onClick={loggedIn ? handleLogout : () => navigate('/login')}
          sx={{
            borderRadius: 2, px: 2, py: 1,
            color: '#94A3B8',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            {loggedIn ? <LogoutIcon fontSize="small" /> : <LoginIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText
            primary={loggedIn ? 'Logout' : 'Login'}
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

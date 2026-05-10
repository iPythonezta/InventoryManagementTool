import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Box, Button, Card, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Alert, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PageLayout from '../Components/Layout/PageLayout';
import RoleBadge from '../Components/UI/RoleBadge';
import ConfirmDialog from '../Components/UI/ConfirmDialog';
import API_BASE_URL from '../config';

export default function Users() {
  const { user, token, loggedIn } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('cashier');
  const [userName, setUsername] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isAdmin = user?.userType?.toLowerCase() === 'admin' || user?.is_superuser;

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/users/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setUsers(data);
    } catch {
      toast.error('Could not fetch users');
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const resetForm = () => { setEmail(''); setPassword(''); setUserType('cashier'); setUsername(''); setEditMode(false); };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (u) => {
    setUsername(u.username);
    setEmail(u.email);
    setUserType(u.userType?.toLowerCase() || 'cashier');
    setEditMode(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_BASE_URL}/auth/users/`, { email, username: userName, userType }, {
          headers: { Authorization: `Token ${token}` },
        });
        toast.success('User updated');
      } else {
        await axios.post(`${API_BASE_URL}/auth/users/`, { email, password, userType }, {
          headers: { Authorization: `Token ${token}` },
        });
        toast.success('User created');
      }
      setShowForm(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.email?.[0] || data?.password?.[0] || data?.userType?.[0] || data?.message || 'Something went wrong';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/auth/users/`, {
        headers: { Authorization: `Token ${token}` },
        data: { email: deleteTarget },
      });
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Could not delete user');
    }
  };

  if (!loggedIn) {
    return (
      <PageLayout title="Users">
        <Alert severity="info">Please log in to continue.</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="User Management">
      {isAdmin && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add User</Button>
        </Box>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                {isAdmin && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u, index) => {
                const canAct = isAdmin && (u.userType?.toLowerCase() !== 'admin' || user?.is_superuser);
                return (
                  <TableRow key={u.email}>
                    <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.light', color: 'primary.main' }}>
                          {u.email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.userType} /></TableCell>
                    {isAdmin && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {canAct && (
                            <>
                              <IconButton size="small" color="primary" onClick={() => openEdit(u)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => setDeleteTarget(u.email)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm(); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={editMode}
            fullWidth
            size="small"
          />
          {!editMode && (
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
            />
          )}
          {editMode && (
            <TextField
              label="Username"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              size="small"
            />
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select value={userType} label="Role" onChange={(e) => setUserType(e.target.value)}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editMode ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User"
        message={`Delete user "${deleteTarget}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}

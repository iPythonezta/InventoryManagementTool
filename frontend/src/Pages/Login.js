import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import API_BASE_URL from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser, setToken, setLoggedIn, loggedIn } = useAuth();

  if (loggedIn) {
    navigate('/');
    return null;
  }

  const fetchUser = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/auth/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
    setUser(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token/login`, { email, password });
      const token = response.data.auth_token;
      setToken(token);
      setLoggedIn(true);
      localStorage.setItem('token', token);
      await fetchUser(token);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', p: 2, bgcolor: 'primary.light', borderRadius: 3, mb: 2 }}>
            <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          </Box>
          <Typography variant="h1" sx={{ mb: 0.5 }}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your InventoryPro account
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 1, py: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

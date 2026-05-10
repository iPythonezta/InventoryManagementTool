import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { useAuth } from './Context/AuthContext';
import { useEffect } from 'react';
import Login from './Pages/Login';
import Home from './Pages/Home';
import Users from './Pages/Users';
import Inventory from './Pages/Invetory';
import Checkout from './Pages/Checkout';
import Receipt from './Pages/Receipt';
import Orders from './Pages/Orders';
import StockAlerts from './Pages/StockAlerts';
import API_BASE_URL from './config';

function App() {
  const { setUser, setLoggedIn, setToken } = useAuth();

  useEffect(() => {
    const handleLogin = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/users/me/`, {
            headers: { Authorization: `Token ${storedToken}` },
          });
          setUser(response.data);
          setLoggedIn(true);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('token');
          setLoggedIn(false);
          setToken(null);
        }
      }
    };
    handleLogin();
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/users' element={<Users />} />
        <Route path='/inventory' element={<Inventory />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/receipt/:id' element={<Receipt />} />
        <Route path='/orders' element={<Orders />} />
        <Route path='/stock-alerts' element={<StockAlerts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

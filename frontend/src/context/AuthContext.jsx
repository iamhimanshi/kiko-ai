import { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      const userData = await loadUser();
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      // Step 1: Register
      await authApi.register(userData);
      
      // Step 2: Auto-login
      const loginResponse = await authApi.login({ 
        email: userData.email, 
        password: userData.password 
      });
      
      const { access_token } = loginResponse.data;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      
      // Step 3: Load user
      const userDataLoaded = await loadUser();
      
      return { success: true, user: userDataLoaded };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

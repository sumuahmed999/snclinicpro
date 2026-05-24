import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService, type LoginCredentials, type RegisterData } from '../services/auth';
import { AUTH_TOKEN_KEY } from '../utils/constants';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (storedToken) {
        try {
          const userData = await authService.getUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error: any) {
          // Only clear token if it's truly invalid (401), not on timeout
          if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    // Backend returns data directly, not wrapped in response.data.data
    const { token: newToken, user: newUser } = response;
    
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false); // Ensure loading is false after successful login
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    // Backend returns data directly, not wrapped in response.data.data
    const { token: newToken, user: newUser } = response;
    
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false); // Ensure loading is false after successful registration
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const user = await authService.getUser();
        setUser(user);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

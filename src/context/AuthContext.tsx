import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { authService } from '../services/api';
import { User, LoginRequest, RegisterRequest } from '../types/auth.types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ needsCompletion: boolean }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearData: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setNeedsProfileCompletion: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      // TEMPORAL: Descomentar para forzar logout en cada inicio
      // await authService.clearStorage();

      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest): Promise<{ needsCompletion: boolean }> => {
    try {
      const response = await authService.register(data);
      const isClient = data.role === 'client';

      // Si es cliente, marcar que necesita completar perfil
      if (isClient) {
        setNeedsProfileCompletion(true);
      }

      setUser(response.user);
      return { needsCompletion: isClient };
    } catch (error) {
      throw error;
    }
  };


  const loginWithGoogle = async () => {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'auth' });
      const discovery = await AuthSession.fetchDiscoveryAsync(
        'https://accounts.google.com'
      );
      
      const request = new AuthSession.AuthRequest({
        clientId: '855339673822-bct96b5jvi1tiau9t71rghckmo382sgb.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUrl,
        responseType: AuthSession.ResponseType.IdToken,
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.params.id_token) {
        const response = await authService.loginWithGoogle(result.params.id_token);
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error en Google login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const clearData = async () => {
    try {
      await authService.clearStorage();
      setUser(null);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authService.getMe();
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      needsProfileCompletion,
      login,
      register,
      logout,
      clearData,
      refreshUser,
      setNeedsProfileCompletion
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

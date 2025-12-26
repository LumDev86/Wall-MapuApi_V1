import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '855339673822-5tagccghm8kplp5rc58njhhh432p1cl3.apps.googleusercontent.com';

      console.log('Google Sign-In Config:', {
        webClientId,
        fromEnv: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });

      // Check if Play Services are available
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();

      console.log('Google Sign-In Response:', {
        hasIdToken: !!userInfo.idToken,
        hasServerAuthCode: !!userInfo.serverAuthCode,
        userEmail: userInfo.user?.email,
        allKeys: Object.keys(userInfo),
      });

      // Get the ID token
      const idToken = userInfo.idToken || userInfo.data?.idToken;

      if (idToken) {
        console.log('Sending idToken to backend...');
        // Send to backend
        const response = await authService.loginWithGoogle(idToken);
        setUser(response.user);
      } else {
        console.error('No idToken found. UserInfo:', JSON.stringify(userInfo, null, 2));
        throw new Error('No se pudo obtener el ID token de Google');
      }
    } catch (error: any) {
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
      loginWithGoogle,
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

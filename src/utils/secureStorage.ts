import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Wrapper de almacenamiento seguro que usa expo-secure-store
 * En dispositivos móviles, los datos se cifran automáticamente
 * En web, usa localStorage como fallback
 */

const KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
} as const;

export const secureStorage = {
  /**
   * Guardar el token de autenticación de forma segura
   */
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(KEYS.AUTH_TOKEN, token);
      } else {
        await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
      }
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  /**
   * Obtener el token de autenticación
   */
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(KEYS.AUTH_TOKEN);
      } else {
        return await SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Eliminar el token de autenticación
   */
  async deleteToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(KEYS.AUTH_TOKEN);
      } else {
        await SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  },

  /**
   * Guardar datos del usuario de forma segura
   */
  async saveUser(user: any): Promise<void> {
    try {
      const userString = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(KEYS.USER, userString);
      } else {
        await SecureStore.setItemAsync(KEYS.USER, userString);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  /**
   * Obtener datos del usuario
   */
  async getUser(): Promise<any | null> {
    try {
      let userString: string | null;
      if (Platform.OS === 'web') {
        userString = localStorage.getItem(KEYS.USER);
      } else {
        userString = await SecureStore.getItemAsync(KEYS.USER);
      }
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Eliminar datos del usuario
   */
  async deleteUser(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(KEYS.USER);
      } else {
        await SecureStore.deleteItemAsync(KEYS.USER);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  },

  /**
   * Limpiar todos los datos de autenticación
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.deleteToken(),
      this.deleteUser(),
    ]);
  },
};

export default secureStorage;

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Product } from '../types/product.types';
import { cartService } from '../services/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextData {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Cargar carrito desde el backend al iniciar
  useEffect(() => {
    refreshCart();
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const cart = await cartService.getCart();
      setTotalItems(cart.totalItems);
      setTotalPrice(cart.totalAmount);
    } catch (error: any) {
      // Si no hay carrito o error 404, simplemente dejar en 0
      if (error.response?.status === 404 || error.response?.status === 401) {
        setTotalItems(0);
        setTotalPrice(0);
      } else {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Funciones dummy para mantener compatibilidad con código existente
  // Todo el manejo real se hace en los screens que llaman directamente al cartService
  const addItem = async (product: Product, quantity: number = 1) => {
    try {
      await cartService.addToCart({
        productId: product.id,
        quantity,
      });
      await refreshCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeItem = async (productId: string) => {
    // Esta función no se usa porque CartScreen maneja la eliminación directamente
    await refreshCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    // Esta función no se usa porque CartScreen maneja las actualizaciones directamente
    await refreshCart();
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await refreshCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalItems = (): number => {
    return totalItems;
  };

  const getTotalPrice = (): number => {
    return totalPrice;
  };

  return (
    <CartContext.Provider
      value={{
        items: [], // No se usa más, todo viene del backend
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

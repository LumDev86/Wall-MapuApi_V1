import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { Cart, CartItem } from '../types/cart.types';
import { cartService, orderService } from '../services/api';
import ImageWithFallback from '../components/ImageWithFallback';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const CartScreen = () => {
  const { user } = useAuth();
  const { refreshCart: refreshCartContext } = useCart();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response);
    } catch (error: any) {
      console.error('❌ Error al cargar carrito:', error);
      if (error.response?.status === 404) {
        // No hay carrito aún, crear uno vacío
        setCart({ id: '', items: [], totalItems: 0, totalAmount: 0, createdAt: '', updatedAt: '' });
      } else {
        Alert.alert('Error', 'No se pudo cargar el carrito');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const handleIncreaseQuantity = async (item: CartItem) => {
    if (item.quantity >= item.stock) {
      Alert.alert('Stock insuficiente', `Solo hay ${item.stock} unidades disponibles`);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(item.id));
      const updatedCart = await cartService.updateCartItem(item.id, {
        quantity: item.quantity + 1,
      });
      setCart(updatedCart);
      await refreshCartContext();
    } catch (error: any) {
      console.error('❌ Error al actualizar cantidad:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar la cantidad');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleDecreaseQuantity = async (item: CartItem) => {
    if (item.quantity <= 1) return;

    try {
      setUpdatingItems(prev => new Set(prev).add(item.id));
      const updatedCart = await cartService.updateCartItem(item.id, {
        quantity: item.quantity - 1,
      });
      setCart(updatedCart);
      await refreshCartContext();
    } catch (error: any) {
      console.error('❌ Error al actualizar cantidad:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar la cantidad');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert(
      'Eliminar producto',
      `¿Deseas eliminar ${item.productName} del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingItems(prev => new Set(prev).add(item.id));
              const updatedCart = await cartService.removeCartItem(item.id);
              setCart(updatedCart);
              await refreshCartContext();
            } catch (error: any) {
              console.error('❌ Error al eliminar item:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            } finally {
              setUpdatingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que deseas vaciar todo el carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cartService.clearCart();
              setCart({ id: '', items: [], totalItems: 0, totalAmount: 0, createdAt: '', updatedAt: '' });
              await refreshCartContext();
            } catch (error: any) {
              console.error('❌ Error al vaciar carrito:', error);
              Alert.alert('Error', 'No se pudo vaciar el carrito');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleContinue = async () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos para continuar');
      return;
    }

    try {
      setCheckoutLoading(true);

      const checkoutResponse = await orderService.createCheckout();

      console.log('✅ Checkout creado:', checkoutResponse);

      const { order } = checkoutResponse;

      if (order.paymentUrl) {
        // Abrir el link de pago de MercadoPago
        const supported = await Linking.canOpenURL(order.paymentUrl);

        if (supported) {
          await Linking.openURL(order.paymentUrl);

          Alert.alert(
            'Orden creada',
            'Se abrió el link de pago de MercadoPago. Completa el pago para finalizar tu compra.',
            [
              {
                text: 'Ver mis órdenes',
                onPress: () => navigation.navigate('MyOrders'),
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ]
          );
        } else {
          Alert.alert('Error', 'No se pudo abrir el link de pago');
        }
      } else {
        Alert.alert(
          'Orden creada',
          'La orden se creó correctamente pero no se generó el link de pago.',
          [
            {
              text: 'Ver mis órdenes',
              onPress: () => navigation.navigate('MyOrders'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error en checkout:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo procesar el checkout';
      Alert.alert('Error', errorMessage);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isUpdating = updatingItems.has(item.id);

    return (
      <View style={[styles.cartItem, isUpdating && styles.cartItemUpdating]}>
        <ImageWithFallback
          uri={item.productImage}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.shopName} numberOfLines={1}>
                {item.shopName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleRemoveItem(item)}
              style={styles.deleteButton}
              disabled={isUpdating}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.itemFooter}>
            <View>
              <Text style={styles.price}>
                ${item.priceAtAddition.toLocaleString('es-AR')}
              </Text>
              <Text style={styles.subtotal}>
                Total: ${item.subtotal.toLocaleString('es-AR')}
              </Text>
            </View>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleDecreaseQuantity(item)}
                style={[styles.quantityButton, (item.quantity === 1 || isUpdating) && styles.quantityButtonDisabled]}
                disabled={item.quantity === 1 || isUpdating}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={item.quantity === 1 || isUpdating ? COLORS.gray : COLORS.primary}
                />
              </TouchableOpacity>

              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.quantityLoader} />
              ) : (
                <Text style={styles.quantity}>{item.quantity}</Text>
              )}

              <TouchableOpacity
                onPress={() => handleIncreaseQuantity(item)}
                style={[
                  styles.quantityButton,
                  (item.quantity >= item.stock || isUpdating) && styles.quantityButtonDisabled
                ]}
                disabled={item.quantity >= item.stock || isUpdating}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={item.quantity >= item.stock || isUpdating ? COLORS.gray : COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {item.quantity >= item.stock && (
            <Text style={styles.stockWarning}>Stock máximo alcanzado</Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={80} color={COLORS.lightGray} />
      </View>
      <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
      <Text style={styles.emptySubtitle}>
        Agrega productos para empezar a comprar
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('HomeTabs', undefined)}
      >
        <Text style={styles.shopButtonText}>Explorar Productos</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando carrito...</Text>
      </View>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mi Carrito</Text>

          <View style={styles.headerRight} />
        </View>

        {renderEmptyCart()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mi Carrito</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.locationText}>
              {user?.city && user?.province
                ? `${user.city}, ${user.province}`
                : 'Ubicación no configurada'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClearCart}
          style={styles.clearButton}
          disabled={loading || cart.items.length === 0}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal ({cart.totalItems} items)</Text>
            <Text style={styles.totalAmount}>
              ${cart.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalAmount}>
              ${cart.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, checkoutLoading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.continueButtonText}>Procesando...</Text>
            </>
          ) : (
            <>
              <Text style={styles.continueButtonText}>Ir a pagar</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerRight: {
    width: 40,
  },
  clearButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cartItemUpdating: {
    opacity: 0.6,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  shopName: {
    fontSize: 12,
    color: COLORS.gray,
  },
  deleteButton: {
    padding: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtotal: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  quantityLoader: {
    marginHorizontal: 16,
  },
  stockWarning: {
    fontSize: 11,
    color: COLORS.error,
    marginTop: 4,
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  totalContainer: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  grandTotalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default CartScreen;

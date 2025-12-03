import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { CartItem } from '../context/CartContext';
import ImageWithFallback from '../components/ImageWithFallback';
import { moderateScale as ms, scale as s, verticalScale as vs } from '../utils/responsive';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const CartScreen = () => {
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCart();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const handleIncreaseQuantity = (item: CartItem) => {
    if (item.quantity < item.product.stock) {
      updateQuantity(item.product.id, item.quantity + 1);
    } else {
      Alert.alert('Stock insuficiente', `Solo hay ${item.product.stock} unidades disponibles`);
    }
  };

  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert(
      'Eliminar producto',
      `¿Deseas eliminar ${item.product.name} del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeItem(item.product.id),
        },
      ]
    );
  };

  const handleContinue = () => {
    // TODO: Implement checkout navigation
    Alert.alert('Checkout', 'La funcionalidad de checkout estará disponible pronto');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const price = parseFloat(item.product.priceRetail);
    const itemTotal = price * item.quantity;

    return (
      <View style={styles.cartItem}>
        <ImageWithFallback
          uri={item.product.images[0]}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.shopName} numberOfLines={1}>
                {item.product.shop?.name || 'Tienda'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleRemoveItem(item)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.itemFooter}>
            <Text style={styles.price}>
              ${price.toLocaleString('es-AR')}
            </Text>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleDecreaseQuantity(item)}
                style={[styles.quantityButton, item.quantity === 1 && styles.quantityButtonDisabled]}
                disabled={item.quantity === 1}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={item.quantity === 1 ? COLORS.gray : COLORS.primary}
                />
              </TouchableOpacity>

              <Text style={styles.quantity}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => handleIncreaseQuantity(item)}
                style={[
                  styles.quantityButton,
                  item.quantity >= item.product.stock && styles.quantityButtonDisabled
                ]}
                disabled={item.quantity >= item.product.stock}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={item.quantity >= item.product.stock ? COLORS.gray : COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {item.quantity >= item.product.stock && (
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

  if (items.length === 0) {
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

  const totalPrice = getTotalPrice();

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

        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>
              ${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalAmount}>
              ${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
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

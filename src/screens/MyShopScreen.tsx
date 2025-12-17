import React, { useEffect, useState, useCallback } from 'react';
import { MainStackNavigationProp } from '../types/navigation.types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shopService, productService, subscriptionService } from '../services/api';
import { Shop, Product } from '../types/product.types';
import { Subscription } from '../types/subscription.types';
import { COLORS } from '../constants/colors';
import ImageWithFallback from '../components/ImageWithFallback';
import { moderateScale as ms, scale as s, getGridItemWidth } from '../utils/responsive';

interface MyShopScreenProps {
  navigation: MainStackNavigationProp<any>;
}

const MyShopScreen: React.FC<MyShopScreenProps> = ({ navigation }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [hasShop, setHasShop] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    fetchMyShop();
  }, []);

  const fetchMyShop = async () => {
    try {
      setLoading(true);
      const response = await shopService.getMyShop();
      console.log('🏪 MI TIENDA DATA:', JSON.stringify(response, null, 2));
      console.log('🏪 Tipo de tienda:', response.type);
      console.log('🏪 Logo URL:', response.logo);
      setShop(response);
      setHasShop(true);
      fetchProducts(response.id);
      fetchSubscription();
    } catch (error: any) {
      console.error('Error fetching my shop:', error);
      if (error.response?.status === 404) {
        setHasShop(false);
      } else {
        Alert.alert(
          'Error',
          'No se pudo cargar tu tienda. Por favor intenta de nuevo.',
          [
            { text: 'Reintentar', onPress: () => fetchMyShop() },
            { text: 'Volver', onPress: () => navigation.goBack() },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (shopId: string) => {
    try {
      setProductsLoading(true);
      const response = await productService.getByShop(shopId, { page: 1, limit: 10 });
      setProducts(response.data);
      setTotalProducts(response.pagination.total);
      console.log('📊 Total de productos:', response.pagination.total);
      console.log('📋 Productos cargados:', response.data.length);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyShop();
    setRefreshing(false);
  }, []);

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    }
  };

  const handleEmail = () => {
    if (shop?.email) {
      Linking.openURL(`mailto:${shop.email}`);
    }
  };

  const handleDirections = () => {
    if (shop?.latitude && shop?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleEditShop = () => {
    if (shop) {
      // TODO: Implementar EditShop screen
      console.warn('EditShop screen no está implementado');
    }
  };

  const handleAddProduct = () => {
    if (shop) {
      navigation.navigate('CreateProduct', { shopId: shop.id });
    }
  };

  const handleViewProducts = () => {
    if (shop) {
      navigation.navigate('ProductList', {
        shopId: shop.id,
        title: `Productos de ${shop.name}`,
      });
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionService.getMySubscription();
      setSubscription(response);
      setHasActiveSubscription(response.status === 'active');
      console.log('📋 Suscripción:', response.status);
    } catch (error: any) {
      console.log('⚠️ No hay suscripción activa');
      setSubscription(null);
      setHasActiveSubscription(false);
    }
  };

  const handleManageBanner = () => {
    if (!hasActiveSubscription) {
      Alert.alert(
        'Suscripción requerida',
        subscription && subscription.status === 'expired'
          ? 'Tu suscripción ha expirado. Renueva tu suscripción para poder gestionar banners promocionales.'
          : 'Necesitas una suscripción activa para gestionar banners promocionales.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Ver planes',
            onPress: () => navigation.navigate('Subscription'),
          },
        ]
      );
      return;
    }

    if (shop) {
      navigation.navigate('ManagePromotionalBanner', { shop });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (hasShop === false) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={100} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>No tienes una tienda</Text>
        <Text style={styles.emptyDescription}>
          Crea tu tienda para empezar a vender productos en Wallmapu
        </Text>
        <TouchableOpacity
          style={styles.createShopButton}
          onPress={() => navigation.navigate('CreateShop')}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
          <Text style={styles.createShopButtonText}>Crear Tienda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Tienda no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Tienda</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {shop.banner ? (
            <Image source={{ uri: shop.banner }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, { backgroundColor: COLORS.primary }]} />
          )}
          <View style={styles.logoContainer}>
            <ImageWithFallback
              uri={shop.logo}
              style={styles.logo}
            />
          </View>
        </View>

        {/* Información básica */}
        <View style={styles.infoContainer}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
              </Text>
            </View>
            {shop.isOpenNow && (
              <View style={styles.openBadge}>
                <Ionicons name="time" size={16} color="#4CAF50" />
                <Text style={styles.openText}>Abierto ahora</Text>
              </View>
            )}
          </View>
          {shop.description && (
            <Text style={styles.description}>{shop.description}</Text>
          )}
        </View>

        {/* Información de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.contactRow} onPress={handleDirections}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>
                {shop.address}, {shop.city}, {shop.province}
              </Text>
            </TouchableOpacity>

            {shop.phone && (
              <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                <Ionicons name="call" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{shop.phone}</Text>
              </TouchableOpacity>
            )}

            {shop.email && (
              <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
                <Ionicons name="mail" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{shop.email}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Horarios */}
        {shop.schedule && Object.keys(shop.schedule).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horarios de Atención</Text>
            <View style={styles.card}>
              {Object.entries(shop.schedule).map(([day, hours]: [string, any]) => (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{getDayName(day)}</Text>
                  <Text style={styles.scheduleHours}>
                    {hours.open} - {hours.close}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditShop}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Editar Tienda</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewProducts}>
              <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Ver Productos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                !hasActiveSubscription && styles.actionButtonDisabled
              ]}
              onPress={handleManageBanner}
            >
              <Ionicons
                name="megaphone-outline"
                size={24}
                color={hasActiveSubscription ? COLORS.primary : COLORS.gray}
              />
              <Text style={[
                styles.actionButtonText,
                !hasActiveSubscription && styles.actionButtonTextDisabled
              ]}>
                Banner Promocional
              </Text>
              {!hasActiveSubscription && (
                <View style={styles.subscriptionBadge}>
                  <Ionicons name="lock-closed" size={10} color={COLORS.white} />
                  <Text style={styles.subscriptionBadgeText}>Suscripción requerida</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Productos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Productos</Text>
            <TouchableOpacity onPress={handleViewProducts}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {productsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => {
                    if (!product.id) {
                      Alert.alert('Error', 'Este producto no tiene un identificador válido');
                      return;
                    }
                    navigation.navigate('ProductDetail', { productId: product.id });
                  }}
                >
                  <ImageWithFallback
                    uri={product.images[0]}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ${parseFloat(product.priceRetail).toLocaleString('es-AR')}
                  </Text>
                  <View style={styles.productStock}>
                    <Ionicons
                      name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={product.stock > 0 ? '#4CAF50' : COLORS.error}
                    />
                    <Text
                      style={[
                        styles.productStockText,
                        { color: product.stock > 0 ? '#4CAF50' : COLORS.error },
                      ]}
                    >
                      {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noProductsContainer}>
              <Ionicons name="cube-outline" size={48} color={COLORS.gray} />
              <Text style={styles.noProducts}>No tienes productos aún</Text>
              <Text style={styles.noProductsSubtext}>
                Agrega productos para empezar a vender
              </Text>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="cube-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>{totalProducts}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="eye-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Visitas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>5.0</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddProduct}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const getDayName = (day: string): string => {
  const days: { [key: string]: string } = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };
  return days[day] || day;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createShopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  bannerContainer: {
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  infoContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  scheduleDay: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  scheduleHours: {
    fontSize: 14,
    color: COLORS.gray,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionButtonTextDisabled: {
    color: COLORS.gray,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  subscriptionBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  productCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    padding: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    paddingHorizontal: 8,
  },
  productStock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  productStockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProducts: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
    fontWeight: '500',
  },
  noProductsSubtext: {
    fontSize: 14,
    color: COLORS.placeholder,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MyShopScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { NearbyShopCard } from '../components/NearbyShopCard';
import { shopService, subscriptionService, productService } from '../services/api';
import { Shop, Product } from '../types/product.types';
import { Subscription } from '../types/subscription.types';
import ImageWithFallback from '../components/ImageWithFallback';
import BannerCarousel from '../components/BannerCarousel';
import { moderateScale as ms, scale as s, verticalScale as vs, getStatusBarHeight } from '../utils/responsive';

// Importación condicional de react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  // react-native-maps no está disponible (Expo Go)
  console.log('react-native-maps no disponible en HomeScreen');
}

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const HomeScreen = () => {
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  // Estados para cliente
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [openNowShops, setOpenNowShops] = useState<Shop[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [totalShops, setTotalShops] = useState(0);

  // Estados para vendedor (retailer/wholesaler)
  const [myShop, setMyShop] = useState<Shop | null>(null);
  const [mySubscription, setMySubscription] = useState<Subscription | null>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasShop, setHasShop] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isVendor = user?.role === 'retailer' || user?.role === 'wholesaler';

  useEffect(() => {
    if (isVendor) {
      fetchVendorData();
    } else {
      fetchClientData();
    }
  }, [user?.role]);

  // Fetch data para clientes
  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [nearbyRes, openRes, featuredRes] = await Promise.all([
        shopService.getAll({
          page: 1,
          limit: 10,
          status: 'active',
          latitude: user?.latitude || undefined,
          longitude: user?.longitude || undefined,
        }),
        shopService.getAll({
          page: 1,
          limit: 10,
          status: 'active',
          openNow: true
        }),
        shopService.getAll({
          page: 1,
          limit: 5,
          status: 'active',
        }),
      ]);

      setNearbyShops(nearbyRes.data);
      setOpenNowShops(openRes.data);
      setFeaturedShops(featuredRes.data);
      setTotalShops(nearbyRes.pagination?.total || nearbyRes.data.length);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data para vendedores
  const fetchVendorData = async () => {
    try {
      setLoading(true);

      // Intentar obtener la tienda del usuario
      try {
        const shopData = await shopService.getMyShop();
        setMyShop(shopData);
        setHasShop(true);

        // Obtener productos de la tienda
        try {
          const productsRes = await productService.getByShop(shopData.id, { page: 1, limit: 5 });
          setMyProducts(productsRes.data);
          setTotalProducts(productsRes.pagination?.total || productsRes.data.length);
        } catch (e) {
          console.log('No products yet');
          setTotalProducts(0);
        }

        // Obtener suscripción
        try {
          const subData = await subscriptionService.getByShop(shopData.id);
          setMySubscription(subData);
        } catch (e: any) {
          // Backend puede devolver 404 o 500 cuando no hay suscripción
          const status = e.response?.status;
          if (status !== 404 && status !== 500) {
            console.log('Error fetching subscription:', e);
          }
          // Silenciar errores 404 y 500 (no hay suscripción)
          setMySubscription(null);
        }
      } catch (error: any) {
        const status = error.response?.status;
        if (status === 404) {
          // Solo 404 significa "no hay tienda"
          setHasShop(false);
        } else {
          // Otros errores (incluido 500) son problemas del backend
          // NO asumir que no hay tienda
          console.error('Error fetching shop:', error);
          console.error('⚠️ Error del backend al cargar tienda - la tienda podría existir pero el servidor falló');
        }
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (isVendor) {
      await fetchVendorData();
    } else {
      await fetchClientData();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const navigateToMap = () => {
    // Navigate to Map tab using nested navigation
    navigation.navigate('HomeTabs', { screen: 'Mapa' } as any);
  };

  const getShopStatusInfo = () => {
    if (!myShop) return null;

    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      'active': { label: 'Activa', color: '#4CAF50', icon: 'checkmark-circle' },
      'pending_payment': { label: 'Pendiente de pago', color: '#FF9800', icon: 'time' },
      'expired': { label: 'Suscripción expirada', color: '#F44336', icon: 'alert-circle' },
      'suspended': { label: 'Suspendida', color: '#F44336', icon: 'ban' },
    };

    return statusMap[myShop.status] || statusMap['pending_payment'];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ============ DASHBOARD PARA VENDEDORES ============
  if (isVendor) {
    return (
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Header Vendedor */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.vendorBadge}>
                <Ionicons name="storefront" size={16} color="#fff" />
                <Text style={styles.vendorBadgeText}>
                  {user?.role === 'retailer' ? 'Minorista' : 'Mayorista'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="notifications-outline" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.welcomeText}>{user?.name?.split(' ')[0] || 'Usuario'}!</Text>
            </View>
          </View>

          {/* Si no tiene tienda */}
          {hasShop === false && (
            <View style={styles.noShopCard}>
              <View style={styles.noShopIcon}>
                <Ionicons name="storefront-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.noShopTitle}>Crea tu tienda</Text>
              <Text style={styles.noShopText}>
                Configura tu tienda para empezar a vender y aparecer en el mapa
              </Text>
              <TouchableOpacity
                style={styles.createShopBtn}
                onPress={() => navigation.navigate('CreateShop')}
              >
                <Ionicons name="add-circle" size={22} color="#fff" />
                <Text style={styles.createShopBtnText}>Crear mi tienda</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Si tiene tienda */}
          {hasShop === true && myShop && (
            <>
              {/* Card de estado de la tienda */}
              <View style={styles.shopStatusCard}>
                <View style={styles.shopStatusHeader}>
                  <View style={styles.shopLogoContainer}>
                    {myShop.logo ? (
                      <Image source={{ uri: myShop.logo }} style={styles.shopLogo} />
                    ) : (
                      <View style={styles.shopLogoPlaceholder}>
                        <Ionicons name="storefront" size={28} color={COLORS.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.shopInfoContainer}>
                    <Text style={styles.shopName} numberOfLines={1}>{myShop.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getShopStatusInfo()?.color + '20' }]}>
                      <Ionicons
                        name={getShopStatusInfo()?.icon as any}
                        size={14}
                        color={getShopStatusInfo()?.color}
                      />
                      <Text style={[styles.statusBadgeText, { color: getShopStatusInfo()?.color }]}>
                        {getShopStatusInfo()?.label}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.editShopBtn}
                    onPress={() => navigation.navigate('MyShop')}
                  >
                    <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>

                {/* Alerta si necesita suscripción */}
                {myShop.status !== 'active' && (
                  <TouchableOpacity
                    style={styles.subscriptionAlert}
                    onPress={() => navigation.navigate('Subscription')}
                  >
                    <Ionicons name="warning" size={20} color="#FF9800" />
                    <Text style={styles.subscriptionAlertText}>
                      {myShop.status === 'pending_payment'
                        ? 'Suscríbete para aparecer en el mapa'
                        : 'Renueva tu suscripción para seguir visible'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#FF9800" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Estadísticas rápidas */}
              <View style={styles.vendorStatsSection}>
                <Text style={styles.sectionTitle}>Resumen</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Ionicons name="cube-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.statNumber}>{totalProducts}</Text>
                    <Text style={styles.statLabel}>Productos</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="eye-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.statNumber}>0</Text>
                    <Text style={styles.statLabel}>Visitas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="star-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.statNumber}>5.0</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
              </View>

              {/* Acciones rápidas */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('CreateProduct', { shopId: myShop.id })}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="add-circle" size={28} color="#2196F3" />
                    </View>
                    <Text style={styles.quickActionText}>Agregar Producto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('MyShop')}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="storefront" size={28} color="#4CAF50" />
                    </View>
                    <Text style={styles.quickActionText}>Mi Tienda</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('Subscription')}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="card" size={28} color="#FF9800" />
                    </View>
                    <Text style={styles.quickActionText}>Suscripción</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('ShopDetail', { shopId: myShop.id })}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="eye" size={28} color="#9C27B0" />
                    </View>
                    <Text style={styles.quickActionText}>Ver como cliente</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mis productos recientes */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mis productos</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('MyShop')}>
                    <Text style={styles.seeAllText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>

                {myProducts.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productsScrollContent}
                  >
                    {myProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productCard}
                        onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
                      >
                        <ImageWithFallback
                          uri={product.images[0]}
                          style={styles.productImage}
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                          <Text style={styles.productPrice}>
                            ${parseFloat(product.priceRetail).toLocaleString('es-AR')}
                          </Text>
                          <View style={styles.productStock}>
                            <Ionicons
                              name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                              size={14}
                              color={product.stock > 0 ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={[
                              styles.productStockText,
                              { color: product.stock > 0 ? '#4CAF50' : '#F44336' }
                            ]}>
                              {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {/* Botón agregar producto */}
                    <TouchableOpacity
                      style={styles.addProductCard}
                      onPress={() => navigation.navigate('CreateProduct', { shopId: myShop.id })}
                    >
                      <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
                      <Text style={styles.addProductText}>Agregar producto</Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <View style={styles.noProductsCard}>
                    <Ionicons name="cube-outline" size={48} color={COLORS.gray} />
                    <Text style={styles.noProductsText}>Aún no tienes productos</Text>
                    <TouchableOpacity
                      style={styles.addFirstProductBtn}
                      onPress={() => navigation.navigate('CreateProduct', { shopId: myShop.id })}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addFirstProductBtnText}>Agregar primer producto</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Info de suscripción */}
              {mySubscription && mySubscription.status === 'active' && (
                <View style={styles.subscriptionInfoCard}>
                  <View style={styles.subscriptionInfoHeader}>
                    <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                    <Text style={styles.subscriptionInfoTitle}>Suscripción activa</Text>
                  </View>
                  <Text style={styles.subscriptionInfoText}>
                    Tu tienda es visible en el mapa hasta el{' '}
                    {new Date(mySubscription.endDate).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  }

  // ============ HOME PARA CLIENTES ============
  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="location-outline" size={20} color="#fff" />
              <Text style={styles.locationText}>
                {user?.city && user?.province
                  ? `${user.city}, ${user.province}`
                  : user?.city || user?.province || 'Ubicación'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={28} color="#fff" />
              {getTotalItems() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.welcomeText}>{user?.name?.split(' ')[0] || 'Usuario'}!</Text>
            <Text style={styles.subtitle}>
              Encuentra las mejores tiendas para tu mascota
            </Text>
          </View>
        </View>

        {/* Banner promocional */}
        <View style={styles.bannerSection}>
          <TouchableOpacity style={styles.banner} onPress={navigateToMap}>
            <View style={styles.bannerContent}>
              <Ionicons name="storefront" size={40} color="#fff" style={styles.bannerIcon} />
              <View style={styles.bannerTextContent}>
                <Text style={styles.bannerTitle}>
                  Descubre tiendas cerca de ti
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Explora el mapa y encuentra todo para tu mascota
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Banner Carousel */}
        <BannerCarousel />

        {/* Mapa preview */}
        <View style={styles.mapSection}>
          <View style={styles.mapPreview}>
            {MapView ? (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                initialRegion={{
                  latitude: user?.latitude || -32.4827,
                  longitude: user?.longitude || -58.2363,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                {/* Marcadores de tiendas cercanas */}
                {nearbyShops.slice(0, 5).map((shop) => {
                  if (!shop.latitude || !shop.longitude) return null;
                  return (
                    <Marker
                      key={shop.id}
                      coordinate={{
                        latitude: parseFloat(String(shop.latitude)),
                        longitude: parseFloat(String(shop.longitude)),
                      }}
                      pinColor={COLORS.primary}
                    />
                  );
                })}
              </MapView>
            ) : (
              /* Placeholder para Expo Go */
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={48} color={COLORS.primary} />
                <Text style={styles.mapPlaceholderText}>
                  Mapa disponible en build nativo
                </Text>
              </View>
            )}
          </View>

          <View style={styles.mapOverlay}>
            <Text style={styles.mapTitle}>Explora el Mapa</Text>
            <Text style={styles.mapSubtitle}>
              Encuentra las mejores tiendas de mascotas cerca de ti
            </Text>
            <TouchableOpacity style={styles.mapButton} onPress={navigateToMap}>
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.mapButtonText}>Ver Mapa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="storefront-outline" size={28} color={COLORS.primary} />
              <Text style={styles.statNumber}>{totalShops}</Text>
              <Text style={styles.statLabel}>Tiendas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="location-outline" size={28} color={COLORS.primary} />
              <Text style={styles.statNumber}>{nearbyShops.length}</Text>
              <Text style={styles.statLabel}>Cerca de ti</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={28} color={COLORS.primary} />
              <Text style={styles.statNumber}>{openNowShops.length}</Text>
              <Text style={styles.statLabel}>Abiertas</Text>
            </View>
          </View>
        </View>

        {/* Tiendas cercanas */}
        {nearbyShops.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cerca de vos</Text>
              <TouchableOpacity onPress={navigateToMap}>
                <Text style={styles.seeAllText}>Ver mapa</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopsScrollContent}
            >
              {nearbyShops.map((shop) => (
                <NearbyShopCard
                  key={shop.id}
                  shop={shop}
                  onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
                  distance={shop.distance ? `${shop.distance.toFixed(1)}Km` : undefined}
                  productCount={shop.productCount}
                  categories={shop.categories?.map(c => c.name) || []}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tiendas abiertas ahora */}
        {openNowShops.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Abiertas Ahora</Text>
              </View>
              <TouchableOpacity onPress={navigateToMap}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopsScrollContent}
            >
              {openNowShops.map((shop) => (
                <NearbyShopCard
                  key={shop.id}
                  shop={shop}
                  onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
                  distance={shop.distance ? `${shop.distance.toFixed(1)}Km` : undefined}
                  productCount={shop.productCount}
                  categories={shop.categories?.map(c => c.name) || []}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tiendas destacadas */}
        {featuredShops.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="star" size={20} color="#FFA500" />
                <Text style={styles.sectionTitle}>Tiendas Destacadas</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopsScrollContent}
            >
              {featuredShops.map((shop) => (
                <NearbyShopCard
                  key={shop.id}
                  shop={shop}
                  onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
                  distance={shop.distance ? `${shop.distance.toFixed(1)}Km` : undefined}
                  productCount={shop.productCount}
                  categories={shop.categories?.map(c => c.name) || []}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty state si no hay tiendas */}
        {nearbyShops.length === 0 && openNowShops.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay tiendas disponibles</Text>
            <Text style={styles.emptySubtitle}>
              Aún no hay tiendas registradas en tu zona
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  welcomeSection: {
    marginBottom: 0,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  bannerSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerIcon: {
    marginRight: 16,
  },
  bannerTextContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  shopsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  mapSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#E8F5F0',
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D4F1E8',
    position: 'relative',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5F0',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
  // ============ ESTILOS VENDEDOR ============
  vendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  vendorBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  noShopCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noShopIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noShopTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  noShopText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createShopBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shopStatusCard: {
    margin: 20,
    marginBottom: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shopStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopLogoContainer: {
    marginRight: 12,
  },
  shopLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  shopLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfoContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editShopBtn: {
    padding: 8,
  },
  subscriptionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  subscriptionAlertText: {
    flex: 1,
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },
  vendorStatsSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  quickActionsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  productsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  productCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  productStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productStockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  addProductCard: {
    width: 140,
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addProductText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  noProductsCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  noProductsText: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: 12,
    marginBottom: 20,
  },
  addFirstProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  addFirstProductBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionInfoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
  },
  subscriptionInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  subscriptionInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subscriptionInfoText: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
});

export default HomeScreen;

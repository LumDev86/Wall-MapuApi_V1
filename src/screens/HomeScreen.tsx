import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';
import { ShopCard } from '../components/ShopCard';
import { NearbyShopCard } from '../components/NearbyShopCard';
import { categoryService, productService, shopService } from '../services/api';
import { Category, Product, Shop } from '../types/product.types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [openNowShops, setOpenNowShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes, shopsRes, openShopsRes] = await Promise.all([
        categoryService.getAll(),
        productService.getAll({ inStock: true, page: 1, limit: 10 }),
        shopService.getAll({ page: 1, limit: 5, type: 'retailer' }),
        shopService.getAll({ page: 1, limit: 5, openNow: true }),
      ]);

      setCategories(categoriesRes.categories);
      setProducts(productsRes.data.slice(0, 5));
      setPopularProducts(productsRes.data);
      setNearbyShops(shopsRes.data);
      setOpenNowShops(openShopsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.locationButton}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={styles.locationText}>
              {user?.city && user?.province
                ? `${user.city}, ${user.province}`
                : user?.city || user?.province || 'Ubicación no configurada'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={28} color="#fff" />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <View style={styles.welcomeRow}>
            <Ionicons name="paw" size={28} color="#fff" style={styles.pawIcon} />
            <Text style={styles.welcomeText}>¡Bienvenido, {user?.name}!</Text>
          </View>
          <Text style={styles.subtitle}>
            Tu marketplace de confianza para todo lo que tu mascota necesita
          </Text>
        </View>

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Busca alimentos, juguetes, accesori...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => {
                navigation.navigate('ProductList', {
                  categoryId: category.id,
                  categoryName: category.name,
                });
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.bannerSection}>
        <TouchableOpacity style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              Accede a miles de{'\n'}
              <Text style={styles.bannerHighlight}>productos{'\n'}</Text>
              para tu peludito amigo.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>40</Text>
            <Text style={styles.statLabel}>Tiendas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cerca de vos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyShopsContent}
        >
          {nearbyShops.map((shop) => (
            <NearbyShopCard
              key={shop.id}
              shop={shop}
              onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
              distance="0.5Km"
              productCount={200}
              categories={['Vacas', 'Gatos', 'Perros']}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abiertos Ahora</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyShopsContent}
        >
          {openNowShops.map((shop) => (
            <NearbyShopCard
              key={shop.id}
              shop={shop}
              onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
              distance="0.5Km"
              productCount={200}
              categories={['Vacas', 'Gatos', 'Perros']}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapSection}>
        <View style={styles.mapPreview}>
          {/* Simulación de marcadores en el mapa */}
          <View style={[styles.mapMarker, { top: '20%', left: '30%' }]}>
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
          <View style={[styles.mapMarker, { top: '40%', left: '60%' }]}>
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
          <View style={[styles.mapMarker, { top: '60%', left: '40%' }]}>
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
          <View style={[styles.mapMarker, { top: '50%', left: '70%' }]}>
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
          <View style={[styles.mapMarker, { top: '35%', left: '20%' }]}>
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
          {/* Marcador de ubicación del usuario */}
          <View style={[styles.userMarker, { top: '45%', left: '50%' }]}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        </View>

        <View style={styles.mapOverlay}>
          <Text style={styles.mapTitle}>Explora el Mapa</Text>
          <Text style={styles.mapSubtitle}>Encuentra pet shops cerca de ti</Text>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              navigation.navigate('HomeTabs', undefined);
            }}
          >
            <Text style={styles.mapButtonText}>Ver Mapa</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Más populares</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ProductList', { title: 'Más populares' });
            }}
          >
            <Text style={styles.seeAllText}>Ver todo</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsScrollContent}
        >
          {popularProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ofertas</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ProductList', { title: 'Ofertas' });
            }}
          >
            <Text style={styles.seeAllText}>Ver todo</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsScrollContent}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
            />
          ))}
        </ScrollView>
      </View>

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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: 38,
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
    marginBottom: 20,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pawIcon: {
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  categoriesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  nearbyShopsContent: {
    paddingHorizontal: 20,
  },
  productsScrollContent: {
    paddingHorizontal: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bannerSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    minHeight: 120,
    justifyContent: 'center',
  },
  bannerContent: {},
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 26,
  },
  bannerHighlight: {
    color: '#B8E6D5',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#D4F1E8',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mapSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#D4F1E8',
    borderRadius: 16,
    overflow: 'hidden',
    height: 400,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5F0',
    position: 'relative',
  },
  mapMarker: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    position: 'absolute',
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(212, 241, 232, 0.95)',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mapTitle: {
    fontSize: 20,
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
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;

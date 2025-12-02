import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { Shop, Product } from '../types/product.types';
import { shopService, productService } from '../services/api';

type ShopDetailRouteProp = RouteProp<
  { ShopDetail: { shopId: string } | { shop: Shop } },
  'ShopDetail'
>;

const ShopDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ShopDetailRouteProp>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [offerProducts, setOfferProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);

      let shopData: any;

      // Check if we received shop object or shopId
      if ('shop' in route.params) {
        shopData = route.params.shop;
      } else {
        const response = await shopService.getById(route.params.shopId);
        shopData = response.shop || response;
        console.log('Shop data from API:', JSON.stringify(shopData, null, 2));
      }

      setShop(shopData);

      // Check if shop data includes products
      let allProducts: Product[] = [];

      if (shopData.products?.data && Array.isArray(shopData.products.data)) {
        // If shop includes products in products.data
        console.log('Products from shop:', shopData.products.data.length);
        allProducts = shopData.products.data;
      } else if (shopData.products && Array.isArray(shopData.products)) {
        // If products is directly an array
        console.log('Products from shop (direct array):', shopData.products.length);
        allProducts = shopData.products;
      } else {
        // Otherwise fetch products separately and filter by shopId
        try {
          console.log('Fetching all products and filtering by shopId:', shopData.id);
          const productsResponse = await productService.getAll({
            page: 1,
            limit: 100, // Get more products to ensure we capture all from this shop
          });
          console.log('Total products from API:', productsResponse.data.length);

          // Filter products by shopId
          allProducts = productsResponse.data.filter(
            (product: any) => product.shopId === shopData.id
          );
          console.log('Products filtered for this shop:', allProducts.length);
        } catch (productError) {
          console.error('Error fetching products:', productError);
        }
      }

      setProducts(allProducts);

      console.log('Total products loaded:', allProducts.length);

      // Dividir productos en categorías
      const popular = allProducts.slice(0, 4);
      const newer = allProducts.slice(4, 8);
      const offers = allProducts.slice(8, 12);

      console.log('Popular products:', popular.length);
      console.log('New products:', newer.length);
      console.log('Offer products:', offers.length);

      setPopularProducts(popular);
      setNewProducts(newer);
      setOfferProducts(offers);
    } catch (error) {
      console.error('Error fetching shop data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toLocaleString('es-CL')}`;
  };

  const handleCall = () => {
    if (shop?.phone) {
      const phoneNumber = shop.phone.replace(/\s/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleDirections = () => {
    if (shop?.latitude && shop?.longitude) {
      const scheme = Platform.select({
        ios: 'maps:',
        android: 'geo:',
      });
      const url = Platform.select({
        ios: `${scheme}?q=${shop.latitude},${shop.longitude}`,
        android: `${scheme}${shop.latitude},${shop.longitude}?q=${shop.latitude},${shop.longitude}`,
      });
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const handleViewCatalog = () => {
    // Aquí puedes navegar a una pantalla de catálogo completo
    console.log('Ver catálogo completo');
  };

  const formatSchedule = (schedule: any) => {
    if (!schedule || Object.keys(schedule).length === 0) {
      return 'Horario no disponible';
    }

    const days = Object.keys(schedule);
    if (days.length === 0) return 'Horario no disponible';

    const firstDay = schedule[days[0]];
    return `Lun-Vie: ${firstDay.open} - ${firstDay.close}`;
  };

  const isShopOpen = () => {
    return shop?.isOpenNow || false;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información de la tienda</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => {
            // @ts-ignore
            navigation.navigate('SearchResults', {});
          }}
        >
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Busca alimentos, juguetes...</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner de la tienda con logo centrado */}
        <View style={styles.bannerContainer}>
          {/* Banner de fondo (puede estar vacío para futuro) */}
          {shop.banner ? (
            <Image
              source={{ uri: shop.banner }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emptyBanner} />
          )}

          {/* Logo centrado sobre el banner */}
          {shop.logo && (
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={{ uri: shop.logo }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        </View>

        {/* Información de la tienda */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.shopName}>{shop.name}</Text>
            {isShopOpen() && (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Abierto</Text>
              </View>
            )}
          </View>

          <Text style={styles.shopDescription}>{shop.description}</Text>

          {/* Dirección */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailText}>
                {shop.address}, {shop.city}
              </Text>
            </View>
          </View>

          {/* Horario */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Horario</Text>
              <Text style={styles.detailText}>{formatSchedule(shop.schedule)}</Text>
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Teléfono</Text>
              <Text style={styles.detailText}>{shop.phone}</Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDirections}
            >
              <Text style={styles.actionButtonText}>Como Llegar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCall}
            >
              <Text style={styles.actionButtonText}>Llamar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleViewCatalog}>
            <Text style={styles.catalogLink}>Ver catálogo</Text>
          </TouchableOpacity>
        </View>

        {/* Mensaje cuando no hay productos */}
        {products.length === 0 && !loading && (
          <View style={styles.emptyProductsContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyProductsText}>Esta tienda aún no tiene productos</Text>
            <Text style={styles.emptyProductsSubtext}>
              Los productos estarán disponibles próximamente
            </Text>
          </View>
        )}

        {/* Más populares */}
        {popularProducts.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Más populares</Text>
            <View style={styles.productsGrid}>
              {popularProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('ProductDetail', { product });
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Nuevos */}
        {newProducts.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Nuevos</Text>
            <View style={styles.productsGrid}>
              {newProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('ProductDetail', { product });
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Ofertas */}
        {offerProducts.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Ofertas</Text>
            <View style={styles.productsGrid}>
              {offerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('ProductDetail', { product });
                  }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toLocaleString('es-CL')}`;
  };

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productBrand} numberOfLines={1}>
        {product.shop?.name || product.brand}
      </Text>
      <Text style={styles.productPrice}>{formatPrice(product.priceRetail)}</Text>
      <Text style={styles.productStock}>Disponible</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={(e) => {
          e.stopPropagation();
          console.log('Agregar producto:', product.name);
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
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
  cartButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  emptyBanner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5F0',
  },
  logoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  infoSection: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  openBadge: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  openBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  catalogLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  emptyProductsContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  emptyProductsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  productsSection: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  productImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    minHeight: 32,
  },
  productBrand: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  productStock: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomPadding: {
    height: 100,
  },
});

export default ShopDetailScreen;

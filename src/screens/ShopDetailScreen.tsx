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
  Linking,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shopService, productService, categoryService } from '../services/api';
import { Shop, Product, Category } from '../types/product.types';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import ImageWithFallback from '../components/ImageWithFallback';
import { moderateScale as ms, scale as s, getGridItemWidth } from '../utils/responsive';

interface ShopDetailScreenProps {
  navigation: MainStackNavigationProp<any>;
  route: any;
}

const ShopDetailScreen: React.FC<ShopDetailScreenProps> = ({ navigation, route }) => {
  const { shopId } = route.params;
  const { addItem, getTotalItems } = useCart();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    fetchData();
  }, [shopId]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  // Registrar vista de la tienda (incrementar contador de clicks)
  useEffect(() => {
    const registerShopView = async () => {
      try {
        await shopService.incrementClick(shopId);
      } catch (error) {
        // Silenciar error para no afectar UX
        console.log('Error registrando vista de tienda');
      }
    };

    registerShopView();
  }, [shopId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopRes, categoriesRes] = await Promise.all([
        shopService.getById(shopId),
        categoryService.getAll(),
      ]);
      setShop(shopRes);
      setCategories(categoriesRes.categories || []);
      await fetchProducts();
    } catch (error) {
      console.error('Error fetching shop:', error);
      Alert.alert('Error', 'No se pudo cargar la tienda');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId?: string, search?: string) => {
    try {
      setProductsLoading(true);
      const response = await productService.getByShop(shopId, {
        page: 1,
        limit: 50,
        categoryId: categoryId || undefined,
        search: search || undefined,
      });
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category?.id === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    }
  };

  const handleDirections = () => {
    if (shop?.latitude && shop?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    Alert.alert('Agregado', `${product.name} se agregó al carrito`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  // Get unique categories from products
  const productCategories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [p.category!.id, p.category!])
    ).values()
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        stickyHeaderIndices={[2]}
      >
        {/* Header con banner */}
        <View style={styles.bannerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartButton}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
          {shop.banner ? (
            <Image source={{ uri: shop.banner }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="storefront" size={60} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <View style={styles.logoContainer}>
            <ImageWithFallback
              uri={shop.logo}
              style={styles.logo}
            />
          </View>
        </View>

        {/* Información de la tienda */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <View style={styles.badgesRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>
                    {shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
                  </Text>
                </View>
                {shop.isOpenNow && (
                  <View style={styles.openBadge}>
                    <View style={styles.openDot} />
                    <Text style={styles.openText}>Abierto</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {shop.description && (
            <Text style={styles.description}>{shop.description}</Text>
          )}

          {/* Botones de acción rápida */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Llamar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Cómo llegar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                if (shop.phone) Linking.openURL(`https://wa.me/${shop.phone.replace(/\D/g, '')}`);
              }}
            >
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

          {/* Botón de Catálogo Completo */}
          {products.length > 0 && (
            <TouchableOpacity
              style={styles.catalogButton}
              onPress={() =>
                navigation.navigate('ProductList', {
                  shopId: shop.id,
                  title: `Catálogo de ${shop.name}`,
                  shopName: shop.name,
                })
              }
            >
              <View style={styles.catalogButtonContent}>
                <Ionicons name="grid-outline" size={22} color="#fff" />
                <Text style={styles.catalogButtonText} numberOfLines={1}>Ver Catálogo Completo</Text>
                <Text style={styles.catalogButtonCount}>
                  {products.length} producto{products.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          )}

        {/* Barra de búsqueda sticky */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos en esta tienda..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Categorías */}
          {productCategories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedCategory && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    !selectedCategory && styles.categoryChipTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {productCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Productos */}
        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <Text style={styles.productsTitle}>
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              {selectedCategory || searchQuery ? ' encontrados' : ''}
            </Text>
            {(selectedCategory || searchQuery) && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>

          {productsLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
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
                    uri={product.images?.[0]}
                    style={styles.productImage}
                  />
                  {product.stock <= 0 && (
                    <View style={styles.outOfStockBadge}>
                      <Text style={styles.outOfStockText}>Agotado</Text>
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    {product.brand && (
                      <Text style={styles.productBrand}>{product.brand}</Text>
                    )}
                    <Text style={styles.productPrice}>
                      ${parseFloat(product.priceRetail).toLocaleString('es-AR')}
                    </Text>
                    {product.stock > 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.addButton, styles.addButtonDisabled]}>
                        <Ionicons name="close" size={20} color="#999" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyProducts}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyProductsTitle}>No se encontraron productos</Text>
              <Text style={styles.emptyProductsSubtitle}>
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Esta tienda aún no tiene productos'}
              </Text>
              {(searchQuery || selectedCategory) && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersButtonText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Información adicional */}
        <View style={styles.additionalInfo}>
          {/* Horarios */}
          {shop.schedule && Object.keys(shop.schedule).length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoCardTitle}>Horarios</Text>
              </View>
              {Object.entries(shop.schedule).map(([day, hours]: [string, any]) => (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{getDayName(day)}</Text>
                  <Text style={styles.scheduleHours}>
                    {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Contacto */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoCardTitle}>Información de contacto</Text>
            </View>
            <TouchableOpacity style={styles.contactRow} onPress={handleDirections}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.contactText}>
                {shop.address}, {shop.city}, {shop.province}
              </Text>
            </TouchableOpacity>
            {shop.phone && (
              <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                <Ionicons name="call-outline" size={18} color="#666" />
                <Text style={styles.contactText}>{shop.phone}</Text>
              </TouchableOpacity>
            )}
            {shop.email && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${shop.email}`)}
              >
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.contactText}>{shop.email}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  cartButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  banner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  infoContainer: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLeft: {
    flex: 1,
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
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  openText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  catalogButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catalogButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    flexShrink: 1,
  },
  catalogButtonCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  categoriesContent: {
    paddingTop: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  productsSection: {
    padding: 20,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F5F5F5',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
    position: 'relative',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    paddingRight: 36,
  },
  productBrand: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  },
  addButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProductsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyProductsSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  additionalInfo: {
    paddingHorizontal: 20,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleDay: {
    fontSize: 14,
    color: COLORS.text,
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default ShopDetailScreen;

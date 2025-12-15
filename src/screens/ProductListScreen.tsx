import React, { useState, useEffect, useCallback } from 'react';
import { MainStackNavigationProp } from '../types/navigation.types';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { MainStackParamList } from '../types/navigation.types';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { productService, categoryService } from '../services/api';
import { Product, Category } from '../types/product.types';

interface ProductListScreenProps {
  navigation: MainStackNavigationProp<any>;
  route: any;
}

const PRODUCTS_PER_PAGE = 20;

const ProductListScreen: React.FC<ProductListScreenProps> = ({ navigation, route }) => {
  const screenNavigation = useNavigation<MainStackNavigationProp<any>>();
  const { getTotalItems, addItem } = useCart();
  const { title, categoryId, categoryName, shopId, shopName } = route.params || {};

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchProducts(1, true);
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (page: number = 1, reset: boolean = false) => {
    if (loading && !reset) return;
    if (loadingMore) return;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page,
        limit: PRODUCTS_PER_PAGE,
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
      };

      let response;
      if (shopId) {
        response = await productService.getByShop(shopId, params);
      } else {
        response = await productService.getAll(params);
      }

      const newProducts = response.data || [];
      const total = response.pagination?.total || newProducts.length;

      if (reset) {
        setProducts(newProducts);
        setCurrentPage(1);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      setTotalProducts(total);
      setHasMore(newProducts.length === PRODUCTS_PER_PAGE && products.length + newProducts.length < total);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(currentPage + 1, false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(1, true);
  }, [selectedCategory, searchQuery]);

  const handleCategoryPress = (catId: string | null) => {
    setSelectedCategory(selectedCategory === catId ? null : catId);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    Alert.alert('Agregado', `${product.name} se agregó al carrito`);
  };

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        if (!product.id) {
          Alert.alert('Error', 'Este producto no tiene un identificador válido');
          return;
        }
        navigation.navigate('ProductDetail', { productId: product.id });
      }}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: product.images?.[0] }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
      {product.stock <= 0 && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>Agotado</Text>
        </View>
      )}
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      {!shopId && product.shop?.name && (
        <Text style={styles.shopName} numberOfLines={1}>
          {product.shop.name}
        </Text>
      )}
      {product.brand && (
        <Text style={styles.brandName} numberOfLines={1}>
          {product.brand}
        </Text>
      )}
      <Text style={styles.productPrice}>
        ${parseFloat(product.priceRetail).toLocaleString('es-AR')}
      </Text>
      {product.stock > 0 ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(product)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={[styles.addButton, styles.addButtonDisabled]}>
          <Ionicons name="close" size={20} color="#999" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={shopId ? `Buscar en ${shopName || 'esta tienda'}...` : 'Buscar productos...'}
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
      </View>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, name: 'Todos' }, ...categories]}
            keyExtractor={(item) => item.id || 'all'}
            contentContainerStyle={styles.categoriesContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryPress(item.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === item.id && styles.categoryChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {loading ? 'Cargando...' : `${totalProducts} producto${totalProducts !== 1 ? 's' : ''}`}
        </Text>
        {(selectedCategory || searchQuery) && (
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>Cargando más productos...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No se encontraron productos</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? 'Intenta con otros términos de búsqueda'
            : 'Esta tienda aún no tiene productos'}
        </Text>
        {(searchQuery || selectedCategory) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearButtonText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || shopName || categoryName || 'Catálogo'}
          </Text>
          {shopName && <Text style={styles.headerSubtitle}>{shopName}</Text>}
        </View>
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

      {/* Products List */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
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
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInputContainer: {
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
  categoriesSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
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
    marginBottom: 12,
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
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
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginHorizontal: 12,
    minHeight: 36,
  },
  shopName: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 12,
    marginTop: 4,
  },
  brandName: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ProductListScreen;

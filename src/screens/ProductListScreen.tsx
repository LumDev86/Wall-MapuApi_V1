import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { productService } from '../services/api';
import { Product } from '../types/product.types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface ProductListScreenProps {
  navigation: NavigationProp;
  route: any;
}

const ProductListScreen: React.FC<ProductListScreenProps> = ({ navigation, route }) => {
  const screenNavigation = useNavigation<NavigationProp>();
  const { getTotalItems } = useCart();
  const { title, categoryId, categoryName } = route.params || {};
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(
    categoryName ? [categoryName] : []
  );

  const filters = ['Comida', 'Gato', 'Perro', 'Tortugas'];

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        inStock: true,
        page: 1,
        limit: 20,
        ...(categoryId && { categoryId }),
      };

      let response;
      if (route.params?.shopId) {
        response = await productService.getByShop(route.params.shopId, params);
      } else {
        response = await productService.getAll(params);
      }

      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => screenNavigation.navigate('Search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Busca productos, marcas...</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{categoryName || title || 'Resultados'}</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilters.includes(filter);
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => toggleFilter(filter)}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {filter}
                </Text>
                {isSelected && (
                  <Ionicons name="close" size={16} color={COLORS.primary} style={styles.closeIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.productsGrid}>
          {products.map((product, index) => {
            // Insertar banner después del 2do producto
            if (index === 2) {
              return (
                <React.Fragment key={`fragment-${product.id}`}>
                  <View style={styles.bannerContainer}>
                    <View style={styles.banner}>
                      <Text style={styles.bannerTitle}>
                        Accede a miles de{'\n'}
                        <Text style={styles.bannerHighlight}>productos{'\n'}</Text>
                        para tu peludito amigo.
                      </Text>
                    </View>
                  </View>
                  <ProductGridCard key={product.id} product={product} navigation={navigation} />
                </React.Fragment>
              );
            }
            return <ProductGridCard key={product.id} product={product} navigation={navigation} />;
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

interface ProductGridCardProps {
  product: Product;
  navigation: any;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, navigation }) => {
  return (
    <View style={styles.productCard}>
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
      <Text style={styles.shopName} numberOfLines={1}>
        {product.shop?.name || 'Tienda'}
      </Text>
      <Text style={styles.productPrice}>${product.priceRetail}</Text>
      <Text style={styles.productStock}>Disponible</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
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
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterButton: {
    padding: 4,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  closeIcon: {
    marginLeft: 4,
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
    height: 120,
    backgroundColor: '#f5f5f5',
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    minHeight: 36,
  },
  shopName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 8,
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
  bannerContainer: {
    width: '100%',
    marginBottom: 12,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 24,
  },
  bannerHighlight: {
    color: '#B8E6D5',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});

export default ProductListScreen;

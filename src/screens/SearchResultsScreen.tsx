import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { productService } from '../services/api';
import { Product } from '../types/product.types';
import { useAuth } from '../context/AuthContext';

interface SearchResultsScreenProps {
  navigation: any;
  route: any;
}

const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({ navigation, route }) => {
  const { initialQuery } = route.params || {};
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  const filters = ['Comida', 'Gato', 'Perro', 'Tortugas'];

  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      performSearch();
    }
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const params: {
        query: string;
        limit?: number;
        latitude?: number;
        longitude?: number;
      } = {
        query: searchQuery,
        limit: 20,
      };

      // Add user location if available
      if (user?.latitude && user?.longitude) {
        params.latitude = typeof user.latitude === 'string' ? parseFloat(user.latitude) : user.latitude;
        params.longitude = typeof user.longitude === 'string' ? parseFloat(user.longitude) : user.longitude;
      }

      const response = await productService.search(params);
      setProducts(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
      setTotal(0);
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

  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      performSearch();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca alimentos, juguetes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={true}
          />
          {loading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.searchLoader} />
          )}
        </View>
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Resultados</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {loading && products.length === 0 && searchQuery.length >= 2 && (
          <Text style={styles.resultsCount}>Buscando productos...</Text>
        )}

        {!loading && total > 0 && (
          <Text style={styles.resultsCount}>
            {total} {total === 1 ? 'producto encontrado' : 'productos encontrados'}
          </Text>
        )}

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
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    onPress={() => navigation.navigate('ProductDetail', { product })}
                    onShopPress={
                      product.shop
                        ? () => {
                            // @ts-ignore
                            navigation.navigate('ShopDetail', { shop: product.shop });
                          }
                        : undefined
                    }
                  />
                </React.Fragment>
              );
            }
            return (
              <ProductGridCard
                key={product.id}
                product={product}
                onPress={() => navigation.navigate('ProductDetail', { product })}
                onShopPress={
                  product.shop
                    ? () => {
                        // @ts-ignore
                        navigation.navigate('ShopDetail', { shop: product.shop });
                      }
                    : undefined
                }
              />
            );
          })}
        </View>

        {products.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No se encontraron productos</Text>
            <Text style={styles.emptySubtext}>
              Intenta con otro término de búsqueda
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

interface ProductGridCardProps {
  product: Product;
  onPress: () => void;
  onShopPress?: () => void;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, onPress, onShopPress }) => {
  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toLocaleString('es-CL')}`;
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
      {onShopPress && product.shop ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onShopPress();
          }}
        >
          <Text style={[styles.shopName, styles.shopNameClickable]} numberOfLines={1}>
            {product.shop.name}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.shopName} numberOfLines={1}>
          {product.shop?.name || product.brand}
        </Text>
      )}
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchLoader: {
    marginLeft: 8,
  },
  cartButton: {
    padding: 4,
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  shopNameClickable: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default SearchResultsScreen;

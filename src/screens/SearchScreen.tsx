import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../constants/colors';
import { productService } from '../services/api';
import { SearchProduct } from '../types/product.types';
import ImageWithFallback from '../components/ImageWithFallback';
import { moderateScale as ms, scale as s, getGridItemWidth } from '../utils/responsive';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface SearchScreenProps {
  navigation: NavigationProp;
  route: any;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If query is empty, clear results
    if (!searchQuery.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);
      const response = await productService.search({
        query: searchQuery.trim(),
        limit: 20,
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    if (!productId) {
      Alert.alert('Error', 'Este producto no tiene un identificador válido');
      return;
    }
    navigation.navigate('ProductDetail', { productId });
  };

  return (
    <View style={styles.container}>
      {/* Header with Search Input */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca productos..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* Empty Query State */}
        {!hasSearched && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color={COLORS.lightGray} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Escribe para buscar</Text>
            <Text style={styles.emptySubtitle}>
              Busca productos, marcas o categorías
            </Text>
          </View>
        )}

        {/* No Results State */}
        {hasSearched && !loading && products.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.lightGray} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
            <Text style={styles.emptySubtitle}>
              Intenta con otra búsqueda
            </Text>
          </View>
        )}

        {/* Results Grid */}
        {products.length > 0 && (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <SearchProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

interface SearchProductCardProps {
  product: SearchProduct;
  onPress: () => void;
}

const SearchProductCard: React.FC<SearchProductCardProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.productImageContainer}>
        <ImageWithFallback
          uri={product.images[0]}
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  bottomPadding: {
    height: 100,
  },
});

export default SearchScreen;

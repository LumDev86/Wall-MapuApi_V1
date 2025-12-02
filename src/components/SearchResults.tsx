import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface SearchResultsProps {
  results: Product[];
  isSearching: boolean;
  searchQuery: string;
  total: number;
  onProductPress: (product: Product) => void;
  onClose: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isSearching,
  searchQuery,
  total,
  onProductPress,
  onClose,
}) => {
  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toLocaleString('es-CL')}`;
  };

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Buscando productos...</Text>
        </View>
      );
    }

    if (searchQuery.length >= 2 && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No se encontraron productos</Text>
          <Text style={styles.emptySubtext}>
            Intenta con otro término de búsqueda
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        onProductPress(item);
        onClose();
      }}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.resultImage}
        resizeMode="contain"
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.resultBrand} numberOfLines={1}>
          {item.brand}
        </Text>
        <View style={styles.shopInfo}>
          <Ionicons name="storefront-outline" size={14} color="#666" />
          <Text style={styles.shopName} numberOfLines={1}>
            {item.shop?.name || 'Tienda'}
          </Text>
          {item.shop?.distance !== undefined && (
            <>
              <Ionicons name="location-outline" size={14} color="#666" style={styles.distanceIcon} />
              <Text style={styles.distance}>
                {typeof item.shop.distance === 'number'
                  ? item.shop.distance.toFixed(1)
                  : item.shop.distance} km
              </Text>
            </>
          )}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.resultPrice}>{formatPrice(item.priceRetail)}</Text>
          <Text style={styles.stock}>
            {item.stock > 0 ? 'Disponible' : 'Sin stock'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (!searchQuery || searchQuery.length < 2) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Resultados</Text>
          {total > 0 && (
            <Text style={styles.headerCount}>
              {total} {total === 1 ? 'producto' : 'productos'}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerCount: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  resultImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  resultBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  shopName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  distanceIcon: {
    marginLeft: 8,
  },
  distance: {
    fontSize: 12,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stock: {
    fontSize: 11,
    color: '#4CAF50',
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
});

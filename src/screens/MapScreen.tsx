import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { shopService } from '../services/api';
import { Shop } from '../types/product.types';

const MapScreen = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await shopService.getAll({ page: 1, limit: 10 });
      setShops(response.data);
      if (response.data.length > 0) {
        setSelectedShop(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
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
        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="location" size={20} color="#fff" />
          <Text style={styles.locationText}>Ubicacion, Ciudad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Busca alimentos, juguetes, accesori..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Simulación de mapa con marcadores */}
          {shops.slice(0, 6).map((shop, index) => {
            const positions = [
              { top: '15%', left: '25%' },
              { top: '30%', left: '50%' },
              { top: '45%', left: '35%' },
              { top: '55%', left: '65%' },
              { top: '35%', left: '75%' },
              { top: '65%', left: '20%' },
            ];
            const position = positions[index] || { top: '50%', left: '50%' };
            const isSelected = selectedShop?.id === shop.id;

            return (
              <TouchableOpacity
                key={shop.id}
                style={[
                  styles.mapMarker,
                  isSelected ? styles.mapMarkerSelected : styles.mapMarkerDefault,
                  { top: position.top, left: position.left },
                ]}
                onPress={() => setSelectedShop(shop)}
              >
                <Ionicons name="storefront" size={20} color="#fff" />
              </TouchableOpacity>
            );
          })}

          {/* Marcador de ubicación del usuario */}
          <View style={[styles.userMarker, { top: '50%', left: '45%' }]}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Tiendas Cerca de vos</Text>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shopsListContent}
          style={styles.shopsList}
        >
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              isSelected={selectedShop?.id === shop.id}
              onPress={() => setSelectedShop(shop)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

interface ShopCardProps {
  shop: Shop;
  isSelected: boolean;
  onPress: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.shopCard, isSelected && styles.shopCardSelected]}
      onPress={onPress}
    >
      <View style={styles.shopLogoContainer}>
        <Image source={{ uri: shop.logo }} style={styles.shopLogo} resizeMode="contain" />
      </View>
      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {shop.name}
        </Text>
        <Text style={styles.shopCategory} numberOfLines={1}>
          Alimento
        </Text>
        <Text style={styles.shopType} numberOfLines={1}>
          {shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
        </Text>
      </View>
      <View style={styles.shopDistance}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.distanceText}>0.5Km</Text>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5F0',
    position: 'relative',
  },
  mapMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
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
  mapMarkerDefault: {
    backgroundColor: COLORS.primary,
  },
  mapMarkerSelected: {
    backgroundColor: '#FF6B35',
  },
  userMarker: {
    position: 'absolute',
    backgroundColor: '#4285F4',
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
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  shopsList: {
    maxHeight: 140,
  },
  shopsListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 280,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  shopCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9F6',
  },
  shopLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopLogo: {
    width: 40,
    height: 40,
  },
  shopInfo: {
    flex: 1,
    marginRight: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  shopCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  shopType: {
    fontSize: 12,
    color: '#999',
  },
  shopDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default MapScreen;

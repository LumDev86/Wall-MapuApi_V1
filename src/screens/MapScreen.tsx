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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { shopService } from '../services/api';
import { Shop } from '../types/product.types';

interface ShopWithDistance extends Shop {
  distance?: number;
}

const MapScreen = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<ShopWithDistance | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  // Fórmula de Haversine para calcular distancia entre dos coordenadas
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Redondear a 1 decimal
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await shopService.getAll({ page: 1, limit: 10 });

      // Calcular distancias y ordenar por proximidad
      const shopsWithDistance = response.data
        .map((shop: Shop) => {
          if (shop.latitude && shop.longitude && user?.latitude && user?.longitude) {
            const distance = calculateDistance(
              user.latitude,
              user.longitude,
              shop.latitude,
              shop.longitude
            );
            return { ...shop, distance };
          }
          return { ...shop, distance: undefined };
        })
        .sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });

      setShops(shopsWithDistance);
      if (shopsWithDistance.length > 0) {
        setSelectedShop(shopsWithDistance[0]);
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
          <Text style={styles.locationText}>
            {user?.city && user?.province
              ? `${user.city}, ${user.province}`
              : user?.city || user?.province || 'Ubicación no configurada'}
          </Text>
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
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: user?.latitude || -34.6037,
            longitude: user?.longitude || -58.3816,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {/* Marcador del usuario */}
          {user?.latitude && user?.longitude && (
            <Marker
              coordinate={{
                latitude: user.latitude,
                longitude: user.longitude,
              }}
              title="Tu ubicación"
              description={user.city && user.province ? `${user.city}, ${user.province}` : 'Mi ubicación'}
              pinColor="#4285F4"
            />
          )}

          {/* Marcadores de tiendas */}
          {shops.map((shop) => {
            if (!shop.latitude || !shop.longitude) return null;
            const isSelected = selectedShop?.id === shop.id;

            return (
              <Marker
                key={shop.id}
                coordinate={{
                  latitude: shop.latitude,
                  longitude: shop.longitude,
                }}
                title={shop.name}
                description={`${shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}${shop.distance ? ` - ${shop.distance}km` : ''}`}
                pinColor={isSelected ? '#FF6B35' : COLORS.primary}
                onPress={() => setSelectedShop(shop)}
              />
            );
          })}
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Tiendas Cerca de vos</Text>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {!user?.latitude || !user?.longitude ? (
          <View style={styles.noLocationContainer}>
            <Ionicons name="location-outline" size={48} color="#999" />
            <Text style={styles.noLocationText}>
              Configura tu ubicación en el perfil para ver tiendas cercanas
            </Text>
          </View>
        ) : null}

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
  shop: ShopWithDistance;
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
        <Text style={styles.distanceText}>
          {shop.distance !== undefined ? `${shop.distance}km` : 'N/A'}
        </Text>
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
  map: {
    width: '100%',
    height: '100%',
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
  noLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
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

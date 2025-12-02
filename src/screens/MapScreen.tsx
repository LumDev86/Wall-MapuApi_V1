import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Alert,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { shopService } from '../services/api';
import { Shop } from '../types/product.types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Importación condicional de react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  // react-native-maps no está disponible (Expo Go)
  console.log('react-native-maps no disponible - usando placeholder');
}

interface ShopWithDistance extends Shop {
  distance?: number;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const MapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<ShopWithDistance | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const mapRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchShops();
    requestLocationPermission();
  }, []);

  // Función para solicitar permisos y obtener ubicación del dispositivo
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setDeviceLocation(location);
        return location;
      } else {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para mostrar tiendas cercanas');
        return null;
      }
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

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
      const response = await shopService.getAll({
        page: 1,
        limit: 100,
        status: 'active' // Solo tiendas con suscripción activa
      });

      // Calcular distancias y ordenar por proximidad si tenemos ubicación de referencia
      const refLat = deviceLocation?.coords.latitude || user?.latitude;
      const refLon = deviceLocation?.coords.longitude || user?.longitude;

      const shopsWithDistance = response.data.map((shop: Shop) => {
        if (shop.latitude && shop.longitude && refLat && refLon) {
          const distance = calculateDistance(
            refLat,
            refLon,
            parseFloat(shop.latitude),
            parseFloat(shop.longitude)
          );
          return { ...shop, distance };
        }
        return { ...shop, distance: undefined };
      });

      // Ordenar solo si tenemos distancias
      if (refLat && refLon) {
        shopsWithDistance.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }

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

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${apiKey}&language=es&components=country:ar`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setSearchResults(data.predictions);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error en búsqueda de lugares:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePlaceSelect = async (placeId: string, description: string) => {
    setLocationSearchQuery(description);
    setShowSearchResults(false);
    setSearchResults([]);
    Keyboard.dismiss();

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=es`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;

        // Animar el mapa a la nueva ubicación
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        if (mapRef.current && MapView) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        Alert.alert('Error', 'No se pudo obtener la ubicación del lugar seleccionado');
      }
    } catch (error) {
      console.error('Error al obtener detalles del lugar:', error);
      Alert.alert('Error', 'Error al obtener la ubicación');
    }
  };

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (locationSearchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(locationSearchQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationSearchQuery]);

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
          {getTotalItems() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Buscador de ubicaciones */}
      <View style={styles.locationSearchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ubicación..."
            placeholderTextColor="#999"
            value={locationSearchQuery}
            onChangeText={setLocationSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchLoading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.searchLoader} />
          )}
          {locationSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setLocationSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de sugerencias */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handlePlaceSelect(item.place_id, item.description)}
                >
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionMainText}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.suggestionSecondaryText}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        {MapView ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: deviceLocation?.coords.latitude || user?.latitude || -32.4827, // Concepción del Uruguay por defecto
              longitude: deviceLocation?.coords.longitude || user?.longitude || -58.2363,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
          >
            {/* Marcador del usuario (solo si tiene coordenadas) */}
            {(deviceLocation || (user?.latitude && user?.longitude)) && (
              <Marker
                coordinate={{
                  latitude: deviceLocation?.coords.latitude || user?.latitude || -32.4827,
                  longitude: deviceLocation?.coords.longitude || user?.longitude || -58.2363,
                }}
                title="Tu ubicación"
                description={user?.city && user?.province ? `${user.city}, ${user.province}` : 'Mi ubicación'}
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
                    latitude: parseFloat(shop.latitude),
                    longitude: parseFloat(shop.longitude),
                  }}
                  title={shop.name}
                  description={`${shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}${shop.distance ? ` - ${shop.distance}km` : ''}`}
                  pinColor={isSelected ? '#FF6B35' : COLORS.primary}
                  onPress={() => setSelectedShop(shop)}
                />
              );
            })}
          </MapView>
        ) : (
          /* Placeholder para Expo Go */
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#999" />
            <Text style={styles.placeholderTitle}>Mapa no disponible en Expo Go</Text>
            <Text style={styles.placeholderText}>
              Para ver el mapa, ejecuta:{'\n'}
              <Text style={styles.placeholderCode}>npx expo run:android</Text>
            </Text>
            <Text style={styles.placeholderHint}>
              Ver guía: QUICK_START_MAP.md
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Tiendas Cerca de vos</Text>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {shops.length === 0 && !loading ? (
          <View style={styles.noLocationContainer}>
            <Ionicons name="location-outline" size={48} color="#999" />
            <Text style={styles.noLocationText}>
              No hay tiendas disponibles en este momento
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
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  locationSearchWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchLoader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#666',
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  placeholderCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  placeholderHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
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

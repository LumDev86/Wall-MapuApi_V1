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
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.5;
const BOTTOM_SHEET_MIN_HEIGHT = 90;
const BOTTOM_SHEET_MID_HEIGHT = 200;
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

interface UnifiedSearchResults {
  shops: ShopWithDistance[];
  places: PlacePrediction[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSearchResults>({ shops: [], places: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const mapRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Bottom Sheet Animation
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MID_HEIGHT)).current;
  const lastGestureDy = useRef(0);
  const [sheetPosition, setSheetPosition] = useState<'min' | 'mid' | 'max'>('mid');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // @ts-ignore
        bottomSheetHeight.setOffset(bottomSheetHeight._value);
        bottomSheetHeight.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Invertimos el valor porque arrastramos hacia arriba para expandir
        const newValue = -gestureState.dy;
        bottomSheetHeight.setValue(newValue);
        lastGestureDy.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        bottomSheetHeight.flattenOffset();

        // @ts-ignore
        const currentHeight = bottomSheetHeight._value;
        const velocity = gestureState.vy;

        let targetHeight = BOTTOM_SHEET_MID_HEIGHT;
        let newPosition: 'min' | 'mid' | 'max' = 'mid';

        // Determinar el destino basado en velocidad y posición
        if (velocity > 0.5) {
          // Deslizando hacia abajo rápido
          if (currentHeight > BOTTOM_SHEET_MID_HEIGHT) {
            targetHeight = BOTTOM_SHEET_MID_HEIGHT;
            newPosition = 'mid';
          } else {
            targetHeight = BOTTOM_SHEET_MIN_HEIGHT;
            newPosition = 'min';
          }
        } else if (velocity < -0.5) {
          // Deslizando hacia arriba rápido
          if (currentHeight < BOTTOM_SHEET_MID_HEIGHT) {
            targetHeight = BOTTOM_SHEET_MID_HEIGHT;
            newPosition = 'mid';
          } else {
            targetHeight = BOTTOM_SHEET_MAX_HEIGHT;
            newPosition = 'max';
          }
        } else {
          // Basado en posición
          if (currentHeight < (BOTTOM_SHEET_MIN_HEIGHT + BOTTOM_SHEET_MID_HEIGHT) / 2) {
            targetHeight = BOTTOM_SHEET_MIN_HEIGHT;
            newPosition = 'min';
          } else if (currentHeight < (BOTTOM_SHEET_MID_HEIGHT + BOTTOM_SHEET_MAX_HEIGHT) / 2) {
            targetHeight = BOTTOM_SHEET_MID_HEIGHT;
            newPosition = 'mid';
          } else {
            targetHeight = BOTTOM_SHEET_MAX_HEIGHT;
            newPosition = 'max';
          }
        }

        Animated.spring(bottomSheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          bounciness: 4,
        }).start();

        setSheetPosition(newPosition);
      },
    })
  ).current;

  const toggleBottomSheet = () => {
    let targetHeight: number;
    let newPosition: 'min' | 'mid' | 'max';

    if (sheetPosition === 'min') {
      targetHeight = BOTTOM_SHEET_MID_HEIGHT;
      newPosition = 'mid';
    } else if (sheetPosition === 'mid') {
      targetHeight = BOTTOM_SHEET_MAX_HEIGHT;
      newPosition = 'max';
    } else {
      targetHeight = BOTTOM_SHEET_MIN_HEIGHT;
      newPosition = 'min';
    }

    Animated.spring(bottomSheetHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      bounciness: 4,
    }).start();

    setSheetPosition(newPosition);
  };

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

  // Búsqueda unificada: tiendas + ubicaciones
  const performUnifiedSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults({ shops: [], places: [] });
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);

    try {
      // Buscar tiendas localmente (filtrar del array de shops)
      const queryLower = query.toLowerCase().trim();
      const matchingShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(queryLower) ||
        shop.address?.toLowerCase().includes(queryLower) ||
        shop.city?.toLowerCase().includes(queryLower)
      ).slice(0, 5); // Máximo 5 tiendas

      // Buscar ubicaciones con Google Places (en paralelo)
      let matchingPlaces: PlacePrediction[] = [];
      try {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
              query
            )}&key=${apiKey}&language=es&components=country:ar`
          );
          const data = await response.json();
          if (data.status === 'OK' && data.predictions) {
            matchingPlaces = data.predictions.slice(0, 3); // Máximo 3 ubicaciones
          }
        }
      } catch (placeError) {
        console.log('Error buscando lugares:', placeError);
      }

      setSearchResults({
        shops: matchingShops,
        places: matchingPlaces,
      });
      setShowSearchResults(matchingShops.length > 0 || matchingPlaces.length > 0);
    } catch (error) {
      console.error('Error en búsqueda unificada:', error);
      setSearchResults({ shops: [], places: [] });
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Seleccionar tienda de los resultados
  const handleShopSelect = (shop: ShopWithDistance) => {
    setSearchQuery(shop.name);
    setShowSearchResults(false);
    setSearchResults({ shops: [], places: [] });
    Keyboard.dismiss();
    centerOnShop(shop);
  };

  // Seleccionar ubicación de los resultados
  const handlePlaceSelect = async (placeId: string, description: string) => {
    setSearchQuery(description);
    setShowSearchResults(false);
    setSearchResults({ shops: [], places: [] });
    Keyboard.dismiss();

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=es`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;

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

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performUnifiedSearch(searchQuery);
      }, 300); // 300ms debounce para búsqueda más rápida
    } else {
      setSearchResults({ shops: [], places: [] });
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, shops]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Centrar mapa en tienda seleccionada
  const centerOnShop = (shop: ShopWithDistance) => {
    setSelectedShop(shop);
    if (mapRef.current && shop.latitude && shop.longitude) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(shop.latitude),
        longitude: parseFloat(shop.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mapa a pantalla completa */}
      <View style={styles.fullMapContainer}>
        {MapView ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.fullMap}
            initialRegion={{
              latitude: deviceLocation?.coords.latitude || user?.latitude || -32.4827,
              longitude: deviceLocation?.coords.longitude || user?.longitude || -58.2363,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
          >
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
                  onPress={() => centerOnShop(shop)}
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

        {/* Header flotante sobre el mapa */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity style={styles.locationButton}>
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.locationText} numberOfLines={1}>
              {user?.city && user?.province
                ? `${user.city}, ${user.province}`
                : user?.city || user?.province || 'Ubicación'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Buscador flotante */}
        <View style={styles.floatingSearchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar tiendas o ubicaciones..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchLoading && (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.searchLoader} />
            )}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults({ shops: [], places: [] });
                  setShowSearchResults(false);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Resultados de búsqueda unificada */}
          {showSearchResults && (
            <ScrollView
              style={styles.suggestionsContainer}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* Sección: Tiendas */}
              {searchResults.shops.length > 0 && (
                <View>
                  <View style={styles.searchSectionHeader}>
                    <Ionicons name="storefront" size={16} color={COLORS.primary} />
                    <Text style={styles.searchSectionTitle}>TIENDAS</Text>
                  </View>
                  {searchResults.shops.map((shop) => (
                    <TouchableOpacity
                      key={shop.id}
                      style={styles.suggestionItem}
                      onPress={() => handleShopSelect(shop)}
                    >
                      <View style={styles.shopSearchIcon}>
                        <Ionicons name="storefront" size={18} color="#fff" />
                      </View>
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionMainText}>{shop.name}</Text>
                        <Text style={styles.suggestionSecondaryText}>
                          {shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
                          {shop.distance !== undefined ? ` · ${shop.distance} km` : ''}
                          {shop.city ? ` · ${shop.city}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Sección: Ubicaciones */}
              {searchResults.places.length > 0 && (
                <View>
                  <View style={styles.searchSectionHeader}>
                    <Ionicons name="location" size={16} color="#FF6B35" />
                    <Text style={styles.searchSectionTitle}>UBICACIONES</Text>
                  </View>
                  {searchResults.places.map((place) => (
                    <TouchableOpacity
                      key={place.place_id}
                      style={styles.suggestionItem}
                      onPress={() => handlePlaceSelect(place.place_id, place.description)}
                    >
                      <View style={styles.placeSearchIcon}>
                        <Ionicons name="location" size={18} color="#fff" />
                      </View>
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionMainText}>
                          {place.structured_formatting.main_text}
                        </Text>
                        <Text style={styles.suggestionSecondaryText}>
                          {place.structured_formatting.secondary_text}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Sin resultados */}
              {searchResults.shops.length === 0 && searchResults.places.length === 0 && searchQuery.length >= 2 && !searchLoading && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={32} color="#ccc" />
                  <Text style={styles.noResultsText}>No se encontraron resultados</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Botón Mi ubicación */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={async () => {
            const location = await requestLocationPermission();
            if (location && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }
          }}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Deslizable */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { height: bottomSheetHeight }
        ]}
      >
        {/* Handle para arrastrar */}
        <View {...panResponder.panHandlers} style={styles.sheetHandleContainer}>
          <View style={styles.sheetHandle} />
        </View>

        <TouchableOpacity
          style={styles.sheetHeader}
          onPress={toggleBottomSheet}
          activeOpacity={0.7}
        >
          <View style={styles.sheetTitleContainer}>
            <Text style={styles.sheetTitle}>Tiendas Cerca de vos</Text>
            <Text style={styles.sheetSubtitle}>{shops.length} tiendas encontradas</Text>
          </View>
          <Ionicons
            name={sheetPosition === 'max' ? 'chevron-down' : 'chevron-up'}
            size={24}
            color={COLORS.gray}
          />
        </TouchableOpacity>

        {shops.length === 0 && !loading ? (
          <View style={styles.noLocationContainer}>
            <Ionicons name="storefront-outline" size={48} color="#999" />
            <Text style={styles.noLocationText}>
              No hay tiendas disponibles en este momento
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.shopsListVertical}
            scrollEnabled={sheetPosition !== 'min'}
          >
            {shops.map((shop) => (
              <ShopCardVertical
                key={shop.id}
                shop={shop}
                isSelected={selectedShop?.id === shop.id}
                onPress={() => centerOnShop(shop)}
                onNavigate={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
              />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

interface ShopCardVerticalProps {
  shop: ShopWithDistance;
  isSelected: boolean;
  onPress: () => void;
  onNavigate: () => void;
}

const ShopCardVertical: React.FC<ShopCardVerticalProps> = ({ shop, isSelected, onPress, onNavigate }) => {
  return (
    <TouchableOpacity
      style={[styles.shopCardVertical, isSelected && styles.shopCardVerticalSelected]}
      onPress={onPress}
      onLongPress={onNavigate}
    >
      <View style={styles.shopLogoContainerVertical}>
        {shop.logo ? (
          <Image source={{ uri: shop.logo }} style={styles.shopLogoVertical} resizeMode="cover" />
        ) : (
          <View style={styles.shopLogoPlaceholder}>
            <Ionicons name="storefront" size={24} color={COLORS.primary} />
          </View>
        )}
      </View>
      <View style={styles.shopInfoVertical}>
        <Text style={styles.shopNameVertical} numberOfLines={1}>
          {shop.name}
        </Text>
        <Text style={styles.shopTypeVertical} numberOfLines={1}>
          {shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
        </Text>
        <View style={styles.shopMetaRow}>
          <View style={styles.distanceBadge}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.distanceTextVertical}>
              {shop.distance !== undefined ? `${shop.distance} km` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
        <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
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
  // Mapa a pantalla completa
  fullMapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  // Header flotante
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    maxWidth: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cartButton: {
    position: 'relative',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Buscador flotante
  floatingSearchWrapper: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
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
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shopSearchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeSearchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    color: '#888',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  // Botón mi ubicación
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  // Mapa placeholder
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
  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitleContainer: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  noLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  // Lista vertical de tiendas
  shopsListVertical: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  // ShopCard Vertical
  shopCardVertical: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  shopCardVerticalSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9F6',
  },
  shopLogoContainerVertical: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  shopLogoVertical: {
    width: 56,
    height: 56,
  },
  shopLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E8F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfoVertical: {
    flex: 1,
    marginRight: 8,
  },
  shopNameVertical: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  shopTypeVertical: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceTextVertical: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  navigateButton: {
    padding: 8,
  },
});

export default MapScreen;

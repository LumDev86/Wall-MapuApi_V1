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
import Svg, { Path, G, Rect, ClipPath, Defs } from 'react-native-svg';

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

// Componentes de marcadores personalizados con SVG
// Tamaños configurables
const SHOP_MARKER_SIZE = { width: 32, height: 42 }; // Tamaño del pin de tienda
const SHOP_MARKER_SELECTED_SIZE = { width: 38, height: 50 }; // Tamaño cuando está seleccionado
const USER_MARKER_SIZE = { width: 36, height: 48 }; // Tamaño del pin de usuario

const ShopMarkerSvg: React.FC<{ isSelected?: boolean }> = ({ isSelected = false }) => (
  <View style={markerStyles.container}>
    <Svg
      width={isSelected ? SHOP_MARKER_SELECTED_SIZE.width : SHOP_MARKER_SIZE.width}
      height={isSelected ? SHOP_MARKER_SELECTED_SIZE.height : SHOP_MARKER_SIZE.height}
      viewBox="0 0 38 51"
      fill="none"
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.4146 0.159586C7.87172 1.31885 1.2444 7.99188 0.145083 16.5413C-0.222697 19.402 0.10459 22.2361 1.17451 25.4557C3.29874 31.8473 8.21532 39.3226 15.4283 47.1274C16.2277 47.9923 17.2565 49.0649 17.7147 49.5108C18.8326 50.5989 18.9006 50.5989 20.0185 49.5108C21.7606 47.8152 24.8546 44.3662 26.803 41.9479C33.9578 33.0675 37.7248 25.1088 37.7353 18.851C37.7445 13.3427 35.2564 8.01625 31.0047 4.44253C26.9589 1.04179 21.5702 -0.540102 16.4146 0.159586Z"
        fill={isSelected ? '#E86A33' : '#015A41'}
      />
      <Path
        d="M29.7762 18.9689C29.7762 24.9941 24.8918 29.8785 18.8666 29.8785C12.8414 29.8785 7.95703 24.9941 7.95703 18.9689C7.95703 12.9437 12.8414 8.0593 18.8666 8.0593C24.8918 8.0593 29.7762 12.9437 29.7762 18.9689Z"
        fill={isSelected ? '#E86A33' : '#015A41'}
      />
    </Svg>
    <View style={[
      markerStyles.shopIconOverlay,
      isSelected && markerStyles.shopIconOverlaySelected
    ]}>
      <Svg width="14" height="14" viewBox="0 0 17 17" fill="none">
        <G clipPath="url(#clip0_shop)">
          <Path
            d="M16.9049 7.04384C16.9049 6.99242 16.8993 6.94116 16.888 6.89099L15.9723 2.75774C15.8022 1.97323 15.3675 1.27108 14.7412 0.769C14.1148 0.266923 13.3349 -0.00454301 12.5322 0.000120124H4.37271C3.57047 -0.00389501 2.79121 0.267867 2.16544 0.76989C1.53968 1.27191 1.10541 1.97371 0.935377 2.75774L0.0168754 6.89099C0.00561113 6.94116 -5.84529e-05 6.99242 -2.9553e-05 7.04384V7.74821C-0.000597846 8.43399 0.249967 9.09623 0.704343 9.60987V13.3832C0.705461 14.3169 1.07687 15.2121 1.73711 15.8723C2.39734 16.5325 3.29249 16.9039 4.2262 16.9051H12.6787C13.6124 16.9039 14.5075 16.5325 15.1678 15.8723C15.828 15.2121 16.1994 14.3169 16.2005 13.3832V9.60987C16.6549 9.09623 16.9055 8.43399 16.9049 7.74821V7.04384ZM1.40871 7.12062L2.31031 3.06343C2.41248 2.59309 2.67307 2.1721 3.0485 1.87092C3.42393 1.56973 3.89141 1.40661 4.37271 1.40886H4.93058V3.52198C4.93058 3.70879 5.00479 3.88795 5.13688 4.02005C5.26898 4.15214 5.44814 4.22635 5.63495 4.22635C5.82176 4.22635 6.00092 4.15214 6.13301 4.02005C6.26511 3.88795 6.33932 3.70879 6.33932 3.52198V1.40886H10.5656V3.52198C10.5656 3.70879 10.6398 3.88795 10.7719 4.02005C10.904 4.15214 11.0831 4.22635 11.2699 4.22635C11.4567 4.22635 11.6359 4.15214 11.768 4.02005C11.9001 3.88795 11.9743 3.70879 11.9743 3.52198V1.40886H12.5322C13.0135 1.40661 13.4809 1.56973 13.8564 1.87092C14.2318 2.1721 14.4924 2.59309 14.5946 3.06343L15.4962 7.12062V7.74821C15.4962 8.12184 15.3477 8.48016 15.0835 8.74435C14.8194 9.00854 14.461 9.15696 14.0874 9.15696H13.383C13.0094 9.15696 12.6511 9.00854 12.3869 8.74435C12.1227 8.48016 11.9743 8.12184 11.9743 7.74821C11.9743 7.5614 11.9001 7.38224 11.768 7.25015C11.6359 7.11805 11.4567 7.04384 11.2699 7.04384C11.0831 7.04384 10.904 7.11805 10.7719 7.25015C10.6398 7.38224 10.5656 7.5614 10.5656 7.74821C10.5656 8.12184 10.4171 8.48016 10.1529 8.74435C9.88875 9.00854 9.53043 9.15696 9.15681 9.15696H7.74806C7.37444 9.15696 7.01612 9.00854 6.75193 8.74435C6.48774 8.48016 6.33932 8.12184 6.33932 7.74821C6.33932 7.5614 6.26511 7.38224 6.13301 7.25015C6.00092 7.11805 5.82176 7.04384 5.63495 7.04384C5.44814 7.04384 5.26898 7.11805 5.13688 7.25015C5.00479 7.38224 4.93058 7.5614 4.93058 7.74821C4.93058 8.12184 4.78216 8.48016 4.51796 8.74435C4.25377 9.00854 3.89545 9.15696 3.52183 9.15696H2.81746C2.44384 9.15696 2.08552 9.00854 1.82133 8.74435C1.55714 8.48016 1.40871 8.12184 1.40871 7.74821V7.12062ZM12.6787 15.4963H4.2262C3.66577 15.4963 3.12829 15.2737 2.732 14.8774C2.33572 14.4811 2.11309 13.9436 2.11309 13.3832V10.4762C2.34313 10.5358 2.57983 10.5659 2.81746 10.5657H3.52183C3.92178 10.5659 4.31718 10.4808 4.68158 10.3159C5.04599 10.1511 5.37102 9.91038 5.63495 9.60987C5.89888 9.91038 6.22391 10.1511 6.58831 10.3159C6.95272 10.4808 7.34811 10.5659 7.74806 10.5657H9.15681C9.55676 10.5659 9.95215 10.4808 10.3166 10.3159C10.681 10.1511 11.006 9.91038 11.2699 9.60987C11.5339 9.91038 11.8589 10.1511 12.2233 10.3159C12.5877 10.4808 12.9831 10.5659 13.383 10.5657H14.0874C14.325 10.5659 14.5617 10.5358 14.7918 10.4762V13.3832C14.7918 13.9436 14.5692 14.4811 14.1729 14.8774C13.7766 15.2737 13.2391 15.4963 12.6787 15.4963Z"
            fill="white"
          />
        </G>
        <Defs>
          <ClipPath id="clip0_shop">
            <Rect width="16.9049" height="16.9049" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    </View>
  </View>
);

const UserLocationMarkerSvg: React.FC = () => (
  <View style={markerStyles.container}>
    <Svg width={USER_MARKER_SIZE.width} height={USER_MARKER_SIZE.height} viewBox="0 0 46 61" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.8136 0.192714C9.50172 1.59203 1.50207 9.64684 0.175126 19.9667C-0.268811 23.4197 0.126248 26.8407 1.41772 30.7269C3.98181 38.442 9.91647 47.4653 18.6231 56.8862C19.5879 57.9302 20.8298 59.2248 21.3829 59.7631C22.7323 61.0765 22.8144 61.0765 24.1637 59.7631C26.2666 57.7164 30.0012 53.5532 32.3531 50.6341C40.9895 39.9149 45.5366 30.3082 45.5491 22.7546C45.5603 16.1056 42.557 9.67626 37.4249 5.36253C32.5412 1.25759 26.0368 -0.651858 19.8136 0.192714Z"
        fill="#E86A33"
      />
      <Path
        d="M35.942 22.8969C35.942 30.1697 30.0462 36.0655 22.7733 36.0655C15.5005 36.0655 9.6047 30.1697 9.6047 22.8969C9.6047 15.624 15.5005 9.72823 22.7733 9.72823C30.0462 9.72823 35.942 15.624 35.942 22.8969Z"
        fill="#E86A33"
      />
    </Svg>
    <View style={markerStyles.userIconOverlay}>
      <Svg width="16" height="16" viewBox="0 0 21 21" fill="none">
        <G clipPath="url(#clip0_user)">
          <Path
            d="M10.39 10.39C11.4175 10.39 12.4219 10.0853 13.2762 9.51447C14.1305 8.94363 14.7964 8.13228 15.1896 7.18301C15.5828 6.23375 15.6857 5.1892 15.4852 4.18147C15.2848 3.17373 14.79 2.24806 14.0635 1.52153C13.3369 0.794991 12.4113 0.300213 11.4035 0.0997622C10.3958 -0.100689 9.35125 0.0021899 8.40198 0.395389C7.45271 0.788588 6.64136 1.45445 6.07053 2.30876C5.49969 3.16308 5.19501 4.16749 5.19501 5.19496C5.19638 6.57235 5.74416 7.89292 6.71811 8.86688C7.69207 9.84084 9.01265 10.3886 10.39 10.39ZM10.39 1.73162C11.075 1.73162 11.7446 1.93474 12.3142 2.31529C12.8837 2.69585 13.3276 3.23675 13.5897 3.8696C13.8519 4.50244 13.9205 5.19881 13.7868 5.87063C13.6532 6.54245 13.3233 7.15956 12.839 7.64392C12.3546 8.12828 11.7375 8.45813 11.0657 8.59176C10.3939 8.7254 9.69751 8.65681 9.06466 8.39468C8.43182 8.13255 7.89092 7.68864 7.51036 7.1191C7.1298 6.54955 6.92668 5.87995 6.92668 5.19496C6.92668 4.27643 7.29157 3.39551 7.94107 2.74601C8.59058 2.0965 9.47149 1.73162 10.39 1.73162Z"
            fill="white"
          />
          <Path
            d="M10.39 12.1223C8.32403 12.1245 6.3433 12.9463 4.88241 14.4072C3.42153 15.8681 2.5998 17.8488 2.5975 19.9148C2.5975 20.1444 2.68873 20.3646 2.8511 20.527C3.01348 20.6894 3.23371 20.7806 3.46334 20.7806C3.69297 20.7806 3.9132 20.6894 4.07558 20.527C4.23796 20.3646 4.32918 20.1444 4.32918 19.9148C4.32918 18.3073 4.96773 16.7657 6.10436 15.6291C7.24099 14.4925 8.7826 13.8539 10.39 13.8539C11.9975 13.8539 13.5391 14.4925 14.6757 15.6291C15.8123 16.7657 16.4509 18.3073 16.4509 19.9148C16.4509 20.1444 16.5421 20.3646 16.7045 20.527C16.8669 20.6894 17.0871 20.7806 17.3167 20.7806C17.5464 20.7806 17.7666 20.6894 17.929 20.527C18.0913 20.3646 18.1826 20.1444 18.1826 19.9148C18.1803 17.8488 17.3585 15.8681 15.8977 14.4072C14.4368 12.9463 12.456 12.1245 10.39 12.1223Z"
            fill="white"
          />
        </G>
        <Defs>
          <ClipPath id="clip0_user">
            <Rect width="20.7801" height="20.7801" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    </View>
  </View>
);

const markerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shopIconOverlay: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 14,
    height: 14,
  },
  shopIconOverlaySelected: {
    top: 11,
    left: 12,
  },
  userIconOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 16,
    height: 16,
  },
});

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
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
          >
            {/* Marcador de ubicación del usuario */}
            {deviceLocation && (
              <Marker
                coordinate={{
                  latitude: deviceLocation.coords.latitude,
                  longitude: deviceLocation.coords.longitude,
                }}
                title="Tu ubicación"
                anchor={{ x: 0.5, y: 1 }}
              >
                <UserLocationMarkerSvg />
              </Marker>
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
                  onPress={() => centerOnShop(shop)}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <ShopMarkerSvg isSelected={isSelected} />
                </Marker>
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

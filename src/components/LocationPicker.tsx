import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  console.log('react-native-maps no disponible');
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationSelected: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelected,
  initialLocation,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null);

  const mapRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Búsqueda de lugares con Google Places Autocomplete
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        Alert.alert('Error', 'No se ha configurado la API key de Google Maps');
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${apiKey}&language=es&components=country:ar`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setSearchResults(data.predictions);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error buscando lugares:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 400);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Seleccionar un lugar de los resultados
  const handlePlaceSelect = async (placeId: string, description: string) => {
    setSearchQuery(description);
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
        const newLocation = {
          address: description,
          latitude: lat,
          longitude: lng,
        };

        setMarkerPosition({ latitude: lat, longitude: lng });
        setSelectedLocation(newLocation);

        // Animar el mapa a la ubicación seleccionada
        if (mapRef.current && MapView) {
          mapRef.current.animateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000
          );
        }
      } else {
        Alert.alert('Error', 'No se pudo obtener la ubicación del lugar seleccionado');
      }
    } catch (error) {
      console.error('Error al obtener detalles del lugar:', error);
      Alert.alert('Error', 'Error al obtener la ubicación');
    }
  };

  // Obtener ubicación actual del dispositivo
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding para obtener la dirección
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addressResponse[0];
      const formattedAddress = `${address.street || ''} ${address.streetNumber || ''}, ${
        address.city || ''
      }, ${address.region || ''}`.trim();

      const newLocation = {
        address: formattedAddress,
        latitude,
        longitude,
      };

      setMarkerPosition({ latitude, longitude });
      setSelectedLocation(newLocation);
      setSearchQuery(formattedAddress);

      // Animar el mapa a la ubicación actual
      if (mapRef.current && MapView) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    }
  };

  // Manejar el arrastre del marcador en el mapa
  const handleMarkerDragEnd = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });

    try {
      // Reverse geocoding para obtener la dirección
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addressResponse[0];

      // Construir dirección formateada
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.city) parts.push(address.city);
      if (address.region) parts.push(address.region);
      if (address.country) parts.push(address.country);

      const formattedAddress = parts.join(', ');

      const newLocation = {
        address: formattedAddress,
        latitude,
        longitude,
      };

      setSelectedLocation(newLocation);
      setSearchQuery(formattedAddress);
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
    }
  };

  // Confirmar la ubicación seleccionada
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation);
      setModalVisible(false);
    } else {
      Alert.alert('Error', 'Por favor selecciona una ubicación en el mapa');
    }
  };

  // Abrir el modal
  const openModal = () => {
    if (!MapView) {
      Alert.alert(
        'Mapa no disponible',
        'Para usar el selector de ubicación con mapa, ejecuta la app con:\n\nnpx expo run:android\no\nnpx expo run:ios',
        [{ text: 'OK' }]
      );
      return;
    }
    setModalVisible(true);
  };

  return (
    <View>
      {/* Campo de entrada que abre el modal */}
      <TouchableOpacity style={styles.inputButton} onPress={openModal}>
        <View style={styles.inputButtonContent}>
          <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
          <View style={styles.inputTextContainer}>
            {selectedLocation ? (
              <>
                <Text style={styles.inputText} numberOfLines={1}>
                  {selectedLocation.address}
                </Text>
                <Text style={styles.inputSubtext}>
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.inputPlaceholder}>Seleccionar ubicación en el mapa</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* Modal con mapa */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Ubicación</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Buscador */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar dirección o lugar..."
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
                    setSearchResults([]);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Botón de ubicación actual */}
            <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
              <Ionicons name="navigate" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <ScrollView style={styles.searchResultsContainer} keyboardShouldPersistTaps="handled">
              {searchResults.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={styles.searchResultItem}
                  onPress={() => handlePlaceSelect(place.place_id, place.description)}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <View style={styles.searchResultTextContainer}>
                    <Text style={styles.searchResultMainText}>
                      {place.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.searchResultSecondaryText}>
                      {place.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Mapa */}
          <View style={styles.mapContainer}>
            {MapView ? (
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: markerPosition?.latitude || -32.4827,
                  longitude: markerPosition?.longitude || -58.2363,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                {markerPosition && (
                  <Marker
                    coordinate={markerPosition}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                    title="Tu tienda"
                    description="Arrastra el marcador para ajustar la ubicación"
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={64} color="#999" />
                <Text style={styles.placeholderText}>Mapa no disponible</Text>
              </View>
            )}

            {/* Instrucciones */}
            <View style={styles.instructionsContainer}>
              <Ionicons name="information-circle" size={18} color={COLORS.primary} />
              <Text style={styles.instructionsText}>
                Busca o arrastra el marcador para seleccionar la ubicación exacta
              </Text>
            </View>
          </View>

          {/* Botón de confirmación */}
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!selectedLocation}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputButton: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  inputButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  inputSubtext: {
    fontSize: 12,
    color: '#888',
  },
  inputPlaceholder: {
    fontSize: 16,
    color: COLORS.placeholder,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  // Buscador
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
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
    marginLeft: 4,
  },
  currentLocationButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  // Resultados de búsqueda
  searchResultsContainer: {
    maxHeight: 250,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  searchResultSecondaryText: {
    fontSize: 13,
    color: '#888',
  },
  // Mapa
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5F0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  // Botón de confirmación
  confirmButtonContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default LocationPicker;

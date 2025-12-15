import React, { useState, useRef, useEffect } from 'react';
import { AuthStackNavigationProp } from '../../types/navigation.types';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { UserRole } from '../../types/auth.types';

interface RegisterScreenProps {
  navigation: AuthStackNavigationProp<any>;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  // Datos básicos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('client');

  // Ubicación (para tiendas)
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(-34.6037); // Buenos Aires por defecto
  const [longitude, setLongitude] = useState(-58.3816);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: -34.6037,
    longitude: -58.3816,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Términos y condiciones
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { register } = useAuth();

  const validateForm = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    if (!acceptedTerms) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones para continuar');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    // Para tiendas, la ubicación es obligatoria
    if (role !== 'client' && !address) {
      Alert.alert('Error', 'Por favor selecciona la ubicación de tu tienda');
      return false;
    }

    return true;
  };

  const getErrorMessage = (error: any): string => {
    const message = error.response?.data?.message;

    // Si el mensaje es un array, unirlo en un string
    if (Array.isArray(message)) {
      return message.join('\n');
    }

    // Si es un string, devolverlo directamente
    if (typeof message === 'string') {
      return message;
    }

    // Mensaje por defecto
    return 'Error al registrarse. Por favor intenta nuevamente.';
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingLocation(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let newProvince = '';
        let newCity = '';
        let newAddress = result.formatted_address;

        // Extraer componentes de dirección
        addressComponents.forEach((component: any) => {
          if (component.types.includes('administrative_area_level_1')) {
            newProvince = component.long_name;
          }
          if (component.types.includes('locality')) {
            newCity = component.long_name;
          } else if (component.types.includes('administrative_area_level_2') && !newCity) {
            newCity = component.long_name;
          }
        });

        setProvince(newProvince);
        setCity(newCity);
        setAddress(newAddress);
        setLatitude(lat);
        setLongitude(lng);
      } else {
        Alert.alert('Error', 'No se pudo obtener la dirección de esta ubicación');
      }
    } catch (error) {
      console.error('Error en reverse geocoding:', error);
      Alert.alert('Error', 'Error al obtener la dirección');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude);
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
    setSearchQuery(description);
    setShowSearchResults(false);
    setSearchResults([]);
    Keyboard.dismiss();
    setLoadingLocation(true);

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

        mapRef.current?.animateToRegion(newRegion, 1000);

        // Actualizar marcador y ubicación
        setSelectedLocation({ latitude: lat, longitude: lng });

        // Obtener dirección completa con reverse geocoding
        await reverseGeocode(lat, lng);
      } else {
        Alert.alert('Error', 'No se pudo obtener la ubicación del lugar seleccionado');
        setLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error al obtener detalles del lugar:', error);
      Alert.alert('Error', 'Error al obtener la ubicación');
      setLoadingLocation(false);
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
  }, [searchQuery]);

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Datos base de registro
      const registrationData: any = {
        name,
        email,
        phone,
        password,
        role,
      };

      // Datos para tiendas (ubicación)
      // NOTA: El backend NO acepta latitude/longitude en el registro
      // Las coordenadas se obtienen automáticamente en el backend mediante geocoding
      if (role !== 'client') {
        registrationData.province = province || undefined;
        registrationData.city = city || undefined;
        registrationData.address = address || undefined;
      }

      const result = await register(registrationData);

      // Para tiendas, mostrar mensaje de éxito
      // Para clientes, la navegación a CompleteProfile es automática via AuthContext
      if (!result.needsCompletion) {
        Alert.alert('Éxito', 'Cuenta creada exitosamente');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'client', label: 'Cliente' },
    { value: 'retailer', label: 'Minorista' },
    { value: 'wholesaler', label: 'Mayorista' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/wallmapu-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete a nuestra comunidad de amantes de mascotas</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre completo</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              placeholderTextColor={COLORS.placeholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="+5491112345678"
              placeholderTextColor={COLORS.placeholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Tipo de cuenta */}
          <Text style={styles.label}>Tipo de cuenta</Text>
          <View style={styles.roleContainer}>
            {roleOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.roleButton,
                  role === option.value && styles.roleButtonActive,
                ]}
                onPress={() => setRole(option.value)}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === option.value && styles.roleButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SECCIÓN DE UBICACIÓN - Solo para tiendas */}
          {role !== 'client' && (
            <>
              <Text style={styles.label}>Ubicación de tu tienda</Text>
              <Text style={styles.mapInstruction}>
                Busca tu dirección o toca el mapa para seleccionar la ubicación
              </Text>

              {/* Buscador de direcciones */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar dirección..."
                  placeholderTextColor={COLORS.placeholder}
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

              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  onPress={handleMapPress}
                >
                  <Marker
                    coordinate={selectedLocation}
                    draggable
                    onDragEnd={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setSelectedLocation({ latitude, longitude });
                      reverseGeocode(latitude, longitude);
                    }}
                  />
                </MapView>
                {loadingLocation && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Obteniendo dirección...</Text>
                  </View>
                )}
              </View>

              {address && (
                <View style={styles.addressInfo}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressLabel}>Dirección seleccionada:</Text>
                    <Text style={styles.addressText}>{address}</Text>
                    {city && <Text style={styles.addressDetail}>Ciudad: {city}</Text>}
                    {province && <Text style={styles.addressDetail}>Provincia: {province}</Text>}
                  </View>
                </View>
              )}

              {/* Nota sobre email para tiendas */}
              <View style={styles.infoNote}>
                <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                <Text style={styles.infoNoteText}>
                  El email ingresado será utilizado para enviarte información sobre tu suscripción, novedades y promociones.
                </Text>
              </View>
            </>
          )}

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={COLORS.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor={COLORS.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Checkbox de Términos y Condiciones */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              Acepto los{' '}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate('Terms')}
              >
                Términos y Condiciones
              </Text>
              {' '}y la{' '}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                Política de Privacidad
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerButton, !acceptedTerms && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading || !acceptedTerms}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Inicia sesión aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  roleButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 10,
  },
  loginLink: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mapInstruction: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    marginTop: -4,
  },
  mapContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  addressInfo: {
    flexDirection: 'row',
    backgroundColor: '#F0F9F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1F0E3',
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: 50,
  },
  searchLoader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    maxHeight: 200,
    overflow: 'hidden',
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
    color: COLORS.gray,
  },
  // Estilos para términos y condiciones
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Estilos para nota informativa
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
});

export default RegisterScreen;

import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { shopService } from '../services/api';
import { CreateShopRequest, ImageFile, Schedule } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface CreateShopScreenProps {
  navigation: any;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Tipos de comercio
type ShopCategory = 'petshop' | 'forrajeria' | 'veterinaria' | 'distribuidor';

// Posiciones de IVA
type IVAPosition = 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final';

interface DaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

// Configuración de categorías de tienda
const SHOP_CATEGORIES: { value: ShopCategory; label: string; icon: string; description: string }[] = [
  { value: 'petshop', label: 'Pet Shop / Almacén', icon: 'storefront', description: 'Venta minorista de productos para mascotas' },
  { value: 'forrajeria', label: 'Forrajería', icon: 'leaf', description: 'Alimentos y productos agrícolas' },
  { value: 'veterinaria', label: 'Veterinaria', icon: 'medkit', description: 'Servicios veterinarios y productos' },
  { value: 'distribuidor', label: 'Distribuidor', icon: 'cube', description: 'Venta mayorista a comercios' },
];

// Posiciones de IVA
const IVA_POSITIONS: { value: IVAPosition; label: string }[] = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
];

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const CreateShopScreen: React.FC<CreateShopScreenProps> = ({ navigation }) => {
  // Form state - Información básica
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shopCategory, setShopCategory] = useState<ShopCategory>('petshop');
  const [type, setType] = useState<'retailer' | 'wholesaler'>('retailer');
  const [distributorCode, setDistributorCode] = useState('');

  // Ubicación
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  // Contacto
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Datos fiscales
  const [razonSocial, setRazonSocial] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [cuit, setCuit] = useState('');
  const [ivaPosition, setIvaPosition] = useState<IVAPosition>('monotributo');
  const [iibb, setIibb] = useState('');
  const [convenioMultilateral, setConvenioMultilateral] = useState(false);

  // Imágenes
  const [logo, setLogo] = useState<ImageFile | null>(null);
  const [banner, setBanner] = useState<ImageFile | null>(null);

  // Horarios
  const [schedule, setSchedule] = useState<{ [key in DayOfWeek]?: DaySchedule }>({
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '13:00' },
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [showFiscalData, setShowFiscalData] = useState(false);

  // Validar código de distribuidor (formato: CP + 2 letras + 2 números, ej: CPAB01)
  const validateDistributorCode = (code: string): boolean => {
    const regex = /^CP[A-Z]{2}[0-9]{2}$/;
    return regex.test(code.toUpperCase());
  };

  // Validar CUIT (formato: XX-XXXXXXXX-X)
  const formatCuit = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 10) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`;
  };

  const handleCuitChange = (value: string) => {
    const formatted = formatCuit(value);
    if (formatted.replace(/-/g, '').length <= 11) {
      setCuit(formatted);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la tienda es requerido');
      return false;
    }

    // Validar formato de código de distribuidor solo si se proporciona
    // (La validación contra el backend se hará cuando esté implementado)
    if (shopCategory === 'distribuidor' && distributorCode.trim()) {
      if (!validateDistributorCode(distributorCode)) {
        Alert.alert('Error', 'El código de autorización no es válido. Formato: CPXX00 (ej: CPAB01)');
        return false;
      }
    }

    if (!address.trim()) {
      Alert.alert('Error', 'La dirección es requerida');
      return false;
    }

    if (!province.trim()) {
      Alert.alert('Error', 'La provincia es requerida');
      return false;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'La ciudad es requerida');
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      Alert.alert('Error', 'Por favor ingresa un email de notificaciones válido');
      return false;
    }

    // Validar CUIT si se proporcionó
    if (cuit && cuit.replace(/-/g, '').length !== 11) {
      Alert.alert('Error', 'El CUIT debe tener 11 dígitos');
      return false;
    }

    return true;
  };

  // Image picker
  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos permisos para acceder a tu galería de fotos'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageFile: ImageFile = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: type === 'logo' ? 'logo.jpg' : 'banner.jpg',
        };

        if (type === 'logo') {
          setLogo(imageFile);
        } else {
          setBanner(imageFile);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Schedule management
  const updateDaySchedule = (day: DayOfWeek, field: 'open' | 'close', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
        closed: false,
      } as DaySchedule,
    }));
  };

  const toggleDayClosed = (day: DayOfWeek) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      if (newSchedule[day]?.closed) {
        // Reopen the day
        newSchedule[day] = { open: '09:00', close: '18:00', closed: false };
      } else {
        // Close the day
        delete newSchedule[day];
      }
      return newSchedule;
    });
  };

  const isDayClosed = (day: DayOfWeek): boolean => {
    return !schedule[day] || schedule[day]?.closed === true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Build schedule without closed days
      const finalSchedule: Schedule = {};
      Object.entries(schedule).forEach(([day, hours]) => {
        if (hours && !hours.closed) {
          finalSchedule[day] = {
            open: hours.open,
            close: hours.close,
          };
        }
      });

      // Determinar el tipo basado en la categoría
      const finalType = shopCategory === 'distribuidor' ? 'wholesaler' : type;

      const shopData: CreateShopRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: finalType,
        category: shopCategory,
        address: address.trim(),
        province: province.trim(),
        city: city.trim(),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        notificationEmail: notificationEmail.trim() || undefined,
        website: website.trim() || undefined,
        schedule: Object.keys(finalSchedule).length > 0 ? finalSchedule : undefined,
        logo: logo || undefined,
        banner: banner || undefined,
        // Datos fiscales
        razonSocial: razonSocial.trim() || undefined,
        direccionFiscal: direccionFiscal.trim() || undefined,
        cuit: cuit.replace(/-/g, '') || undefined,
        ivaPosition: ivaPosition || undefined,
        iibb: iibb.trim() || undefined,
        convenioMultilateral: convenioMultilateral,
        // Código distribuidor
        distributorCode: shopCategory === 'distribuidor' ? distributorCode.toUpperCase().trim() : undefined,
      };

      const newShop = await shopService.create(shopData);

      Alert.alert(
        'Tienda creada',
        'Tu tienda ha sido creada exitosamente. Ahora debes suscribirte para que aparezca en el mapa.',
        [
          {
            text: 'Suscribirme',
            onPress: () => navigation.replace('Subscription'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating shop:', error);
      const errorMessage =
        error?.response?.data?.message ||
        'No se pudo crear la tienda. Por favor intenta nuevamente.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Tienda</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>

            {/* Shop Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Categoría del comercio <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.categoryContainer}>
                {SHOP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      shopCategory === cat.value && styles.categoryCardActive,
                    ]}
                    onPress={() => {
                      setShopCategory(cat.value);
                      if (cat.value === 'distribuidor') {
                        setType('wholesaler');
                      }
                    }}
                    disabled={loading}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={24}
                      color={shopCategory === cat.value ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.categoryCardLabel,
                        shopCategory === cat.value && styles.categoryCardLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      style={[
                        styles.categoryCardDescription,
                        shopCategory === cat.value && styles.categoryCardDescriptionActive,
                      ]}
                      numberOfLines={2}
                    >
                      {cat.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distributor Code (only for distributors) */}
            {shopCategory === 'distribuidor' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Código de autorización (opcional)
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: CPAB01"
                    placeholderTextColor={COLORS.placeholder}
                    value={distributorCode}
                    onChangeText={(text) => setDistributorCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={6}
                    editable={!loading}
                  />
                </View>
                <Text style={styles.helperText}>
                  Si tienes un código de distribuidor, ingrésalo aquí. Formato: CP + 2 letras + 2 números (ej: CPAB01)
                </Text>
              </View>
            )}

            {/* Retailer/Wholesaler Type (only for non-distributors) */}
            {shopCategory !== 'distribuidor' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Tipo de venta <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.typeButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === 'retailer' && styles.typeButtonActive,
                    ]}
                    onPress={() => setType('retailer')}
                    disabled={loading}
                  >
                    <Ionicons
                      name="basket-outline"
                      size={24}
                      color={type === 'retailer' ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === 'retailer' && styles.typeButtonTextActive,
                      ]}
                    >
                      Minorista
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === 'wholesaler' && styles.typeButtonActive,
                    ]}
                    onPress={() => setType('wholesaler')}
                    disabled={loading}
                  >
                    <Ionicons
                      name="business-outline"
                      size={24}
                      color={type === 'wholesaler' ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === 'wholesaler' && styles.typeButtonTextActive,
                      ]}
                    >
                      Mayorista
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre de la tienda <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="storefront-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Mascotería El Amigo Fiel"
                  placeholderTextColor={COLORS.placeholder}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe tu tienda, productos y servicios..."
                  placeholderTextColor={COLORS.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Dirección <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Calle, número, barrio"
                  placeholderTextColor={COLORS.placeholder}
                  value={address}
                  onChangeText={setAddress}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Province */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Provincia <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="map-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Buenos Aires"
                  placeholderTextColor={COLORS.placeholder}
                  value={province}
                  onChangeText={setProvince}
                  editable={!loading}
                />
              </View>
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ciudad <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Capital Federal"
                  placeholderTextColor={COLORS.placeholder}
                  value={city}
                  onChangeText={setCity}
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+5491112345678"
                  placeholderTextColor={COLORS.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* WhatsApp */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WhatsApp</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+5491112345678"
                  placeholderTextColor={COLORS.placeholder}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>
                Este número se mostrará a los clientes para contacto directo
              </Text>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email público</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="tienda@ejemplo.com"
                  placeholderTextColor={COLORS.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Notification Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email para notificaciones</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="notifications-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="notificaciones@ejemplo.com"
                  placeholderTextColor={COLORS.placeholder}
                  value={notificationEmail}
                  onChangeText={setNotificationEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>
                Recibirás información sobre tu suscripción, novedades y promociones
              </Text>
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sitio web</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="globe-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://www.mitienda.com"
                  placeholderTextColor={COLORS.placeholder}
                  value={website}
                  onChangeText={setWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Fiscal Data Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeaderToggle}
              onPress={() => setShowFiscalData(!showFiscalData)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Datos Fiscales</Text>
              </View>
              <Ionicons
                name={showFiscalData ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <Text style={styles.sectionSubtitle}>
              Información requerida para facturación (opcional)
            </Text>

            {showFiscalData && (
              <View style={styles.fiscalDataContainer}>
                {/* Razón Social */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Razón Social</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="briefcase-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre de la empresa o persona"
                      placeholderTextColor={COLORS.placeholder}
                      value={razonSocial}
                      onChangeText={setRazonSocial}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Dirección Fiscal */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dirección Fiscal</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Dirección registrada en AFIP"
                      placeholderTextColor={COLORS.placeholder}
                      value={direccionFiscal}
                      onChangeText={setDireccionFiscal}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* CUIT */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CUIT</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="XX-XXXXXXXX-X"
                      placeholderTextColor={COLORS.placeholder}
                      value={cuit}
                      onChangeText={handleCuitChange}
                      keyboardType="numeric"
                      maxLength={13}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Posición IVA */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Posición frente al IVA</Text>
                  <View style={styles.ivaContainer}>
                    {IVA_POSITIONS.map((pos) => (
                      <TouchableOpacity
                        key={pos.value}
                        style={[
                          styles.ivaButton,
                          ivaPosition === pos.value && styles.ivaButtonActive,
                        ]}
                        onPress={() => setIvaPosition(pos.value)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.ivaButtonText,
                            ivaPosition === pos.value && styles.ivaButtonTextActive,
                          ]}
                        >
                          {pos.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* IIBB */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ingresos Brutos</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="receipt-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Número de IIBB"
                      placeholderTextColor={COLORS.placeholder}
                      value={iibb}
                      onChangeText={setIibb}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Convenio Multilateral */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setConvenioMultilateral(!convenioMultilateral)}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, convenioMultilateral && styles.checkboxChecked]}>
                    {convenioMultilateral && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Inscripto en Convenio Multilateral</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imágenes</Text>

            {/* Logo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Logo</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage('logo')}
                disabled={loading}
              >
                {logo ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={24} color={COLORS.white} />
                      <Text style={styles.imageOverlayText}>Cambiar logo</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color={COLORS.gray} />
                    <Text style={styles.imagePlaceholderText}>Seleccionar logo</Text>
                    <Text style={styles.imageHintText}>Recomendado: 1:1 (cuadrado)</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Banner */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Banner</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage('banner')}
                disabled={loading}
              >
                {banner ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: banner.uri }} style={styles.bannerPreview} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={24} color={COLORS.white} />
                      <Text style={styles.imageOverlayText}>Cambiar banner</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.imagePlaceholder, styles.bannerPlaceholder]}>
                    <Ionicons name="image-outline" size={40} color={COLORS.gray} />
                    <Text style={styles.imagePlaceholderText}>Seleccionar banner</Text>
                    <Text style={styles.imageHintText}>Recomendado: 16:9</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Schedule Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Horarios de Atención</Text>
              <TouchableOpacity
                onPress={() => setShowScheduleEditor(!showScheduleEditor)}
                disabled={loading}
              >
                <Ionicons
                  name={showScheduleEditor ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {showScheduleEditor && (
              <View style={styles.scheduleEditor}>
                {DAYS_OF_WEEK.map((day) => {
                  const isClosed = isDayClosed(day.key);
                  return (
                    <View key={day.key} style={styles.scheduleRow}>
                      <View style={styles.scheduleRowHeader}>
                        <Text style={styles.scheduleDayLabel}>{day.label}</Text>
                        <TouchableOpacity
                          onPress={() => toggleDayClosed(day.key)}
                          style={styles.closedToggle}
                          disabled={loading}
                        >
                          <Ionicons
                            name={isClosed ? 'checkbox-outline' : 'square-outline'}
                            size={20}
                            color={COLORS.primary}
                          />
                          <Text style={styles.closedToggleText}>Cerrado</Text>
                        </TouchableOpacity>
                      </View>

                      {!isClosed && (
                        <View style={styles.scheduleTimeInputs}>
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeLabel}>Apertura</Text>
                            <TextInput
                              style={styles.timeInput}
                              placeholder="09:00"
                              placeholderTextColor={COLORS.placeholder}
                              value={schedule[day.key]?.open || ''}
                              onChangeText={(value) => updateDaySchedule(day.key, 'open', value)}
                              keyboardType="numbers-and-punctuation"
                              editable={!loading}
                            />
                          </View>

                          <Text style={styles.timeSeparator}>-</Text>

                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeLabel}>Cierre</Text>
                            <TextInput
                              style={styles.timeInput}
                              placeholder="18:00"
                              placeholderTextColor={COLORS.placeholder}
                              value={schedule[day.key]?.close || ''}
                              onChangeText={(value) => updateDaySchedule(day.key, 'close', value)}
                              keyboardType="numbers-and-punctuation"
                              editable={!loading}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Crear Tienda</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  textAreaContainer: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  imagePickerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  logoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  bannerPreview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  imagePlaceholder: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  bannerPlaceholder: {
    paddingVertical: 40,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  imageHintText: {
    fontSize: 12,
    color: COLORS.placeholder,
  },
  scheduleEditor: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  scheduleRow: {
    gap: 12,
  },
  scheduleRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleDayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  closedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closedToggleText: {
    fontSize: 14,
    color: COLORS.text,
  },
  scheduleTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  timeInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 20,
  },
  bottomPadding: {
    height: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Estilos para categorías de tienda
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    gap: 8,
  },
  categoryCardActive: {
    backgroundColor: COLORS.primary,
  },
  categoryCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  categoryCardLabelActive: {
    color: COLORS.white,
  },
  categoryCardDescription: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryCardDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Estilos para texto de ayuda
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },
  // Estilos para datos fiscales
  sectionHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  fiscalDataContainer: {
    marginTop: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  // Estilos para posición IVA
  ivaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ivaButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ivaButtonActive: {
    backgroundColor: COLORS.primary,
  },
  ivaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ivaButtonTextActive: {
    color: COLORS.white,
  },
  // Estilos para checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default CreateShopScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { COLORS } from '../constants/colors';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();

  // Form state - name and phone are display only for now (API doesn't support updating them yet)
  const [name] = useState(user?.name || '');
  const [phone] = useState(user?.phone || '');
  const [province, setProvince] = useState(user?.province || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Validation
  const [errors, setErrors] = useState({
    province: '',
    city: '',
    address: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      province: '',
      city: '',
      address: '',
    };

    let isValid = true;

    // Province validation
    if (!province.trim()) {
      newErrors.province = 'La provincia es requerida';
      isValid = false;
    }

    // City validation
    if (!city.trim()) {
      newErrors.city = 'La ciudad es requerida';
      isValid = false;
    }

    // Address validation
    if (!address.trim()) {
      newErrors.address = 'La dirección es requerida';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Update location data
      await authService.updateLocation({
        province,
        city,
        address,
      });

      // Refresh user data from server
      await refreshUser();

      // Show success message
      Alert.alert(
        'Perfil actualizado',
        'Tus datos han sido actualizados exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo actualizar el perfil. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name || 'U')}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Field (readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={name}
                  editable={false}
                  placeholder="Nombre completo"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>
              <Text style={styles.helperText}>El nombre no puede ser modificado</Text>
            </View>

            {/* Email Field (readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={user?.email}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>
              <Text style={styles.helperText}>El email no puede ser modificado</Text>
            </View>

            {/* Phone Field (readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={phone}
                  editable={false}
                  placeholder="Teléfono"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.helperText}>El teléfono no puede ser modificado</Text>
            </View>

            {/* Location Section */}
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>

            {/* Province Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Provincia <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputContainer, errors.province ? styles.inputError : null]}>
                <Ionicons name="map-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={province}
                  onChangeText={setProvince}
                  placeholder="Ingresa tu provincia"
                  placeholderTextColor={COLORS.placeholder}
                  editable={!loading}
                />
              </View>
              {errors.province ? <Text style={styles.errorText}>{errors.province}</Text> : null}
            </View>

            {/* City Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ciudad <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputContainer, errors.city ? styles.inputError : null]}>
                <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ingresa tu ciudad"
                  placeholderTextColor={COLORS.placeholder}
                  editable={!loading}
                />
              </View>
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
            </View>

            {/* Address Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Dirección <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputContainer, errors.address ? styles.inputError : null]}>
                <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ingresa tu dirección completa"
                  placeholderTextColor={COLORS.placeholder}
                  editable={!loading}
                  multiline
                />
              </View>
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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
    color: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    backgroundColor: COLORS.primary,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
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
    borderColor: 'transparent',
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
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
  },
  inputTextDisabled: {
    color: '#999',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  bottomPadding: {
    height: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
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
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default EditProfileScreen;

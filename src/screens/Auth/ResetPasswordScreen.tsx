import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';
import { COLORS } from '../../constants/colors';

interface ResetPasswordScreenProps {
  navigation: AuthStackNavigationProp<any>;
  route?: any;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const tokenFromRoute = route?.params?.token || '';

  const [token, setToken] = useState(tokenFromRoute);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    return 'Error al restablecer la contraseña. Por favor intenta nuevamente.';
  };

  const validateForm = (): boolean => {
    if (!token) {
      Alert.alert('Error', 'Por favor ingresa el código de recuperación');
      return false;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.resetPassword({
        token: token.trim(),
        newPassword,
      });

      Alert.alert(
        'Contraseña restablecida',
        'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
        [
          {
            text: 'Ir a inicio de sesión',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

        <Text style={styles.title}>Restablecer contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa el código que recibiste por email y tu nueva contraseña
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Código de recuperación</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Ingresa el código"
              placeholderTextColor={COLORS.placeholder}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>Nueva contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={COLORS.placeholder}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
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
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {newPassword.length > 0 && (
            <View style={styles.passwordRequirements}>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={newPassword.length >= 8 ? COLORS.primary : COLORS.gray}
                />
                <Text
                  style={[
                    styles.requirementText,
                    newPassword.length >= 8 && styles.requirementMet,
                  ]}
                >
                  Mínimo 8 caracteres
                </Text>
              </View>
              {confirmPassword.length > 0 && (
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={newPassword === confirmPassword ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={newPassword === confirmPassword ? COLORS.primary : COLORS.gray}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      newPassword === confirmPassword && styles.requirementMet,
                    ]}
                  >
                    Las contraseñas coinciden
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Restablecer contraseña</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.primary} />
            <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
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
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
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
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  form: {
    marginBottom: 30,
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
    marginBottom: 20,
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
  passwordRequirements: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  requirementMet: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  backToLoginText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ResetPasswordScreen;

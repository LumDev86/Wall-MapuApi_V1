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

interface ForgotPasswordScreenProps {
  navigation: AuthStackNavigationProp<any>;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    return 'Error al enviar el código. Por favor intenta nuevamente.';
  };

  const validateEmail = (): boolean => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setEmailSent(true);
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

        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          {emailSent
            ? 'Te hemos enviado un código de recuperación a tu email'
            : 'Ingresa tu email y te enviaremos un código para restablecer tu contraseña'}
        </Text>

        {!emailSent ? (
          <View style={styles.form}>
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
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Enviar código</Text>
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
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
            </View>

            <View style={styles.successMessage}>
              <Text style={styles.successTitle}>Código enviado</Text>
              <Text style={styles.successText}>
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </Text>
              <Text style={styles.successEmail}>{email}</Text>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => navigation.navigate('ResetPassword', {})}
            >
              <Text style={styles.continueButtonText}>Continuar con el código</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setEmailSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendButtonText}>Enviar código a otro email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back-outline" size={20} color={COLORS.primary} />
              <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        )}
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
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 30,
  },
  successMessage: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.gray,
    lineHeight: 24,
    marginBottom: 15,
  },
  successEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 15,
    marginBottom: 10,
  },
  resendButtonText: {
    color: COLORS.text,
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;

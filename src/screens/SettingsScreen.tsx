import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

interface Settings {
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    promotions: boolean;
    orderUpdates: boolean;
    newShops: boolean;
  };
  privacy: {
    shareLocation: boolean;
    analyticsEnabled: boolean;
  };
  display: {
    darkMode: boolean;
    compactView: boolean;
  };
}

const defaultSettings: Settings = {
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    promotions: true,
    orderUpdates: true,
    newShops: true,
  },
  privacy: {
    shareLocation: true,
    analyticsEnabled: true,
  },
  display: {
    darkMode: false,
    compactView: false,
  },
};

const SETTINGS_KEY = '@wallmapu_settings';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudieron guardar los ajustes');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (key: keyof Settings['notifications'], value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const updatePrivacySetting = (key: keyof Settings['privacy'], value: boolean) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const updateDisplaySetting = (key: keyof Settings['display'], value: boolean) => {
    const newSettings = {
      ...settings,
      display: {
        ...settings.display,
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Cambiar contraseña',
      'Te enviaremos un correo con instrucciones para cambiar tu contraseña.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar correo',
          onPress: () => {
            // Aquí se enviaría el correo de recuperación
            Alert.alert('Correo enviado', `Revisa tu bandeja de entrada en ${user?.email}`);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y perderás todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar eliminación',
              'Escribe "ELIMINAR" para confirmar',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: async () => {
                    // Aquí se eliminaría la cuenta en el backend
                    // Por ahora solo cerramos sesión
                    await logout();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar caché',
      '¿Deseas limpiar los datos almacenados en caché? Esto puede mejorar el rendimiento de la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: async () => {
            try {
              // Limpiar solo datos de caché, no las credenciales
              const keysToKeep = ['authToken', 'user', SETTINGS_KEY];
              const allKeys = await AsyncStorage.getAllKeys();
              const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert('Caché limpiada', 'Los datos en caché han sido eliminados');
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar la caché');
            }
          },
        },
      ]
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.placeholder}>
          {saving && <ActivityIndicator size="small" color="#fff" />}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications"
              title="Notificaciones push"
              description="Recibe alertas en tu dispositivo"
              value={settings.notifications.pushEnabled}
              onValueChange={(v) => updateNotificationSetting('pushEnabled', v)}
            />
            <SettingRow
              icon="mail"
              title="Notificaciones por email"
              description="Recibe información en tu correo"
              value={settings.notifications.emailEnabled}
              onValueChange={(v) => updateNotificationSetting('emailEnabled', v)}
            />
            <SettingRow
              icon="megaphone"
              title="Promociones"
              description="Ofertas y descuentos de tiendas"
              value={settings.notifications.promotions}
              onValueChange={(v) => updateNotificationSetting('promotions', v)}
            />
            <SettingRow
              icon="receipt"
              title="Actualizaciones de pedidos"
              description="Estado de tus compras"
              value={settings.notifications.orderUpdates}
              onValueChange={(v) => updateNotificationSetting('orderUpdates', v)}
            />
            <SettingRow
              icon="storefront"
              title="Nuevas tiendas"
              description="Tiendas nuevas cerca de ti"
              value={settings.notifications.newShops}
              onValueChange={(v) => updateNotificationSetting('newShops', v)}
              isLast
            />
          </View>
        </View>

        {/* Privacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <View style={styles.card}>
            <SettingRow
              icon="location"
              title="Compartir ubicación"
              description="Permite mostrar tiendas cercanas"
              value={settings.privacy.shareLocation}
              onValueChange={(v) => updatePrivacySetting('shareLocation', v)}
            />
            <SettingRow
              icon="analytics"
              title="Análisis de uso"
              description="Ayúdanos a mejorar la app"
              value={settings.privacy.analyticsEnabled}
              onValueChange={(v) => updatePrivacySetting('analyticsEnabled', v)}
              isLast
            />
          </View>
        </View>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.card}>
            <SettingRow
              icon="moon"
              title="Modo oscuro"
              description="Reduce el brillo de la pantalla"
              value={settings.display.darkMode}
              onValueChange={(v) => updateDisplaySetting('darkMode', v)}
              disabled
              comingSoon
            />
            <SettingRow
              icon="grid"
              title="Vista compacta"
              description="Muestra más contenido en pantalla"
              value={settings.display.compactView}
              onValueChange={(v) => updateDisplaySetting('compactView', v)}
              isLast
              disabled
              comingSoon
            />
          </View>
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="key" size={20} color="#2196F3" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Cambiar contraseña</Text>
                  <Text style={styles.actionDescription}>Actualiza tu contraseña de acceso</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="trash-bin" size={20} color="#FF9800" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Limpiar caché</Text>
                  <Text style={styles.actionDescription}>Libera espacio en tu dispositivo</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionRow, styles.actionRowLast]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="person-remove" size={20} color="#F44336" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: '#F44336' }]}>
                    Eliminar cuenta
                  </Text>
                  <Text style={styles.actionDescription}>
                    Elimina permanentemente tu cuenta
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Los cambios se guardan automáticamente
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

interface SettingRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  isLast,
  disabled,
  comingSoon,
}) => (
  <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.settingContent}>
        <View style={styles.settingTitleRow}>
          <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          {comingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Próximamente</Text>
            </View>
          )}
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
      thumbColor={value ? COLORS.primary : '#fff'}
      disabled={disabled}
    />
  </View>
);

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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: '#999',
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
  },
  comingSoonBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF9800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#888',
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;

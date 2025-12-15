import React from 'react';
import { BottomTabScreenNavigationProp } from '../types/navigation.types';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

interface ProfileScreenProps {
  navigation: BottomTabScreenNavigationProp<'Perfil'>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      client: 'Cliente',
      retailer: 'Minorista',
      wholesaler: 'Mayorista',
      admin: 'Administrador',
    };
    return roles[role] || role;
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header con avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name || 'U')}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(user?.role || '')}</Text>
          </View>
        </View>

        {/* Información Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.card}>
            <InfoRow icon="person-outline" label="Nombre completo" value={user?.name || ''} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email || ''} />
            <InfoRow icon="call-outline" label="Teléfono" value={user?.phone || 'No agregado'} />
            <InfoRow
              icon="map-outline"
              label="Provincia"
              value={user?.province || 'No agregado'}
            />
            <InfoRow
              icon="location-outline"
              label="Ciudad"
              value={user?.city || 'No agregado'}
            />
            <InfoRow
              icon="home-outline"
              label="Dirección"
              value={user?.address || 'No agregado'}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Editar información</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Información de la tienda (solo para minoristas y mayoristas) */}
        {(user?.role === 'retailer' || user?.role === 'wholesaler') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Tienda</Text>
            <View style={styles.card}>
              <InfoRow
                icon="storefront-outline"
                label="Nombre de la tienda"
                value="No configurado"
              />
              <InfoRow
                icon="location-outline"
                label="Dirección"
                value="No configurado"
              />
              <InfoRow
                icon="time-outline"
                label="Horario"
                value="No configurado"
              />
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('MyShop')}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                <Text style={styles.editButtonText}>Configurar tienda</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Banner Publicitario (solo para minoristas y mayoristas) */}
        {(user?.role === 'retailer' || user?.role === 'wholesaler') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publicidad</Text>
            {user?.hasSubscription ? (
              <View style={styles.card}>
                <View style={styles.subscriptionActive}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.subscriptionActiveText}>Suscripción Activa</Text>
                </View>

                {user?.bannerImage ? (
                  <View style={styles.bannerPreview}>
                    <Text style={styles.bannerPreviewLabel}>Tu banner actual:</Text>
                    <View style={styles.bannerImageContainer}>
                      <Text style={styles.bannerImagePlaceholder}>🖼️ Banner imagen</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton}>
                      <Ionicons name="images-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.editButtonText}>Cambiar banner</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noBanner}>
                    <Ionicons name="images-outline" size={48} color="#ccc" />
                    <Text style={styles.noBannerText}>Aún no has agregado un banner</Text>
                    <Text style={styles.noBannerSubtext}>
                      Agrega un banner para promocionar tu tienda en la app
                    </Text>
                    <TouchableOpacity style={styles.primaryButton}>
                      <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Agregar banner</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.subscriptionPromo}>
                <View style={styles.promoIcon}>
                  <Ionicons name="megaphone" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.promoTitle}>Promociona tu tienda</Text>
                <Text style={styles.promoText}>
                  Suscríbete al plan Premium y destaca tu tienda con banners publicitarios
                  en la aplicación
                </Text>
                <View style={styles.promoBenefits}>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.benefitText}>Banner en pantalla principal</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.benefitText}>Mayor visibilidad</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.benefitText}>Estadísticas detalladas</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={styles.subscribeButtonText}>Suscribirse ahora</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Opciones del menú */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones</Text>
          <View style={styles.card}>
            {user?.role === 'client' && (
              <MenuOption
                icon="receipt-outline"
                label="Mis Pedidos"
                onPress={() => navigation.navigate('MyOrders')}
              />
            )}
            {(user?.role === 'retailer' || user?.role === 'wholesaler') && (
              <>
                <MenuOption
                  icon="storefront-outline"
                  label="Mi Tienda"
                  onPress={() => navigation.navigate('MyShop')}
                />
                <MenuOption
                  icon="card-outline"
                  label="Suscripción"
                  onPress={() => navigation.navigate('Subscription')}
                />
              </>
            )}
            <MenuOption
              icon="settings-outline"
              label="Configuración"
              onPress={() => navigation.navigate('Settings')}
            />
            <MenuOption
              icon="help-circle-outline"
              label="Ayuda y Soporte"
              onPress={() => navigation.navigate('HelpSupport')}
            />
            <MenuOption
              icon="information-circle-outline"
              label="Acerca de"
              onPress={() => navigation.navigate('About')}
            />
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon as any} size={20} color="#666" />
        <View style={styles.infoRowContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
};

interface MenuOptionProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const MenuOption: React.FC<MenuOptionProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={styles.menuOptionLeft}>
        <Ionicons name={icon as any} size={22} color={COLORS.text} />
        <Text style={styles.menuOptionText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoRowContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  menuOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuOptionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  subscriptionActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9F6',
    borderRadius: 12,
    marginBottom: 16,
  },
  subscriptionActiveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bannerPreview: {
    marginTop: 8,
  },
  bannerPreviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bannerImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bannerImagePlaceholder: {
    fontSize: 32,
  },
  noBanner: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  noBannerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  subscriptionPromo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promoIcon: {
    width: 70,
    height: 70,
    backgroundColor: '#F0F9F6',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  promoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  promoBenefits: {
    width: '100%',
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;

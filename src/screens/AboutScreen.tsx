import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import Constants from 'expo-constants';

const AboutScreen = () => {
  const navigation = useNavigation();

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
  };

  const openEmail = () => {
    Linking.openURL('mailto:soporte@wallmapu.app?subject=Consulta desde la app');
  };

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
        <Text style={styles.headerTitle}>Acerca de</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Logo y nombre de la app */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/wallmapu-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Wall-Mapu</Text>
          <Text style={styles.appTagline}>
            Marketplace de productos para mascotas
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versión {appVersion} ({buildNumber})</Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre la aplicación</Text>
          <View style={styles.card}>
            <Text style={styles.description}>
              Wall-Mapu es una plataforma que conecta a dueños de mascotas con tiendas
              locales de productos para animales. Encuentra alimentos, accesorios,
              medicamentos y mucho más cerca de tu ubicación.
            </Text>
            <Text style={styles.description}>
              Nuestra misión es facilitar el acceso a productos de calidad para tus
              mascotas, apoyando al comercio local y brindando la mejor experiencia
              de compra.
            </Text>
          </View>
        </View>

        {/* Características */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.card}>
            <FeatureItem
              icon="map"
              title="Mapa interactivo"
              description="Encuentra tiendas cercanas en tiempo real"
            />
            <FeatureItem
              icon="search"
              title="Búsqueda inteligente"
              description="Busca productos y tiendas fácilmente"
            />
            <FeatureItem
              icon="storefront"
              title="Para comerciantes"
              description="Publica tu tienda y llega a más clientes"
            />
            <FeatureItem
              icon="shield-checkmark"
              title="Seguro y confiable"
              description="Tiendas verificadas y datos protegidos"
            />
          </View>
        </View>

        {/* Información legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => (navigation as any).navigate('Terms')}
            >
              <Ionicons name="document-text-outline" size={22} color={COLORS.text} />
              <Text style={styles.linkText}>Términos y condiciones</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkItem, { borderBottomWidth: 0 }]}
              onPress={() => (navigation as any).navigate('PrivacyPolicy')}
            >
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.text} />
              <Text style={styles.linkText}>Política de privacidad</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={openEmail}
            >
              <Ionicons name="mail-outline" size={22} color={COLORS.text} />
              <Text style={styles.linkText}>soporte@wallmapu.app</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkItem, { borderBottomWidth: 0 }]}
              onPress={() => openLink('https://wallmapu.app')}
            >
              <Ionicons name="globe-outline" size={22} color={COLORS.text} />
              <Text style={styles.linkText}>www.wallmapu.app</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Redes sociales */}
        <View style={styles.socialSection}>
          <Text style={styles.followUs}>Síguenos en redes</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://instagram.com/wallmapu.app')}
            >
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://facebook.com/wallmapu.app')}
            >
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://twitter.com/wallmapu_app')}
            >
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Wall-Mapu. Todos los derechos reservados.
          </Text>
          <Text style={styles.madeWith}>
            Hecho con ❤️ en Argentina
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: '#F0F9F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#888',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  socialSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  followUs: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  madeWith: {
    fontSize: 12,
    color: '#999',
  },
});

export default AboutScreen;

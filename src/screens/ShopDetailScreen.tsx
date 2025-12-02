import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shopService, productService } from '../services/api';
import { Shop, Product } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface ShopDetailScreenProps {
  navigation: any;
  route: any;
}

const ShopDetailScreen: React.FC<ShopDetailScreenProps> = ({ navigation, route }) => {
  const { shopId } = route.params;
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchShop();
    fetchProducts();
  }, [shopId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const response = await shopService.getById(shopId);
      setShop(response);
    } catch (error) {
      console.error('Error fetching shop:', error);
      Alert.alert('Error', 'No se pudo cargar la tienda');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productService.getByShop(shopId, { page: 1, limit: 10 });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    }
  };

  const handleEmail = () => {
    if (shop?.email) {
      Linking.openURL(`mailto:${shop.email}`);
    }
  };

  const handleWebsite = () => {
    if (shop?.website) {
      Linking.openURL(shop.website);
    }
  };

  const handleDirections = () => {
    if (shop?.latitude && shop?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Tienda no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {shop.banner ? (
            <Image source={{ uri: shop.banner }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, { backgroundColor: COLORS.primary }]} />
          )}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: shop.logo || 'https://via.placeholder.com/100' }}
              style={styles.logo}
            />
          </View>
        </View>

        {/* Información básica */}
        <View style={styles.infoContainer}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
            </Text>
          </View>
          {shop.isOpenNow && (
            <View style={styles.openBadge}>
              <Ionicons name="time" size={16} color="#4CAF50" />
              <Text style={styles.openText}>Abierto ahora</Text>
            </View>
          )}
          <Text style={styles.description}>{shop.description}</Text>
        </View>

        {/* Información de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          <TouchableOpacity style={styles.contactRow} onPress={handleDirections}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>{shop.address}, {shop.city}, {shop.province}</Text>
          </TouchableOpacity>

          {shop.phone && (
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{shop.phone}</Text>
            </TouchableOpacity>
          )}

          {shop.email && (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <Ionicons name="mail" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{shop.email}</Text>
            </TouchableOpacity>
          )}

          {shop.website && (
            <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
              <Ionicons name="globe" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{shop.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horarios */}
        {shop.schedule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horarios</Text>
            {Object.entries(shop.schedule).map(([day, hours]: [string, any]) => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{getDayName(day)}</Text>
                <Text style={styles.scheduleHours}>
                  {hours.open} - {hours.close}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Productos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductList', {
                shopId: shop.id,
                title: `Productos de ${shop.name}`,
              })}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {productsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                >
                  <Image
                    source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    ${parseFloat(product.priceRetail).toLocaleString('es-AR')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noProducts}>No hay productos disponibles</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color={COLORS.white} />
          <Text style={styles.callButtonText}>Llamar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={20} color={COLORS.white} />
          <Text style={styles.directionsButtonText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getDayName = (day: string): string => {
  const days: { [key: string]: string } = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };
  return days[day] || day;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  bannerContainer: {
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  infoContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  openText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 8,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  scheduleDay: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  scheduleHours: {
    fontSize: 14,
    color: COLORS.gray,
  },
  productCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    padding: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  noProducts: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    gap: 6,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ShopDetailScreen;

import React, { useEffect, useState } from 'react';
import { MainStackNavigationProp } from '../types/navigation.types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productService, cartService } from '../services/api';
import { Product } from '../types/product.types';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import ImageWithFallback from '../components/ImageWithFallback';
import { screenWidth as width, moderateScale as ms, scale as s } from '../utils/responsive';

interface ProductDetailScreenProps {
  navigation: MainStackNavigationProp<any>;
  route: any;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { refreshCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando producto con ID:', productId);
      const response = await productService.getById(productId);
      console.log('✅ Producto cargado:', response);
      console.log('📋 Estructura del producto:', JSON.stringify(response, null, 2));
      setProduct(response);
    } catch (error: any) {
      console.error('❌ Error fetching product:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Product ID que causó el error:', productId);

      const errorMessage = error.response?.data?.message || error.message || 'No se pudo cargar el producto';
      Alert.alert(
        'Error',
        `No se pudo cargar el producto.\n\n${errorMessage}\n\nID: ${productId}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      await cartService.addToCart({
        productId: product.id,
        quantity: 1,
      });

      // Refrescar el contador del carrito
      await refreshCart();

      Alert.alert(
        'Agregado al carrito',
        `${product.name} se agregó correctamente al carrito`,
        [
          { text: 'Seguir comprando', style: 'cancel' },
          {
            text: 'Ver carrito',
            onPress: () => navigation.navigate('Cart'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error al agregar al carrito:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo agregar el producto al carrito';
      Alert.alert('Error', errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContactShop = () => {
    Alert.alert('Contactar', `Contactar a ${product?.shop?.name}`);
    // TODO: Implementar navegación a tienda o WhatsApp
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Imágenes */}
        <View style={styles.imageContainer}>
          <ImageWithFallback
            uri={product.images[selectedImage]}
            style={styles.mainImage}
            resizeMode="contain"
          />

          {product.images.length > 1 && (
            <ScrollView horizontal style={styles.thumbnailContainer} showsHorizontalScrollIndicator={false}>
              {product.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.selectedThumbnail,
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Información del producto */}
        <View style={styles.contentContainer}>
          {/* Título y marca */}
          <View style={styles.titleContainer}>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.title}>{product.name}</Text>
          </View>

          {/* Precio */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${parseFloat(product.priceRetail).toLocaleString('es-AR')}
            </Text>
            <View style={styles.stockBadge}>
              <Ionicons
                name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={product.stock > 0 ? '#4CAF50' : '#FF3B30'}
              />
              <Text style={[
                styles.stockText,
                { color: product.stock > 0 ? '#4CAF50' : '#FF3B30' }
              ]}>
                {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
              </Text>
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{product.description || 'Sin descripción disponible'}</Text>
          </View>

          {/* Información del producto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Producto</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SKU:</Text>
              <Text style={styles.infoValue}>{product.sku || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código de barras:</Text>
              <Text style={styles.infoValue}>{product.barcode || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoría:</Text>
              <Text style={styles.infoValue}>{product.category?.name || 'N/A'}</Text>
            </View>
          </View>

          {/* Información de la tienda */}
          {product.shop && (
            <TouchableOpacity
              style={styles.shopContainer}
              onPress={() => navigation.navigate('ShopDetail', { shopId: product.shop.id })}
            >
              <View style={styles.shopInfo}>
                <ImageWithFallback
                  uri={product.shop.logo}
                  style={styles.shopLogo}
                />
                <View style={styles.shopDetails}>
                  <Text style={styles.shopName}>{product.shop.name}</Text>
                  <Text style={styles.shopType}>
                    {product.shop.type === 'retailer' ? 'Minorista' : 'Mayorista'}
                  </Text>
                  <Text style={styles.shopAddress}>{product.shop.address}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactShop}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addButton,
            (product.stock === 0 || addingToCart) && styles.disabledButton
          ]}
          onPress={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
        >
          {addingToCart ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.addButtonText}>Agregando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Agregar al Carrito</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  imageContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
  },
  mainImage: {
    width: width,
    height: 300,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  brand: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  shopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  shopType: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  shopAddress: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ProductDetailScreen;

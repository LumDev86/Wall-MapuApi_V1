import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/colors';
import { categoryService } from '../services/api';
import { Category } from '../types/product.types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const CatalogScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColors = (index: number) => {
    const colorPairs = [
      { start: COLORS.primary, end: '#B8E6D5' }, // Verde
      { start: '#FF8A65', end: '#FFCCBC' }, // Naranja/Coral
    ];
    return colorPairs[index % 2];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="location-outline" size={20} color="#fff" />
              <Text style={styles.locationText}>
                {user?.city && user?.province
                  ? `${user.city}, ${user.province}`
                  : user?.city || user?.province || 'Ubicación no configurada'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cartButton}>
              <Ionicons name="cart-outline" size={28} color="#fff" />
              {getTotalItems() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Busca productos, marcas...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Categorías</Text>

          <View style={styles.categoriesContainer}>
            {categories.map((category, index) => {
              const colors = getCategoryColors(index);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => {
                    navigation.navigate('ProductList', {
                      categoryId: category.id,
                      categoryName: category.name,
                    });
                  }}
                >
                  <LinearGradient
                    colors={[colors.start, colors.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.categoryGradient}
                  >
                    <Text style={styles.categoryName}>{category.name}</Text>
                    {category.icon && (
                      <View style={styles.categoryIconContainer}>
                        <ImageBackground
                          source={{ uri: category.icon }}
                          style={styles.categoryIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.mapSection}>
            <View style={styles.mapPreview}>
              <View style={[styles.mapMarker, { top: '20%', left: '30%' }]}>
                <Ionicons name="storefront" size={20} color="#fff" />
              </View>
              <View style={[styles.mapMarker, { top: '40%', left: '60%' }]}>
                <Ionicons name="storefront" size={20} color="#fff" />
              </View>
              <View style={[styles.mapMarker, { top: '60%', left: '40%' }]}>
                <Ionicons name="storefront" size={20} color="#fff" />
              </View>
              <View style={[styles.mapMarker, { top: '50%', left: '70%' }]}>
                <Ionicons name="storefront" size={20} color="#fff" />
              </View>
              <View style={[styles.mapMarker, { top: '35%', left: '20%' }]}>
                <Ionicons name="storefront" size={20} color="#fff" />
              </View>
              <View style={[styles.userMarker, { top: '45%', left: '50%' }]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            </View>

            <View style={styles.mapOverlay}>
              <Text style={styles.mapTitle}>Explora el Mapa</Text>
              <Text style={styles.mapSubtitle}>Encuentra pet shops cerca de ti</Text>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => {
                  navigation.navigate('HomeTabs', undefined);
                }}
              >
                <Text style={styles.mapButtonText}>Ver Mapa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: 38,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  content: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 70,
    height: 70,
  },
  mapSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#D4F1E8',
    borderRadius: 16,
    overflow: 'hidden',
    height: 400,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5F0',
    position: 'relative',
  },
  mapMarker: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    position: 'absolute',
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(212, 241, 232, 0.95)',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default CatalogScreen;

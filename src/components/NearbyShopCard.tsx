import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface NearbyShopCardProps {
  shop: Shop;
  onPress: () => void;
  distance?: string;
  productCount?: number;
  categories?: string[];
}

export const NearbyShopCard: React.FC<NearbyShopCardProps> = ({
  shop,
  onPress,
  distance = '0.5Km',
  productCount = 200,
  categories = ['Vacas', 'Gatos', 'Perros'],
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Image
          source={{ uri: shop.logo }}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {shop.name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.distance}>{distance}</Text>
        </View>

        <Text style={styles.productCount}>+{productCount} Productos</Text>

        <View style={styles.categoriesRow}>
          {categories.slice(0, 3).map((category, index) => (
            <View key={index} style={styles.categoryBadge}>
              <Ionicons name="paw-outline" size={14} color={COLORS.primary} />
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 60,
    height: 60,
  },
  content: {
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'left',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 13,
    color: '#666',
  },
  productCount: {
    fontSize: 13,
    color: '#999',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

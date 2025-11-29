import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import { Shop } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface ShopCardProps {
  shop: Shop;
  onPress: () => void;
  distance?: string;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onPress, distance }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: shop.logo }}
        style={styles.logo}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {shop.address}, {shop.city}
        </Text>
        <View style={styles.footer}>
          {distance && <Text style={styles.distance}>{distance}</Text>}
          {shop.isOpenNow && (
            <View style={styles.openBadge}>
              <Text style={styles.openText}>Abierto</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.ratingContainer}>
        <Text style={styles.rating}>★ 4.5</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    width: 280,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  openBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  ratingContainer: {
    justifyContent: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '600',
  },
});

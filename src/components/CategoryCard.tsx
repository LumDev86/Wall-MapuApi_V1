import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import { Category } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: category.icon }} style={styles.icon} />
      <Text style={styles.name}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
    marginRight: 12,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

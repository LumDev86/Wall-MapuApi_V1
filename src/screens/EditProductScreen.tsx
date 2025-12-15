import React, { useEffect, useState } from 'react';
import { MainStackNavigationProp } from '../types/navigation.types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productService, categoryService } from '../services/api';
import { Product, Category, UpdateProductRequest, ImageFile } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface EditProductScreenProps {
  navigation: MainStackNavigationProp<any>;
  route: {
    params: {
      productId: string;
    };
  };
}

interface FormData {
  name: string;
  description: string;
  priceRetail: string;
  priceWholesale: string;
  stock: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string;
}

interface FormErrors {
  name?: string;
  priceRetail?: string;
  stock?: string;
  categoryId?: string;
}

const EditProductScreen: React.FC<EditProductScreenProps> = ({ navigation, route }) => {
  const { productId } = route.params;

  // States
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    priceRetail: '',
    priceWholesale: '',
    stock: '',
    sku: '',
    barcode: '',
    brand: '',
    categoryId: '',
  });

  // Images
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<ImageFile[]>([]);

  // Errors
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchData();
    requestPermissions();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productResponse, categoriesResponse] = await Promise.all([
        productService.getById(productId),
        categoryService.getAll(),
      ]);

      setProduct(productResponse);
      setCategories(categoriesResponse.categories);

      // Populate form with existing data
      setFormData({
        name: productResponse.name,
        description: productResponse.description || '',
        priceRetail: productResponse.priceRetail,
        priceWholesale: productResponse.priceWholesale || '',
        stock: productResponse.stock.toString(),
        sku: productResponse.sku || '',
        barcode: productResponse.barcode || '',
        brand: productResponse.brand || '',
        categoryId: productResponse.categoryId,
      });

      setExistingImages(productResponse.images || []);
    } catch (error: any) {
      console.error('Error fetching product data:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para agregar imágenes');
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro de que deseas eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
            setImagesToRemove((prev) => [...prev, imageUrl]);
          },
        },
      ]
    );
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImageFiles: ImageFile[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `product_new_${Date.now()}_${index}.jpg`,
        }));
        setNewImages((prev) => [...prev, ...newImageFiles]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.priceRetail || parseFloat(formData.priceRetail) <= 0) {
      newErrors.priceRetail = 'El precio debe ser mayor a 0';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Debes seleccionar una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores del formulario');
      return;
    }

    try {
      setUpdating(true);

      const updateData: UpdateProductRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        priceRetail: parseFloat(formData.priceRetail),
        priceWholesale: formData.priceWholesale ? parseFloat(formData.priceWholesale) : undefined,
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        categoryId: formData.categoryId,
      };

      // Add new images if any
      if (newImages.length > 0) {
        updateData.images = newImages;
      }

      // Pass shopId to organize images in Supabase Storage
      await productService.update(productId, updateData, product?.shopId);

      Alert.alert(
        'Éxito',
        'Producto actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo actualizar el producto';
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Producto',
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await productService.delete(productId);

      Alert.alert(
        'Éxito',
        'Producto eliminado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo eliminar el producto';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Seleccionar categoría';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={updating || deleting}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Producto</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imágenes Actuales</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
              {existingImages.map((imageUrl, index) => (
                <View key={`existing-${index}`} style={styles.imageContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveExistingImage(imageUrl)}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* New Images */}
        {newImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nuevas Imágenes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
              {newImages.map((image, index) => (
                <View key={`new-${index}`} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveNewImage(index)}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add Images Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addImagesButton} onPress={handlePickImages}>
            <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            <Text style={styles.addImagesButtonText}>Agregar Imágenes</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Producto</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Ej: Alimento para perros Premium"
              placeholderTextColor={COLORS.placeholder}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe el producto..."
              placeholderTextColor={COLORS.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Price Retail */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio Minorista *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.priceInput, errors.priceRetail && styles.inputError]}
                value={formData.priceRetail}
                onChangeText={(value) => handleInputChange('priceRetail', value)}
                placeholder="0.00"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
            {errors.priceRetail && <Text style={styles.errorText}>{errors.priceRetail}</Text>}
          </View>

          {/* Price Wholesale */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio Mayorista</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={formData.priceWholesale}
                onChangeText={(value) => handleInputChange('priceWholesale', value)}
                placeholder="0.00"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Stock */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={[styles.input, errors.stock && styles.inputError]}
              value={formData.stock}
              onChangeText={(value) => handleInputChange('stock', value)}
              placeholder="0"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="number-pad"
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
          </View>

          {/* SKU */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU</Text>
            <TextInput
              style={styles.input}
              value={formData.sku}
              onChangeText={(value) => handleInputChange('sku', value)}
              placeholder="Código interno"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          {/* Barcode */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Barras</Text>
            <TextInput
              style={styles.input}
              value={formData.barcode}
              onChangeText={(value) => handleInputChange('barcode', value)}
              placeholder="Código de barras"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="number-pad"
            />
          </View>

          {/* Brand */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marca</Text>
            <TextInput
              style={styles.input}
              value={formData.brand}
              onChangeText={(value) => handleInputChange('brand', value)}
              placeholder="Marca del producto"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <TouchableOpacity
              style={[styles.picker, errors.categoryId && styles.inputError]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[styles.pickerText, !formData.categoryId && styles.pickerPlaceholder]}>
                {getCategoryName(formData.categoryId)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
            </TouchableOpacity>
            {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
          </View>

          {/* Category Picker */}
          {showCategoryPicker && (
            <View style={styles.categoryList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    category.id === formData.categoryId && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    handleInputChange('categoryId', category.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      category.id === formData.categoryId && styles.categoryItemTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                  {category.id === formData.categoryId && (
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={updating || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                <Text style={styles.deleteButtonText}>Eliminar Producto</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (updating || deleting) && styles.saveButtonDisabled]}
            onPress={handleUpdate}
            disabled={updating || deleting}
          >
            {updating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  imagesScrollView: {
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
  },
  addImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addImagesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.text,
  },
  pickerPlaceholder: {
    color: COLORS.placeholder,
  },
  categoryList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 250,
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  categoryItemTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
});

export default EditProductScreen;

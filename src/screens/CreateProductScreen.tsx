import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productService, categoryService } from '../services/api';
import { Category, ImageFile } from '../types/product.types';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

interface CreateProductScreenProps {
  navigation: any;
  route: any;
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

const CreateProductScreen: React.FC<CreateProductScreenProps> = ({ navigation, route }) => {
  const { shopId } = route.params;

  // Form state
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

  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    fetchCategories();
    requestMediaLibraryPermissions();
  }, []);

  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permisos para acceder a tus fotos.'
        );
      }
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryService.getAll();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.slice(0, 5 - images.length);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const formatCurrency = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    return numericValue;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.priceRetail.trim()) {
      newErrors.priceRetail = 'El precio minorista es requerido';
    } else if (isNaN(parseFloat(formData.priceRetail)) || parseFloat(formData.priceRetail) <= 0) {
      newErrors.priceRetail = 'Ingrese un precio válido';
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'El stock es requerido';
    } else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Ingrese un stock válido';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);

      // Prepare images for submission
      const imageFiles: ImageFile[] = images.map((img, index) => ({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || `product_${index}.jpg`,
      }));

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        priceRetail: parseFloat(formData.priceRetail),
        priceWholesale: formData.priceWholesale ? parseFloat(formData.priceWholesale) : undefined,
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        categoryId: formData.categoryId,
        images: imageFiles.length > 0 ? imageFiles : undefined,
      };

      const newProduct = await productService.create(shopId, productData);

      console.log('✅ Producto creado exitosamente:', newProduct);
      console.log('📋 ID del producto:', newProduct.id);
      console.log('📋 Estructura completa:', JSON.stringify(newProduct, null, 2));

      // El backend puede devolver el id en diferentes campos
      const productId = newProduct.id || (newProduct as any)._id || (newProduct as any).productId;

      console.log('🔍 Product ID extraído:', productId);

      if (!productId) {
        console.error('❌ PROBLEMA: El backend no devolvió ningún ID');
        console.error('📋 Respuesta completa:', newProduct);
        console.error('📋 Campos disponibles:', Object.keys(newProduct));

        // Si el backend no devuelve ID, volvemos a la pantalla anterior
        // y el producto aparecerá en el listado cuando se recargue
        Alert.alert(
          'Éxito',
          'Producto creado exitosamente. Verás el producto en el listado de tu tienda.',
          [
            {
              text: 'Ver Mis Productos',
              onPress: () => {
                // Volver y recargar la lista
                navigation.goBack();
              },
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Éxito',
        'Producto creado exitosamente',
        [
          {
            text: 'Ver Producto',
            onPress: () => {
              console.log('🔍 Navegando a ProductDetail con ID:', productId);
              navigation.replace('ProductDetail', { productId });
            },
          },
          {
            text: 'Volver',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 'No se pudo crear el producto';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Seleccionar categoría';
  };

  const renderCategoryPicker = () => {
    if (!showCategoryPicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Seleccionar Categoría</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.pickerItem,
                  formData.categoryId === category.id && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  handleInputChange('categoryId', category.id);
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    formData.categoryId === category.id && styles.pickerItemTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
                {formData.categoryId === category.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar Producto</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imágenes del Producto</Text>
          <Text style={styles.sectionSubtitle}>Máximo 5 imágenes</Text>

          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: image.uri }} style={styles.imagePreviewImg} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                <Text style={styles.addImageText}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Nombre del Producto <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ej: Alimento para perros"
              placeholderTextColor={COLORS.placeholder}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu producto..."
              placeholderTextColor={COLORS.placeholder}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Marca</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Royal Canin"
              placeholderTextColor={COLORS.placeholder}
              value={formData.brand}
              onChangeText={(value) => handleInputChange('brand', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Categoría <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.categoryId && styles.inputError]}
              onPress={() => setShowCategoryPicker(true)}
              disabled={categoriesLoading}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.categoryId && styles.pickerButtonPlaceholder,
                ]}
              >
                {categoriesLoading ? 'Cargando...' : getCategoryName(formData.categoryId)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
            </TouchableOpacity>
            {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
          </View>
        </View>

        {/* Pricing & Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Precios e Inventario</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                Precio Minorista <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.priceInput, errors.priceRetail && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.priceRetail}
                  onChangeText={(value) => handleInputChange('priceRetail', formatCurrency(value))}
                  keyboardType="numeric"
                />
              </View>
              {errors.priceRetail && <Text style={styles.errorText}>{errors.priceRetail}</Text>}
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Precio Mayorista</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.priceWholesale}
                  onChangeText={(value) => handleInputChange('priceWholesale', formatCurrency(value))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Stock Disponible <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.stock && styles.inputError]}
              placeholder="0"
              placeholderTextColor={COLORS.placeholder}
              value={formData.stock}
              onChangeText={(value) => handleInputChange('stock', value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>SKU (Código Interno)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: PRD-001"
              placeholderTextColor={COLORS.placeholder}
              value={formData.sku}
              onChangeText={(value) => handleInputChange('sku', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código de Barras</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 7891234567890"
              placeholderTextColor={COLORS.placeholder}
              value={formData.barcode}
              onChangeText={(value) => handleInputChange('barcode', value)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Crear Producto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Picker Modal */}
      {renderCategoryPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreview: {
    width: (width - 64) / 2,
    height: (width - 64) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  addImageButton: {
    width: (width - 64) / 2,
    height: (width - 64) / 2,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  pickerButtonPlaceholder: {
    color: COLORS.placeholder,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
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
    fontSize: 16,
    color: COLORS.text,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  bottomPadding: {
    height: 40,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemSelected: {
    backgroundColor: '#F0F9F5',
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default CreateProductScreen;

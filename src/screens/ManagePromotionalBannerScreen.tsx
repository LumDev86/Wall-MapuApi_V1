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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MainStackNavigationProp } from '../types/navigation.types';
import { promotionalBannerService } from '../services/api';
import { uploadImage } from '../services/supabase';
import { COLORS } from '../constants/colors';

interface ManagePromotionalBannerScreenProps {
  navigation: MainStackNavigationProp<any>;
  route: any;
}

const ManagePromotionalBannerScreen: React.FC<ManagePromotionalBannerScreenProps> = ({
  navigation,
  route,
}) => {
  const { shop } = route.params;

  const [title, setTitle] = useState(shop.promotionalBanner?.title || '');
  const [subtitle, setSubtitle] = useState(shop.promotionalBanner?.subtitle || '');
  const [imageUri, setImageUri] = useState<string | null>(
    shop.promotionalBanner?.imageUrl || null
  );
  const [isActive, setIsActive] = useState(shop.promotionalBanner?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Necesitamos permisos para acceder a tus fotos.'
      );
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (!subtitle.trim()) {
      Alert.alert('Error', 'El subtítulo es requerido');
      return;
    }

    if (!imageUri) {
      Alert.alert('Error', 'Debes seleccionar una imagen para el banner');
      return;
    }

    try {
      setLoading(true);

      let finalImageUrl = imageUri;

      // Si la imagen cambió, subirla a Supabase
      if (imageChanged && !imageUri.startsWith('http')) {
        console.log('📸 Subiendo imagen del banner a Supabase...');
        finalImageUrl = await uploadImage(imageUri, 'shop-banner', { shopId: shop.id });
        console.log('✅ Imagen subida:', finalImageUrl);
      }

      // Guardar banner en el backend
      console.log('💾 Guardando banner promocional...');
      const response = await promotionalBannerService.update(shop.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: finalImageUrl,
        isActive,
      });

      console.log('✅ Banner guardado exitosamente');

      Alert.alert(
        'Éxito',
        'Banner promocional guardado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error saving banner:', error);
      console.error('❌ Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'No se pudo guardar el banner';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Banner Promocional</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            El banner promocional aparecerá en el carousel principal de la app para todos los
            usuarios.
          </Text>
        </View>

        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagen del Banner</Text>
          <Text style={styles.sectionSubtitle}>
            Recomendado: 1200x675px (Relación 16:9)
          </Text>

          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.imagePreviewImg} />
              <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color={COLORS.white} />
                <Text style={styles.changeImageText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={48} color={COLORS.primary} />
              <Text style={styles.addImageText}>Seleccionar Imagen</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Título <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: ¡Ofertas de Verano!"
            placeholderTextColor={COLORS.placeholder}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        {/* Subtitle */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Subtítulo <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej: Hasta 30% de descuento en productos seleccionados"
            placeholderTextColor={COLORS.placeholder}
            value={subtitle}
            onChangeText={setSubtitle}
            multiline
            numberOfLines={3}
            maxLength={100}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{subtitle.length}/100</Text>
        </View>

        {/* Active Switch */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>Banner Activo</Text>
              <Text style={styles.switchDescription}>
                {isActive
                  ? 'El banner se mostrará en el carousel principal'
                  : 'El banner no se mostrará'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#767577', true: COLORS.primary + '80' }}
              thumbColor={isActive ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Guardar Banner</Text>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
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
  imagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  changeImageText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  addImageButton: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  addImageText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
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
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    padding: 16,
    borderRadius: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default ManagePromotionalBannerScreen;

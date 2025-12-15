/**
 * Supabase Storage Service
 *
 * Este servicio sube imágenes directamente a Supabase Storage usando fetch
 * en lugar del SDK oficial para evitar problemas de compatibilidad con React Native.
 */

import { env } from '../utils/env';
// Supabase configuration
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

// Bucket name - must match the bucket created in Supabase dashboard
const BUCKET_NAME = 'Wall-MapuApi';

/**
 * Storage folder structure:
 *
 * Wall-MapuApi/
 * ├── shops/
 * │   ├── logos/{shopId}/logo_{timestamp}.{ext}
 * │   └── banners/{shopId}/banner_{timestamp}.{ext}
 * ├── products/
 * │   └── {shopId}/{productId}/image_{index}_{timestamp}.{ext}
 * └── categories/
 *     └── {categoryId}/icon_{timestamp}.{ext}
 */

export type ImageType = 'shop-logo' | 'shop-banner' | 'product' | 'category';

interface UploadOptions {
  shopId?: string;
  productId?: string;
  categoryId?: string;
  index?: number;
}

/**
 * Generate storage path based on image type
 */
const generateStoragePath = (
  type: ImageType,
  fileName: string,
  options: UploadOptions
): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';

  switch (type) {
    case 'shop-logo':
      if (!options.shopId) throw new Error('shopId is required for shop-logo');
      return `shops/logos/${options.shopId}/logo_${timestamp}.${extension}`;

    case 'shop-banner':
      if (!options.shopId) throw new Error('shopId is required for shop-banner');
      return `shops/banners/${options.shopId}/banner_${timestamp}.${extension}`;

    case 'product':
      if (!options.shopId) throw new Error('shopId is required for product');
      const productFolder = options.productId || 'new';
      const imageIndex = options.index ?? 0;
      return `products/${options.shopId}/${productFolder}/image_${imageIndex}_${timestamp}.${extension}`;

    case 'category':
      if (!options.categoryId) throw new Error('categoryId is required for category');
      return `categories/${options.categoryId}/icon_${timestamp}.${extension}`;

    default:
      throw new Error(`Unknown image type: ${type}`);
  }
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return mimeTypes[extension || ''] || 'image/jpeg';
};

/**
 * Upload a single image to Supabase Storage using fetch API (React Native compatible)
 * @param uri - Local file URI (from expo-image-picker)
 * @param type - Type of image (determines folder structure)
 * @param options - Additional options like shopId, productId
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (
  uri: string,
  type: ImageType,
  options: UploadOptions
): Promise<string> => {
  try {
    console.log('=== SUPABASE UPLOAD START ===');
    console.log('Supabase URL:', SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET');
    console.log('Supabase Key:', SUPABASE_ANON_KEY ? 'SET (length: ' + SUPABASE_ANON_KEY.length + ')' : 'NOT SET');
    console.log('URI:', uri);
    console.log('Type:', type);
    console.log('Options:', JSON.stringify(options));

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase no está configurado. Verifica las variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }

    // Generate file name from URI
    const fileName = uri.split('/').pop() || `image_${Date.now()}.jpg`;
    console.log('📝 File name:', fileName);

    // Generate storage path
    const storagePath = generateStoragePath(type, fileName, options);
    console.log('📁 Storage path:', storagePath);

    // Get MIME type
    const contentType = getMimeType(fileName);
    console.log('📄 Content type:', contentType);

    // Fetch the image from local URI
    console.log('📥 Fetching image from local URI...');
    const imageResponse = await fetch(uri);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch local image: ${imageResponse.status}`);
    }

    const blob = await imageResponse.blob();
    console.log('📦 Blob size:', blob.size, 'bytes');

    if (blob.size === 0) {
      throw new Error('Image file is empty');
    }

    // Build Supabase Storage API URL
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`;
    console.log('🌐 Upload URL:', uploadUrl);
    console.log('🪣 Bucket name:', BUCKET_NAME);

    // Upload to Supabase using fetch
    console.log('⬆️ Uploading to Supabase...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: blob,
    });

    console.log('📊 Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload error response:', errorText);
      console.error('❌ Status code:', uploadResponse.status);

      // Parse error for better messages
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error === 'Bucket not found') {
          throw new Error(`El bucket "${BUCKET_NAME}" no existe. Créalo en el dashboard de Supabase.`);
        }
        if (errorJson.statusCode === '403' || errorJson.error?.includes('policy')) {
          throw new Error('No tienes permisos para subir archivos. Configura las políticas RLS del bucket en Supabase.');
        }
        throw new Error(errorJson.message || errorJson.error || 'Error al subir imagen');
      } catch (parseError) {
        if (uploadResponse.status === 403) {
          throw new Error('Acceso denegado. Verifica las políticas del bucket en Supabase Storage.');
        }
        if (uploadResponse.status === 404) {
          throw new Error(`Bucket "${BUCKET_NAME}" no encontrado. Créalo en Supabase.`);
        }
        throw new Error(`Error ${uploadResponse.status}: ${errorText}`);
      }
    }

    const uploadData = await uploadResponse.json();
    console.log('Upload successful:', JSON.stringify(uploadData));

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;

    console.log('=== SUPABASE UPLOAD SUCCESS ===');
    console.log('Public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('❌❌❌ SUPABASE UPLOAD ERROR ❌❌❌');
    console.error('Error completo:', JSON.stringify(error, null, 2));
    console.error('Error message:', error?.message || 'No message');
    console.error('Error name:', error?.name || 'No name');
    console.error('Error stack:', error?.stack || 'No stack');
    throw error;
  }
};

/**
 * Upload multiple images to Supabase Storage
 * @param images - Array of image URIs
 * @param type - Type of images
 * @param options - Additional options
 * @returns Array of public URLs
 */
export const uploadMultipleImages = async (
  images: Array<{ uri: string; name?: string }>,
  type: ImageType,
  options: UploadOptions
): Promise<string[]> => {
  console.log(`Uploading ${images.length} images...`);

  const urls: string[] = [];

  // Upload sequentially to avoid overwhelming the connection
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(`Uploading image ${i + 1}/${images.length}...`);
    const url = await uploadImage(image.uri, type, { ...options, index: i });
    urls.push(url);
  }

  return urls;
};

/**
 * Delete an image from Supabase Storage
 * @param publicUrl - Public URL of the image to delete
 */
export const deleteImage = async (publicUrl: string): Promise<void> => {
  try {
    // Extract path from public URL
    const pathMatch = publicUrl.match(new RegExp(`${BUCKET_NAME}/(.+)$`));
    if (!pathMatch) {
      console.warn('Invalid image URL, cannot extract path');
      return;
    }

    const path = pathMatch[1];
    const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting image:', errorText);
      throw new Error(`Failed to delete image: ${response.status}`);
    }

    console.log('Image deleted successfully:', path);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Supabase Storage
 * @param publicUrls - Array of public URLs to delete
 */
export const deleteMultipleImages = async (publicUrls: string[]): Promise<void> => {
  for (const url of publicUrls) {
    await deleteImage(url);
  }
};

/**
 * Generate a temporary upload ID for new entities
 * This is used when creating new shops/products before they have an ID
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  generateTempId,
};

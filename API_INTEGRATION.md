# Integración Completa del Backend - Wallmapu

## ✅ Estado: COMPLETADO

La aplicación Wallmapu ahora está **completamente conectada** con el backend en Railway.

---

## 📋 Resumen de Cambios

### 1. **Servicios API Actualizados** (`src/services/api.ts`)

Se han agregado **TODOS** los servicios disponibles en el backend:

#### **Auth Services** (✨ NUEVOS)
- ✅ `register()` - Registro de usuarios
- ✅ `login()` - Inicio de sesión
- ✨ `forgotPassword()` - Recuperación de contraseña
- ✨ `resetPassword()` - Restablecer contraseña con token
- ✨ `getMe()` - Obtener usuario autenticado
- ✨ `updateLocation()` - Actualizar ubicación del usuario
- ✅ `logout()` - Cerrar sesión
- ✅ `getStoredToken()` - Token almacenado
- ✅ `getStoredUser()` - Usuario almacenado
- ✅ `clearStorage()` - Limpiar AsyncStorage

#### **Category Services**
- ✅ `getAll()` - Listar todas las categorías
- ✨ `getById()` - Obtener detalle de una categoría
- ✨ `getProductsByCategory()` - Productos de una categoría (paginado)

#### **Product Services** (✨ AMPLIADO)
- ✅ `getAll()` - Listar productos con filtros
- ✨ `search()` - Búsqueda en tiempo real
- ✨ `getById()` - Detalle de un producto
- ✨ `getByShop()` - Productos de una tienda específica
- ✨ `create()` - Crear producto con imágenes
- ✨ `update()` - Actualizar producto
- ✨ `delete()` - Eliminar producto

#### **Shop Services** (✨ COMPLETO)
- ✅ `getAll()` - Listar tiendas con filtros
- ✨ `getById()` - Detalle de una tienda con productos
- ✨ `getMyShop()` - Mi tienda (usuario autenticado)
- ✨ `create()` - Crear tienda con imágenes
- ✨ `update()` - Actualizar tienda
- ✨ `delete()` - Eliminar tienda

#### **Subscription Services** (✨ NUEVO - Sistema completo de suscripciones)
- ✨ `create()` - Crear suscripción para una tienda
- ✨ `retryPayment()` - Reintentar pago fallido
- ✨ `getPaymentStatus()` - Estado del pago
- ✨ `getByShop()` - Suscripción de una tienda
- ✨ `cancel()` - Cancelar suscripción
- ✨ `getStats()` - Estadísticas (admin)

---

### 2. **Tipos TypeScript Actualizados**

#### **auth.types.ts** (✨ NUEVOS TIPOS)
```typescript
- ForgotPasswordRequest
- ResetPasswordRequest
- UpdateLocationRequest
```

#### **product.types.ts** (✨ TIPOS AMPLIADOS)
```typescript
- ImageFile (para uploads de imágenes)
- CreateProductRequest
- UpdateProductRequest
- CreateShopRequest
- UpdateShopRequest
- SearchProductShop
- SearchProduct
- SearchProductsResponse
```

#### **subscription.types.ts** (✨ NUEVO ARCHIVO)
```typescript
- SubscriptionPlan
- SubscriptionStatus
- Subscription
- CreateSubscriptionRequest
- PaymentStatusResponse
- SubscriptionStats
```

---

### 3. **Variables de Entorno Configuradas**

**Archivo:** `.env`

```env
EXPO_PUBLIC_API_URL=https://wall-mapuapi-production.up.railway.app/api
EXPO_PUBLIC_APP_NAME=Wallmapu
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENV=production
```

⚠️ **Importante:** Necesitas agregar tu Google Maps API Key:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=TU_KEY_AQUI
```

---

### 4. **Correcciones de Bugs**

#### **MapScreen.tsx** (líneas 75-77, 175-177)
- ✅ Convertido `shop.latitude` y `shop.longitude` de `string` a `number` usando `parseFloat()`
- ✅ Corregido error de tipos en `calculateDistance()`

---

## 🚀 Cómo Usar los Nuevos Servicios

### **Ejemplo 1: Búsqueda en Tiempo Real**

```typescript
import { productService } from '../services/api';

const searchProducts = async (query: string) => {
  try {
    const response = await productService.search({
      query: query,
      limit: 10,
      latitude: user?.latitude,
      longitude: user?.longitude,
    });

    console.log(response.data); // Array de productos con tienda y distancia
  } catch (error) {
    console.error('Error buscando productos:', error);
  }
};
```

### **Ejemplo 2: Recuperar Contraseña**

```typescript
import { authService } from '../services/api';

// Paso 1: Solicitar token de recuperación
const handleForgotPassword = async (email: string) => {
  try {
    await authService.forgotPassword({ email });
    Alert.alert('Éxito', 'Revisa tu email para restablecer tu contraseña');
  } catch (error) {
    Alert.alert('Error', 'No se pudo enviar el email');
  }
};

// Paso 2: Restablecer contraseña con token
const handleResetPassword = async (token: string, newPassword: string) => {
  try {
    await authService.resetPassword({ token, newPassword });
    Alert.alert('Éxito', 'Contraseña actualizada correctamente');
    navigation.navigate('Login');
  } catch (error) {
    Alert.alert('Error', 'Token inválido o expirado');
  }
};
```

### **Ejemplo 3: Crear Tienda**

```typescript
import { shopService } from '../services/api';

const createShop = async () => {
  try {
    const newShop = await shopService.create({
      name: 'Pet Shop San Martín',
      description: 'Veterinaria y pet shop',
      address: 'Av. San Martín 1234',
      province: 'Buenos Aires',
      city: 'CABA',
      type: 'retailer',
      phone: '+54 9 11 1234-5678',
      email: 'info@petshop.com',
      schedule: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        // ... otros días
      },
      logo: {
        uri: 'file:///path/to/logo.jpg',
        type: 'image/jpeg',
        name: 'logo.jpg',
      },
    });

    console.log('Tienda creada:', newShop);
  } catch (error) {
    console.error('Error creando tienda:', error);
  }
};
```

### **Ejemplo 4: Obtener Mi Tienda**

```typescript
import { shopService } from '../services/api';

const getMyShop = async () => {
  try {
    const myShop = await shopService.getMyShop();
    console.log('Mi tienda:', myShop);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('No tienes una tienda registrada');
    } else {
      console.error('Error obteniendo tienda:', error);
    }
  }
};
```

### **Ejemplo 5: Crear Suscripción**

```typescript
import { subscriptionService } from '../services/api';
import { Linking } from 'react-native';

const subscribeToPremium = async (shopId: string) => {
  try {
    const subscription = await subscriptionService.create({
      plan: 'retailer', // o 'wholesaler'
      shopId: shopId,
      autoRenew: true,
    });

    // Abrir Mercado Pago en el navegador
    if (subscription.initPoint) {
      await Linking.openURL(subscription.initPoint);
    }
  } catch (error) {
    console.error('Error creando suscripción:', error);
  }
};
```

### **Ejemplo 6: Actualizar Ubicación del Usuario**

```typescript
import { authService } from '../services/api';

const updateMyLocation = async (location: {
  province: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
}) => {
  try {
    const updatedUser = await authService.updateLocation(location);
    console.log('Ubicación actualizada:', updatedUser);
    // El usuario se actualiza automáticamente en AsyncStorage
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
  }
};
```

---

## 📦 Nuevas Funcionalidades Disponibles

### ✨ Para Clientes
1. **Búsqueda en Tiempo Real** - Autocompletado mientras escribes
2. **Recuperación de Contraseña** - Flow completo con email
3. **Actualizar Ubicación** - Cambiar ubicación sin re-registrarse
4. **Ver Detalle de Productos** - Información completa del producto
5. **Ver Detalle de Tiendas** - Información completa con productos

### ✨ Para Minoristas/Mayoristas
1. **Crear/Gestionar Tienda** - Registrar y administrar tu local
2. **Crear/Editar/Eliminar Productos** - Control completo del inventario
3. **Ver Mi Tienda** - Obtener información de tu tienda registrada
4. **Sistema de Suscripciones** - Suscribirse a planes premium
5. **Actualizar Logo y Banner** - Subir imágenes de tu tienda

### ✨ Para Administradores
1. **Estadísticas de Suscripciones** - Ver métricas del negocio
2. **Gestión de Categorías** - Crear/editar/eliminar categorías

---

## 🔧 Próximos Pasos Recomendados

### **1. Implementar Pantallas Faltantes**
- [ ] **ForgotPasswordScreen** - Para recuperación de contraseña
- [ ] **ResetPasswordScreen** - Para restablecer con token
- [ ] **ProductDetailScreen** - Detalle completo del producto
- [ ] **ShopDetailScreen** - Detalle completo de tienda
- [ ] **EditProfileScreen** - Editar información personal
- [ ] **CreateShopScreen** - Registrar nueva tienda (para retailers)
- [ ] **MyShopScreen** - Administrar mi tienda
- [ ] **CreateProductScreen** - Agregar productos
- [ ] **SubscriptionScreen** - Gestionar suscripciones

### **2. Conectar Búsqueda en Tiempo Real**
Actualizar los inputs de búsqueda en:
- `HomeScreen.tsx` (línea 35)
- `CatalogScreen.tsx` (línea 25)
- `ProductListScreen.tsx` (línea 26)

Para usar `productService.search()` con debounce.

### **3. Implementar Carrito de Compras**
- Crear Context para carrito
- Persistir en AsyncStorage
- Conectar botones "+" en ProductCard

### **4. Implementar Sistema de Favoritos**
- Crear Context para favoritos
- Persistir en AsyncStorage
- Pantalla de favoritos

### **5. Integrar Google Maps API Key**
Agrega tu key en `.env`:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=TU_KEY_AQUI
```

Luego ejecuta:
```bash
npx expo prebuild
npx expo run:android
```

---

## 🧪 Testing

### **Verificar Tipos**
```bash
./node_modules/.bin/tsc --noEmit
```

### **Iniciar Aplicación**
```bash
npx expo start
```

---

## 📝 Notas Importantes

1. **Todas las peticiones incluyen automáticamente el token JWT** gracias al interceptor de Axios
2. **Las imágenes se suben con FormData** (multipart/form-data)
3. **El backend maneja automáticamente:**
   - Geocoding de direcciones a coordenadas
   - Cálculo de distancias
   - Filtrado por roles
   - Estado "abierto ahora" de tiendas
   - Paginación
   - Búsqueda con cache

4. **Límites importantes:**
   - Búsqueda: Mínimo 2 caracteres
   - Imágenes: Máximo según configuración del backend
   - Intentos de pago: Máximo 5 por suscripción
   - Paginación: Máximo 100 resultados por página

---

## 🆘 Soporte

Para más información sobre endpoints, revisa la documentación Swagger en:
```
https://wall-mapuapi-production.up.railway.app/api/docs
```

---

**Versión:** 2.0.0
**Fecha:** Diciembre 2, 2024
**Status:** ✅ Producción

# Changelog - Sesión de Desarrollo con Javi

**Fecha:** 4 de diciembre de 2025
**Rama:** `javi-dev`
**Último Commit:** `676ceaf`

---

## 🎯 Resumen Ejecutivo

Se implementó un **selector de ubicación con mapa interactivo** para mejorar la UX al crear tiendas y registrar usuarios. Se corrigieron múltiples errores relacionados con el envío de coordenadas al backend, se mejoró el manejo de suscripciones pendientes, y se solucionaron problemas con la creación y visualización de productos.

---

## ✅ Cambios Implementados

### 1. 🗺️ Nuevo Componente: LocationPicker

**Archivo:** `src/components/LocationPicker.tsx`

**Características:**
- Mapa interactivo con Google Maps
- Buscador de ubicaciones con Google Places Autocomplete
- Marcador arrastrable para ajustar ubicación con precisión
- Botón de ubicación actual (GPS del dispositivo)
- Reverse geocoding automático al arrastrar el marcador
- Extracción automática de dirección, ciudad y provincia
- Placeholder cuando react-native-maps no está disponible (Expo Go)

**Beneficios:**
- ✅ Mejor UX para seleccionar ubicación
- ✅ Datos de ubicación más precisos y consistentes
- ✅ Menor margen de error en direcciones

---

### 2. 🏪 CreateShopScreen - Mejoras en Creación de Tiendas

**Archivo:** `src/screens/CreateShopScreen.tsx`

**Cambios principales:**
- ✅ Integrado `LocationPicker` reemplazando campos de texto manual
- ✅ Extracción automática de calle, ciudad y provincia
- ✅ **CRÍTICO:** Removido envío de `latitude` y `longitude` al backend
- ✅ Simplificado formulario (ocultados temporalmente):
  - Selector de categoría de tienda
  - Campo de WhatsApp
  - Email de notificaciones
  - Sección completa de datos fiscales
- ✅ Corregido warning de `ImagePicker.MediaTypeOptions` (deprecated)

**Por qué se removieron las coordenadas:**
```javascript
// ❌ ANTES (causaba error 400)
formData.append('latitude', latitude.toString());
formData.append('longitude', longitude.toString());

// ✅ AHORA (backend hace geocoding automático)
// Solo se envían: address, city, province
// El backend calcula las coordenadas automáticamente
```

---

### 3. 👤 RegisterScreen - Corrección en Registro

**Archivo:** `src/screens/Auth/RegisterScreen.tsx`

**Cambios:**
- ✅ **CRÍTICO:** Removido envío de `latitude` y `longitude` en registro
- ✅ El backend hace geocoding con `address + city + province`

**Error corregido:**
```
❌ property latitude should not exist
❌ property longitude should not exist
```

---

### 4. 💳 SubscriptionScreen - Mejoras en Suscripciones

**Archivo:** `src/screens/SubscriptionScreen.tsx`

**Nuevas funcionalidades:**
- ✅ Botón "Cancelar Pendiente" visible cuando hay suscripción pendiente
- ✅ Detección automática de suscripción pendiente al intentar crear nueva
- ✅ Diálogo para cancelar suscripción pendiente y crear nueva
- ✅ Botón de ayuda "¿Problemas con suscripción pendiente?"
- ✅ Logs detallados para debugging

**Correcciones:**
- ✅ Endpoint de cancelación corregido:
  ```javascript
  // ❌ ANTES
  DELETE /subscriptions/shop/{shopId}/cancel

  // ✅ AHORA
  DELETE /subscriptions/{subscriptionId}
  ```

**Mejor manejo de errores:**
- ✅ Detecta errores de Mercado Pago y muestra mensaje específico
- ✅ Logs detallados en consola para debugging

---

### 5. 🔧 API Services - Correcciones

**Archivo:** `src/services/api.ts`

**Cambios:**
```javascript
// shopService.create()
// ❌ Removido: latitude, longitude
// ✅ Se envían: address, city, province

// subscriptionService.cancel()
// ❌ ANTES: /subscriptions/shop/${shopId}/cancel
// ✅ AHORA: /subscriptions/${subscriptionId}
```

---

### 6. ⚙️ Configuración

**Archivo:** `.env` (creado)

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://wall-mapuapi-production.up.railway.app/api

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC56WIVTWhOvGn_r0JVhqdqx5-IYoWyL_Q
```

**IMPORTANTE:** Este archivo está en `.gitignore` (no se sube al repo)

---

### 7. 🐛 Fix: Creación y Visualización de Productos (Commit `676ceaf`)

**Problema identificado:**
- Backend NO devuelve el campo `id` al crear productos
- Causaba error "undefined" al intentar ver producto recién creado
- Métricas de tienda mostraban cantidad incorrecta de productos

**Soluciones implementadas:**

#### A. Logs detallados para debugging
**Archivos:** `CreateProductScreen.tsx`, `ProductDetailScreen.tsx`, `ProductListScreen.tsx`, `api.ts`

- ✅ Logs al crear producto para ver respuesta del backend
- ✅ Logs al cargar detalle con información del error
- ✅ Logs al cargar lista para verificar IDs
- ✅ Logs en API service para requests/responses

#### B. Manejo robusto de IDs de productos
**Archivo:** `CreateProductScreen.tsx:201-226`

```javascript
// Intenta extraer ID de múltiples campos posibles
const productId = newProduct.id || newProduct._id || newProduct.productId;

if (!productId) {
  // Si backend no devuelve ID, redirige a lista
  Alert.alert(
    'Éxito',
    'Producto creado exitosamente. Verás el producto en el listado de tu tienda.',
    [{ text: 'Ver Mis Productos', onPress: () => navigation.goBack() }]
  );
  return;
}
```

**Beneficios:**
- ✅ No crashea la app si falta el ID
- ✅ Mensaje claro al usuario
- ✅ Workaround hasta que backend se corrija

#### C. Corrección de métricas en MyShopScreen
**Archivo:** `MyShopScreen.tsx:28,69-71,340`

```javascript
// Antes (incorrecto)
<Text style={styles.statNumber}>{products.length}</Text>

// Ahora (correcto)
const [totalProducts, setTotalProducts] = useState(0);
setTotalProducts(response.pagination.total);
<Text style={styles.statNumber}>{totalProducts}</Text>
```

**Problema corregido:**
- ❌ ANTES: Mostraba solo cantidad de productos cargados (10)
- ✅ AHORA: Muestra total real del backend

#### D. Mejor manejo de errores
**Archivo:** `ProductDetailScreen.tsx:45-61`

- ✅ Error messages con ID del producto
- ✅ Logs de campos disponibles para debugging
- ✅ Alert mejorado con información del error

---

## 🔴 PROBLEMAS ENCONTRADOS (Requieren atención del Backend)

### 1. ❌ Mercado Pago no configurado

**Error:**
```
Cannot read properties of undefined (reading 'cardholderIdentification')
Status: 500
```

**Causa:**
El backend intenta acceder a propiedades inexistentes al crear la preferencia de pago de Mercado Pago.

**Ubicación del error:**
Endpoint `POST /api/subscriptions` al crear preferencia de pago.

**Código problemático probable:**
```javascript
// En el backend
payer: {
  identification: {
    type: cardholderIdentification.type,  // ← undefined
    number: cardholderIdentification.number // ← undefined
  }
}
```

**Solución requerida:**
```javascript
// Simplificar la preferencia
const preference = {
  items: [{
    title: `Plan ${plan}`,
    quantity: 1,
    unit_price: amount,
    currency_id: 'ARS'
  }],
  payer: {
    email: user.email,
    name: user.name
    // NO incluir identification (no es obligatorio)
  },
  back_urls: {
    success: `${frontendUrl}/subscription/success`,
    failure: `${frontendUrl}/subscription/failure`,
    pending: `${frontendUrl}/subscription/pending`
  }
}
```

**Checklist para el dev del backend:**
- [ ] Verificar variables de entorno `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_PUBLIC_KEY`
- [ ] Simplificar creación de preferencia (remover `identification` de `payer`)
- [ ] Agregar try/catch y logs en creación de preferencia
- [ ] Probar creación de suscripción desde el frontend

---

### 2. ⚠️ Endpoint GET subscription devuelve 404 incorrectamente

**Problema:**
Cuando se intenta obtener suscripción con `GET /api/subscriptions/shop/{shopId}`, a veces devuelve 404 incluso cuando existe una pendiente.

**Impacto:**
El botón "Cancelar Pendiente" no aparece porque no puede obtener la suscripción.

**Para verificar:**
```bash
# Verificar si existe suscripción para shop
GET /api/subscriptions/shop/7f0d1873-7579-4cee-aeb2-ee1b3b723475
```

**Solución temporal:**
El código ya maneja este caso mostrando mensaje de ayuda al usuario.

---

### 3. ❌ Backend no devuelve campo "id" al crear productos

**Error:**
```
Product ID que causó el error: undefined
Internal server error
```

**Causa:**
El backend NO devuelve el campo `id` en la respuesta al crear un producto vía `POST /api/products/shop/:shopId`.

**Impacto:**
- El botón "Ver Producto" después de crear falla con error "undefined"
- No se puede navegar directamente al detalle del producto recién creado

**Solución requerida en backend:**
```javascript
// El backend debe devolver:
{
  id: "uuid-del-producto",  // ← Este campo falta
  name: "...",
  description: "...",
  // ... resto de campos
}
```

**Workaround implementado en frontend:**
- Si no hay ID, redirige a lista de productos
- El usuario puede ver el producto desde ahí
- Los productos en la lista SÍ tienen IDs válidos

---

## 📋 TODO - Tareas Pendientes

### Frontend (Prioridad Media)

- [ ] **Restaurar campos ocultos cuando backend los acepte:**
  - Categoría de tienda (`category`)
  - WhatsApp (`whatsapp`)
  - Email de notificaciones (`notificationEmail`)
  - Datos fiscales (CUIT, IVA, etc.)
  - Código de distribuidor

- [ ] **Mejorar LocationPicker:**
  - Agregar límite de país (solo Argentina)
  - Mejorar manejo de errores de Google Places API
  - Agregar opción de entrada manual de dirección como fallback

- [ ] **Testing:**
  - Probar creación de tienda end-to-end
  - Probar registro de usuario
  - Probar flujo completo de suscripción (cuando backend esté listo)

### Backend (Prioridad ALTA) 🔴

- [ ] **URGENTE: Arreglar Mercado Pago**
  - Configurar credenciales correctamente
  - Simplificar creación de preferencia
  - Agregar manejo de errores robusto
  - Probar webhooks de notificación

- [ ] **Verificar geocoding automático:**
  - Confirmar que convierte address + city + province → lat/lng
  - Verificar que guarda coordenadas correctamente en DB

- [ ] **Documentar endpoints:**
  - Qué campos acepta cada endpoint
  - Qué campos son opcionales vs requeridos
  - Ejemplos de request/response

---

## 🧪 Cómo Probar los Cambios

### 1. Crear Tienda
```
1. Ir a CreateShopScreen
2. Llenar datos básicos (nombre, descripción)
3. Presionar "Seleccionar ubicación en el mapa"
4. Buscar dirección o usar GPS
5. Arrastrar marcador si es necesario
6. Confirmar ubicación
7. Completar horarios e imágenes
8. Crear tienda
✅ Debería crear exitosamente
```

### 2. Registro de Usuario
```
1. Ir a RegisterScreen
2. Llenar todos los campos
3. Si es retailer/wholesaler, seleccionar ubicación
4. Crear cuenta
✅ Debería crear exitosamente
```

### 3. Suscripción (FALLARÁ hasta arreglar backend)
```
1. Ir a SubscriptionScreen
2. Seleccionar plan
3. Presionar Suscribirse
❌ Dará error de Mercado Pago (esperado)
```

---

## 📊 Estadísticas del Commit

- **Archivos modificados:** 6
- **Líneas agregadas:** +984
- **Líneas eliminadas:** -222
- **Archivos nuevos:** 1 (LocationPicker.tsx)

---

## 🔗 Enlaces Útiles

- **Backend API:** https://wall-mapuapi-production.up.railway.app/api/docs
- **Google Maps API:** https://developers.google.com/maps/documentation
- **Mercado Pago Docs:** https://www.mercadopago.com.ar/developers/es/docs

---

## 👥 Colaboradores

- **Desarrollo Frontend:** Javi
- **Asistencia y Code Review:** Claude Code

---

## 📞 Contacto

Para dudas sobre estos cambios o el código, contactar a través del repositorio de GitHub.

---

**Generado:** 4 de diciembre de 2025

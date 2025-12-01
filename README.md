# Wallmapu 🐾

Wallmapu es una aplicación móvil de marketplace para productos de mascotas, desarrollada con React Native y Expo. Conecta a clientes con tiendas minoristas y mayoristas especializadas en productos para mascotas.

## 🚀 Características

### Para Clientes
- 🏠 **Inicio**: Explora productos populares, ofertas y tiendas cercanas
- 📦 **Catálogo**: Navega por categorías de productos
- 🗺️ **Mapa**: Encuentra tiendas cerca de tu ubicación
- 👤 **Perfil**: Gestiona tu información personal y pedidos
- ❤️ **Favoritos**: Guarda tus productos preferidos
- 🛒 **Carrito de Compras**: Agrega productos y realiza pedidos

### Para Minoristas y Mayoristas
- 🏪 **Mi Tienda**: Configura y gestiona tu tienda
- 📊 **Estadísticas**: Visualiza el rendimiento de tu negocio
- 📦 **Mis Productos**: Administra tu inventario
- 📢 **Publicidad Premium**: Destaca tu tienda con banners (suscripción)
- 📍 **Ubicación**: Aparece en el mapa para clientes cercanos

## 🛠️ Tecnologías

- **Frontend**: React Native + Expo
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation (Stack + Bottom Tabs)
- **Mapas**: react-native-maps + Google Maps Platform
- **Estado**: React Context API
- **Estilos**: StyleSheet + React Native Paper
- **Íconos**: Ionicons
- **Almacenamiento Local**: AsyncStorage
- **HTTP Client**: Axios
- **Variables de Entorno**: Expo Environment Variables
- **Geolocalización**: Backend geocoding (coordenadas)

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Expo CLI
- **Google Maps API Key** (para funcionalidad de mapas)
- Android Studio o Xcode (para desarrollo con mapas)
- Emulador Android con Google Play Services o dispositivo físico

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd font-Wallmapu
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```

   Edita el archivo `.env` con tus valores:
   ```env
   EXPO_PUBLIC_API_URL=https://your-api-url.com/api
   EXPO_PUBLIC_APP_NAME=Wallmapu
   EXPO_PUBLIC_APP_VERSION=1.0.0
   EXPO_PUBLIC_ENV=development
   ```

4. **Configura Google Maps** (requerido para el mapa)
   - Sigue las instrucciones en: **[GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)**
   - Obtén una API key de Google Maps Platform
   - Actualiza `app.json` con tu API key
   - Ejecuta `npx expo prebuild`

5. **Inicia el servidor de desarrollo**
   ```bash
   # Para Expo Go (sin mapa funcional)
   npx expo start

   # Para desarrollo con mapa (recomendado)
   npx expo run:android
   ```

## 🔧 Scripts Disponibles

```bash
# Iniciar el servidor de desarrollo
npm start

# Iniciar con caché limpio
npx expo start --clear

# Compilar para Android
npm run android

# Compilar para iOS
npm run ios

# Ejecutar en web
npm run web

# Verificar tipos TypeScript
npx tsc --noEmit
```

## 📱 Ejecución en Desarrollo

### Usando Expo Go

1. Instala Expo Go en tu dispositivo móvil:
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. Ejecuta el proyecto:
   ```bash
   npx expo start
   ```

3. Escanea el código QR con Expo Go

### Usando Emulador

**Android:**
```bash
npx expo start --android
```

**iOS (solo macOS):**
```bash
npx expo start --ios
```

## 🗂️ Estructura del Proyecto

```
font-Wallmapu/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── CategoryCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ShopCard.tsx
│   │   └── NearbyShopCard.tsx
│   ├── constants/           # Constantes y configuraciones
│   │   └── colors.ts
│   ├── context/            # Context API providers
│   │   └── AuthContext.tsx
│   ├── navigation/         # Configuración de navegación
│   │   ├── AppNavigator.tsx
│   │   └── BottomTabNavigator.tsx
│   ├── screens/            # Pantallas de la aplicación
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CatalogScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ProductListScreen.tsx
│   ├── services/           # Servicios y API
│   │   └── api.ts
│   └── types/              # Definiciones TypeScript
│       ├── auth.types.ts
│       └── product.types.ts
├── assets/                 # Imágenes, fuentes, etc.
├── .env                    # Variables de entorno (no versionado)
├── .env.example           # Plantilla de variables de entorno
├── .gitignore             # Archivos ignorados por Git
├── app.json               # Configuración de Expo
├── package.json           # Dependencias del proyecto
└── tsconfig.json          # Configuración de TypeScript
```

## 🔐 Autenticación

La aplicación utiliza autenticación basada en JWT:

1. Los usuarios se registran/inician sesión
2. El token JWT se almacena en AsyncStorage
3. El token se incluye automáticamente en todas las peticiones API
4. El contexto de autenticación gestiona el estado del usuario

### Roles de Usuario

- `client`: Cliente regular
- `retailer`: Tienda minorista
- `wholesaler`: Tienda mayorista
- `admin`: Administrador del sistema

## 🌐 API Endpoints

La aplicación consume los siguientes endpoints:

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto por ID

### Categorías
- `GET /api/categories` - Listar categorías

### Tiendas
- `GET /api/shops` - Listar tiendas
- `GET /api/shops/:id` - Obtener tienda por ID

## 🎨 Tema y Estilos

El proyecto usa un sistema de colores consistente definido en `src/constants/colors.ts`:

```typescript
export const COLORS = {
  primary: '#2D9F84',      // Verde principal
  secondary: '#FF8A65',    // Naranja/Coral
  text: '#1a1a1a',        // Texto oscuro
  gray: '#666',           // Texto secundario
  white: '#fff',
  inputBackground: '#f5f5f5',
  placeholder: '#999',
};
```

## 📝 Variables de Entorno

El proyecto utiliza variables de entorno para configuración:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL del backend | `https://api.example.com/api` |
| `EXPO_PUBLIC_APP_NAME` | Nombre de la app | `Wallmapu` |
| `EXPO_PUBLIC_APP_VERSION` | Versión | `1.0.0` |
| `EXPO_PUBLIC_ENV` | Entorno | `development`, `production` |

**Importante:**
- Las variables deben comenzar con `EXPO_PUBLIC_` para estar disponibles en el cliente
- El archivo `.env` NO se versiona en Git
- Usa `.env.example` como plantilla
- Después de modificar `.env`, reinicia con: `npx expo start --clear`

Ver `.env.README.md` para más detalles sobre configuración de variables de entorno.

## 🔄 Flujo de Navegación

```
AuthStack (No autenticado)
├── LoginScreen
└── RegisterScreen

MainStack (Autenticado)
├── HomeTabs (Bottom Tabs)
│   ├── Inicio (HomeScreen)
│   ├── Mapa (MapScreen)
│   ├── Catalogo (CatalogScreen)
│   └── Perfil (ProfileScreen)
└── ProductList (Modal/Stack)
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm test

# Verificar tipos TypeScript
npx tsc --noEmit
```

## 📱 Publicación

### Android (APK/AAB)

```bash
# Compilar APK
eas build --platform android

# Compilar AAB (Google Play)
eas build --platform android --profile production
```

### iOS (IPA)

```bash
# Compilar para App Store
eas build --platform ios --profile production
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Equipo

Desarrollado para el marketplace de productos para mascotas Wallmapu.

## 📞 Soporte

Para soporte y preguntas:
- Email: support@wallmapu.com
- Documentación de variables de entorno: `.env.README.md`

## 🔗 Enlaces Útiles

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Navigation](https://reactnavigation.org/)

---

**Versión:** 1.0.0
**Última actualización:** Noviembre 2025

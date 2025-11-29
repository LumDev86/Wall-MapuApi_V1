# Wallmapu

Marketplace de confianza para todo lo que tu mascota necesita.

Aplicación móvil React Native desarrollada con Expo y TypeScript.

## Requisitos previos

- Node.js instalado
- npm o yarn
- Expo Go app en tu dispositivo móvil (opcional)

## Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

## Ejecutar la aplicación

```bash
npm start
```

Esto iniciará el servidor de desarrollo de Expo. Luego podrás:

- Presionar `a` para abrir en Android
- Presionar `i` para abrir en iOS
- Presionar `w` para abrir en web
- Escanear el código QR con Expo Go en tu dispositivo móvil

## Scripts disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Inicia la app en Android
- `npm run ios` - Inicia la app en iOS
- `npm run web` - Inicia la app en el navegador

## Características implementadas

- Autenticación completa (Login y Registro)
- Gestión de estado con Context API
- Navegación con React Navigation
- Integración con API REST
- Almacenamiento local con AsyncStorage
- Diseño basado en Figma
- TypeScript para seguridad de tipos

## Dependencias principales

- expo: ^54.0.25
- react: ^19.2.0
- react-native: ^0.82.1
- expo-status-bar: ^3.0.8
- @react-navigation/native
- @react-navigation/native-stack
- axios
- @react-native-async-storage/async-storage
- typescript: (dev)
- @types/react: (dev)
- @types/react-native: (dev)

## Estructura del proyecto

```
font-wallmapu/
├── src/
│   ├── components/         # Componentes reutilizables
│   ├── constants/          # Constantes (colores, etc.)
│   ├── context/            # Context API (AuthContext)
│   ├── navigation/         # Navegación de la app
│   ├── screens/            # Pantallas
│   │   └── Auth/          # Login y Registro
│   ├── services/          # Servicios API
│   └── types/             # Tipos TypeScript
├── assets/                # Recursos (imágenes, fuentes)
├── App.tsx               # Componente raíz
├── app.json              # Configuración de Expo
├── tsconfig.json         # Configuración de TypeScript
└── package.json          # Dependencias y scripts
```

## API Backend

La aplicación se conecta a la API de Wallmapu:

**Base URL:** `https://wall-mapuapi-production.up.railway.app/api`

### Endpoints disponibles:

- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión

### Roles de usuario:

- `client` - Cliente
- `retailer` - Minorista
- `wholesaler` - Mayorista
- `admin` - Administrador

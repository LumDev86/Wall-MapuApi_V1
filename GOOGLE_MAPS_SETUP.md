# Configuración de Google Maps

## 📍 Implementación completada

Se ha implementado **react-native-maps** con Google Maps para mostrar un mapa real con marcadores de tiendas y ubicación del usuario.

## 🔑 Pasos para obtener la API Key de Google Maps

### 1. Accede a Google Cloud Console
- Ve a: https://console.cloud.google.com/

### 2. Crea un proyecto (si no tienes uno)
- Click en el selector de proyectos (arriba a la izquierda)
- Click en "Nuevo Proyecto"
- Nombra tu proyecto: "Wallmapu"
- Click en "Crear"

### 3. Habilita las APIs necesarias
- En el menú lateral, ve a: **APIs y servicios > Biblioteca**
- Busca y habilita las siguientes APIs:
  - ✅ **Maps SDK for Android**
  - ✅ **Maps SDK for iOS** (opcional si solo usas Android)

### 4. Crea credenciales
- Ve a: **APIs y servicios > Credenciales**
- Click en "Crear credenciales" > "Clave de API"
- Copia la API key generada

### 5. Restringe la API Key (Recomendado para seguridad)

**Para Android:**
- Click en tu API key
- En "Restricciones de aplicación" selecciona "Aplicaciones de Android"
- Click en "Agregar nombre de paquete y huella digital"
- Nombre del paquete: `com.wallmapu.app`
- Obtén tu SHA-1 con: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
- Agrega la huella digital SHA-1

**Para APIs restringidas:**
- En "Restricciones de API" selecciona las APIs habilitadas:
  - Maps SDK for Android
  - Maps SDK for iOS

### 6. Configura la API Key en el proyecto
- Abre: `app.json`
- Reemplaza `YOUR_GOOGLE_MAPS_API_KEY` con tu API key real:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "TU_API_KEY_AQUI"
    }
  }
}
```

## 🚀 Ejecutar la aplicación con el mapa

### Opción A: Desarrollo en Expo Go (NO FUNCIONA con react-native-maps)
⚠️ react-native-maps **NO** funciona en Expo Go. Debes usar la Opción B.

### Opción B: Build de desarrollo (RECOMENDADO)

#### 1. Genera los archivos nativos
```bash
npx expo prebuild
```

Esto generará las carpetas `android/` e `ios/` con código nativo.

#### 2. Ejecuta en Android
```bash
npx expo run:android
```

O si tienes un dispositivo conectado:
```bash
npx expo run:android --device
```

#### 3. Ejecuta en iOS (solo macOS)
```bash
npx expo run:ios
```

## 📱 Características implementadas

✅ **Mapa interactivo con Google Maps**
- Zoom, pan, gestos nativos
- Vista satelital disponible

✅ **Marcador de ubicación del usuario**
- Color azul (#4285F4)
- Muestra "Tu ubicación"

✅ **Marcadores de tiendas**
- Color verde cuando no está seleccionada
- Color naranja cuando está seleccionada
- Muestran nombre, tipo y distancia

✅ **Cálculo de distancias reales**
- Fórmula de Haversine
- Ordenamiento por proximidad

✅ **Bottom sheet con tiendas**
- Scroll horizontal
- Selección interactiva
- Distancias en km

## 🔧 Comandos útiles

```bash
# Limpiar y reconstruir
npx expo prebuild --clean

# Ejecutar en Android con cache limpio
npx expo run:android --clear

# Ver dispositivos disponibles
adb devices

# Ver logs de Android
npx expo run:android --variant debug
```

## 🐛 Solución de problemas

### Error: "Google Play Services not available"
- Asegúrate de que tu emulador/dispositivo tenga Google Play Services
- Usa un emulador con Google APIs

### Error: "AUTHORIZATION_FAILURE"
- Verifica que la API key esté correctamente configurada
- Asegúrate de haber habilitado Maps SDK for Android
- Verifica que la huella digital SHA-1 sea correcta

### El mapa no se muestra
- Verifica que ejecutaste `npx expo prebuild`
- Confirma que estás usando `npx expo run:android` (NO `expo start`)
- Revisa que la API key esté en app.json

## 📚 Documentación adicional

- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform](https://developers.google.com/maps)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)

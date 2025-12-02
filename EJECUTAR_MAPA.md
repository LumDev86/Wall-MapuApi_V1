# ✅ Google Maps API Key Configurada

## API Key Configurada
```
AIzaSyC56WIVTWhOvGn_r0JVhqdqx5-IYoWyL_Q
```

## 📝 Cambios aplicados

1. ✅ **/.env** - API Key agregada
2. ✅ **app.config.js** - Plugin de react-native-maps agregado
3. ✅ **app.config.js** - Configuración iOS agregada
4. ✅ **app.config.js** - Configuración Android ya existía
5. ✅ **MapScreen.tsx** - Actualizado para funcionar sin coordenadas exactas

## 🚀 Pasos para ver el mapa

### 1. Detener Expo Go (si está corriendo)
```bash
# En la terminal donde está corriendo Expo, presiona Ctrl+C
```

### 2. Limpiar cache
```bash
npx expo start -c
```

### 3. Ejecutar Development Build para Android
```bash
# Este comando compilará la app nativa con soporte para mapas
npx expo run:android
```

**⚠️ IMPORTANTE:** La primera vez puede tardar 5-10 minutos en compilar.

### 4. Alternativa: Crear Development Build y luego usar Expo
```bash
# Generar archivos nativos
npx expo prebuild

# Ejecutar en Android
npx expo run:android

# O ejecutar en iOS (solo macOS)
npx expo run:ios
```

## 📱 Qué esperar

Después de ejecutar `npx expo run:android`:

1. ✅ Se compilará una versión nativa de la app
2. ✅ Se instalará automáticamente en el emulador/dispositivo
3. ✅ La app pedirá permisos de ubicación
4. ✅ El mapa se mostrará con:
   - Tu ubicación actual (punto azul)
   - Tiendas cercanas con marcadores verdes
   - Distancias calculadas desde tu GPS
   - Funcionalidad de zoom/pan

## 🗺️ Funcionalidades del mapa

Una vez funcionando:

- **Ubicación automática**: El mapa se centra en tu GPS
- **Marcadores de tiendas**: Cada tienda tiene un pin verde
- **Distancias reales**: Calculadas usando la fórmula de Haversine
- **Ordenamiento**: Tiendas ordenadas de más cerca a más lejos
- **Interacción**: Tap en marcadores para seleccionar tienda
- **Navegación**: Botón "Cómo llegar" abre Google Maps

## 🔧 Solución de problemas

### Error: "SDK location not found"
```bash
# Necesitas Android Studio instalado
# Descarga: https://developer.android.com/studio
```

### Error: "No devices/emulators found"
```bash
# Verifica dispositivos conectados
adb devices

# Si no hay ninguno, abre Android Studio y:
# Tools > Device Manager > Create Virtual Device
```

### Error: "Command failed with exit code 1"
```bash
# Limpia todo y vuelve a intentar
rm -rf android ios
npx expo prebuild --clean
npx expo run:android
```

### El mapa se ve en blanco
```bash
# Verifica que la API Key esté activa en Google Cloud Console
# https://console.cloud.google.com/apis/credentials

# Asegúrate de habilitar:
# - Maps SDK for Android
# - Maps SDK for iOS (si usas iOS)
```

### Error de permisos en Android
```bash
# Verifica que en app.config.js estén estos permisos:
# - android.permission.ACCESS_FINE_LOCATION
# - android.permission.ACCESS_COARSE_LOCATION
```

## 🎯 Próximos pasos

1. ✅ Ejecuta `npx expo run:android`
2. ✅ Acepta permisos de ubicación cuando la app lo solicite
3. ✅ Verifica que el mapa muestre tu ubicación
4. ✅ Verifica que las tiendas aparezcan con distancias
5. ✅ Prueba hacer tap en una tienda
6. ✅ Prueba el botón "Cómo llegar"

## 📊 Comparación Expo Go vs Development Build

| Característica | Expo Go | Development Build |
|---------------|---------|-------------------|
| Inicio rápido | ✅ Muy rápido | ⚠️ Compilación inicial lenta |
| React Native Maps | ❌ No funciona | ✅ Funciona perfectamente |
| GPS/Ubicación | ✅ Funciona | ✅ Funciona |
| Hot reload | ✅ Sí | ✅ Sí |
| Librerías nativas | ❌ Limitado | ✅ Todas |

## 🔄 Volver a Expo Go (opcional)

Si quieres volver a usar Expo Go para desarrollo sin mapa:

```bash
# Simplemente ejecuta
npx expo start

# Y escanea el QR con Expo Go
```

El placeholder del mapa se mostrará, pero las tiendas sí aparecerán en la lista.

## ⚙️ Configuración de Google Cloud Console

Si el mapa no funciona después de compilar, verifica en Google Cloud:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Busca tu API Key: `AIzaSyC56WIVTWhOvGn_r0JVhqdqx5-IYoWyL_Q`
3. Verifica que estén habilitadas:
   - ✅ Maps SDK for Android
   - ✅ Maps SDK for iOS
   - ✅ Maps JavaScript API (opcional)
4. Verifica restricciones de la API Key:
   - Si está restringida por paquete, agrega: `com.wallmapu.app`
   - Si está restringida por IP, considera quitarla para desarrollo

## 📝 Notas importantes

- **Primera compilación**: Puede tardar 5-10 minutos
- **Compilaciones posteriores**: Mucho más rápidas (1-2 minutos)
- **Hot reload**: Sigue funcionando normalmente
- **Cache**: Si cambias configuración nativa, ejecuta con `--clean`
- **Ubicación**: Funciona tanto en emulador como dispositivo real

## 🎨 Personalización del mapa

En `MapScreen.tsx` puedes personalizar:

- **Color de marcadores**: Línea 214 (`pinColor`)
- **Zoom inicial**: Líneas 181-182 (`latitudeDelta`, `longitudeDelta`)
- **Botones del mapa**: Líneas 184-187 (ubicación, brújula, escala)
- **Región inicial**: Línea 179 (coordenadas por defecto)

## 📞 Soporte

Si tienes problemas ejecutando el development build:

1. Asegúrate de tener Android Studio instalado
2. Verifica que haya un emulador o dispositivo conectado
3. Ejecuta `adb devices` para confirmar
4. Si nada funciona, comparte el error exacto

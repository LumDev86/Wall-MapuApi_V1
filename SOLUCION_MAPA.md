# Solución: Mapa no disponible en Expo Go

## Problema
El mapa no se muestra porque `react-native-maps` NO funciona en Expo Go. Necesitas un **development build** nativo.

## ✅ Solución Aplicada

He actualizado MapScreen.tsx para que:
1. **Muestre las tiendas** aunque no tengas coordenadas exactas en el perfil
2. **Use coordenadas por defecto** de Concepción del Uruguay si no hay ubicación del dispositivo
3. **Solicite permisos GPS** automáticamente cuando abra la app

## 🚀 Para ver el mapa real

### Opción 1: Android (Recomendado)
```bash
# En la terminal, ejecuta:
npx expo run:android
```

Esto compilará la app con soporte nativo para mapas.

### Opción 2: iOS
```bash
npx expo run:ios
```

## 📱 Mientras tanto (Expo Go)

La app ahora mostrará:
- ✅ Lista de tiendas cercanas (aunque no calcule distancias exactas)
- ✅ Búsqueda de productos funcional
- ✅ Navegación completa a detalles de tiendas/productos
- ⚠️  Placeholder del mapa (hasta que uses development build)

## 🗺️ Para obtener tu ubicación GPS

1. Ejecuta el development build (`npx expo run:android`)
2. Abre la app
3. Acepta los permisos de ubicación
4. El mapa centrará automáticamente en tu posición actual
5. Las tiendas se ordenarán por distancia real desde tu GPS

## 📍 Coordenadas por defecto

Si no tienes GPS configurado, la app usa:
- **Concepción del Uruguay, Entre Ríos**
- Latitud: -32.4827
- Longitud: -58.2363

## ⚙️ Requisitos previos

Antes de ejecutar el development build:

### Android
```bash
# Verifica que tengas Android Studio instalado
# Verifica que tengas un emulador o dispositivo conectado
adb devices
```

### iOS (solo macOS)
```bash
# Necesitas Xcode instalado
# Verifica simuladores disponibles
xcrun simctl list devices
```

## 🔧 Solución de problemas

**Error: "No Android SDK found"**
- Instala Android Studio: https://developer.android.com/studio

**Error: "Command failed: adb"**
- Agrega Android SDK platform-tools al PATH

**Error al compilar**
```bash
# Limpia cache y vuelve a intentar
npx expo prebuild --clean
npx expo run:android
```

## 📝 Cambios realizados

1. **MapScreen.tsx** (línea 98-122):
   - Ahora muestra tiendas sin requerir coordenadas del usuario
   - Calcula distancias solo si hay ubicación disponible

2. **MapScreen.tsx** (línea 178-200):
   - Usa coordenadas por defecto de Concepción del Uruguay
   - Muestra marcador del usuario solo si tiene GPS

3. **MapScreen.tsx** (línea 244-251):
   - Mensaje mejorado cuando no hay tiendas disponibles

## 🎯 Próximos pasos

1. ✅ Ejecuta `npx expo run:android` para ver el mapa real
2. ✅ Acepta permisos de ubicación
3. ✅ Verifica que las tiendas se ordenen por distancia
4. ✅ Prueba la navegación a detalles de tiendas

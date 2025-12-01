# 🚀 Prueba Rápida del Mapa

## ⚡ Inicio Rápido (Sin API Key)

Puedes probar el mapa **ahora mismo** sin configurar la API key de Google. El mapa mostrará un watermark de "For development purposes only" pero será completamente funcional.

### Paso 1: Genera los archivos nativos
```bash
npx expo prebuild
```

**Qué hace esto:**
- Crea las carpetas `android/` e `ios/`
- Configura react-native-maps en el código nativo
- Tarda ~2-3 minutos

### Paso 2: Ejecuta la app en Android
```bash
npx expo run:android
```

**Requisitos:**
- Emulador Android abierto O dispositivo conectado por USB
- El emulador debe tener **Google Play Services**

### Paso 3: Prueba el mapa 🗺️

Verás:
- ✅ Mapa de Google Maps centrado en Buenos Aires
- ✅ Marcador azul de ubicación (ejemplo)
- ✅ Marcadores de tiendas del backend
- ✅ Zoom, pan y gestos táctiles
- ✅ Botón de "Mi ubicación"
- ✅ Brújula y escala
- ⚠️ Watermark "For development purposes only"

---

## 🎯 Datos de prueba incluidos

### Ubicación por defecto
- **Ciudad**: Buenos Aires, Argentina
- **Coordenadas**: -34.6037, -58.3816
- **Zoom**: Nivel cercano (0.05 delta)

### Marcadores
1. **Marcador azul**: Tu ubicación (o ejemplo de Buenos Aires)
2. **Marcadores verdes**: Tiendas del backend con coordenadas
3. **Marcador naranja**: Tienda seleccionada

---

## 🔧 Comandos útiles

```bash
# Ver dispositivos Android conectados
adb devices

# Limpiar y reconstruir
npx expo prebuild --clean
npx expo run:android --clear

# Ver logs en tiempo real
npx expo run:android --variant debug

# Matar procesos anteriores
taskkill /F /IM node.exe
```

---

## ⚠️ Solución de problemas comunes

### Error: "No devices found"
**Solución:**
```bash
# Abre el emulador desde Android Studio primero
# O conecta un dispositivo físico con USB debugging habilitado
```

### Error: "Google Play Services not available"
**Solución:**
- Usa un emulador que tenga **Google APIs** (no "No Google APIs")
- En Android Studio: AVD Manager → Create Virtual Device → Selecciona imagen con Play Store

### El mapa no se muestra (pantalla en blanco)
**Solución:**
1. Verifica que ejecutaste `npx expo prebuild`
2. Revisa que estés usando `expo run:android` (NO `expo start`)
3. Cierra la app y ábrela de nuevo

### Watermark "For development purposes only"
**Esto es normal sin API key**. Para quitarlo:
1. Obtén una Google Maps API Key (ver GOOGLE_MAPS_SETUP.md)
2. Actualiza `app.json` con tu API key
3. Ejecuta `npx expo prebuild --clean`
4. Ejecuta `npx expo run:android`

---

## 📱 ¿Qué puedes probar?

### Funcionalidades disponibles sin API key:
- ✅ Ver el mapa interactivo
- ✅ Hacer zoom in/out
- ✅ Arrastrar el mapa (pan)
- ✅ Ver marcadores de tiendas
- ✅ Click en marcadores para seleccionar
- ✅ Ver bottom sheet con tiendas
- ✅ Ver distancias calculadas
- ✅ Botón "Mi ubicación"

### Limitaciones sin API key:
- ⚠️ Watermark en el mapa
- ⚠️ Puede tener límite de requests
- ⚠️ No apto para producción

---

## 🎨 Características del mapa

### Marcador del usuario (Azul)
- Se muestra en tu ubicación real si configuraste tu ubicación en el perfil
- Si no, muestra Buenos Aires como ejemplo
- Click para ver información

### Marcadores de tiendas
- **Verde**: Tienda no seleccionada
- **Naranja**: Tienda actualmente seleccionada
- Muestran: Nombre, tipo (Minorista/Mayorista), distancia en km
- Click para seleccionar y ver en el bottom sheet

### Bottom Sheet
- Lista horizontal de tiendas
- Ordenadas por distancia (más cercana primero)
- Scroll horizontal
- Click para centrar en el mapa

### Controles del mapa
- **Zoom buttons**: + / - en la esquina
- **Mi ubicación**: Centra el mapa en tu posición
- **Brújula**: Muestra orientación (solo cuando rota)
- **Escala**: Muestra escala del mapa

---

## 🚀 Próximo paso

Después de probar que el mapa funciona, configura la API key para producción:
- Sigue: **[GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)**
- Esto eliminará el watermark y permitirá uso ilimitado

---

## 💡 Tips

1. **Primera vez ejecutando**: Puede tardar 5-10 minutos en compilar
2. **Compilaciones siguientes**: ~1-2 minutos
3. **Hot reload**: Funciona después de la primera compilación
4. **Cierra expo start**: Si tenías expo start corriendo, ciérralo primero
5. **Usa tu ubicación real**: Regístrate con tu dirección para ver distancias reales

---

¡Listo! Ahora puedes ver el mapa funcionando en tiempo real 🎉

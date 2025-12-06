# Cómo Generar el APK de Wallmapu

## Preparación completada ✅

Ya se realizaron los siguientes pasos:
1. Se convirtió `app.config.js` a `app.json` para evitar problemas de compatibilidad
2. Se creó `eas.json` con la configuración de build
3. Ya estás autenticado en Expo como "whapy"

## Pasos que DEBES ejecutar en tu terminal

### Paso 1: Inicializar el proyecto en EAS

Ejecuta este comando en tu terminal (no en background):

```bash
npx eas-cli build:configure
```

Te preguntará si quieres crear un nuevo proyecto o vincular a uno existente:
- Si ya existe un proyecto "wallmapu" en tu cuenta, selecciona "Link to an existing project"
- Si no existe, selecciona "Create a new project"

### Paso 2: Generar el APK

Una vez configurado el proyecto, ejecuta:

```bash
npx eas-cli build --platform android --profile preview
```

Este comando:
- Subirá tu código a los servidores de EAS
- Compilará la app en Android
- Generará un APK (no un AAB)
- Te dará un link para descargar el APK cuando termine

El proceso toma aproximadamente 10-15 minutos.

### Paso 3: Descargar el APK

Cuando el build termine, recibirás un link. Puedes:
1. Descargarlo directamente desde el link
2. Ver todos tus builds en: https://expo.dev/accounts/whapy/projects/wallmapu/builds

## Alternativa: Build local (más rápido pero requiere Android Studio)

Si tienes Android Studio instalado y configurado:

```bash
npx expo run:android --variant release
```

Esto genera el APK localmente en:
`android/app/build/outputs/apk/release/app-release.apk`

## Problemas comunes

### Error: "No project ID"
Ejecuta primero: `npx eas-cli build:configure`

### Error: "Not logged in"
Ejecuta: `npx eas-cli login`

### El comando se queda colgado
- Asegúrate de ejecutar en terminal normal (no en background)
- Presiona Enter si te pide confirmación
- No uses `echo "" |` antes del comando

## Notas importantes

- El APK generado con el perfil "preview" NO está optimizado para producción
- Para producción, usa `--profile production` (genera AAB para Google Play Store)
- El APK de preview puede instalarse directamente en cualquier dispositivo Android

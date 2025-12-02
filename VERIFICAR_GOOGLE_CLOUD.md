# Verificar Google Cloud Console - API Key

## 🔑 Tu API Key
```
AIzaSyC56WIVTWhOvGn_r0JVhqdqx5-IYoWyL_Q
```

## ⚠️ Problema Detectado

La API Key está correctamente configurada en el código, pero el mapa no se muestra.

**Esto suele significar que la API Key no tiene los permisos correctos en Google Cloud Console.**

---

## ✅ Pasos para Verificar en Google Cloud Console

### 1. Abre Google Cloud Console
**URL**: https://console.cloud.google.com/apis/credentials

### 2. Busca tu API Key
Busca: `AIzaSyC56WIVTWhOvGn_r0JVhqdqx5-IYoWyL_Q`

### 3. Verifica que estén HABILITADAS estas APIs:

#### Para iOS:
- ✅ **Maps SDK for iOS** - MUY IMPORTANTE
- ✅ **Maps JavaScript API** (opcional)

#### Para Android (futuro):
- ✅ **Maps SDK for Android**

### 4. Verifica las Restricciones de la API Key

Haz clic en tu API Key y verifica:

#### Opción A: Sin Restricciones (Desarrollo)
- Tipo de restricción: **Ninguna**
- ⚠️ Recomendado solo para desarrollo

#### Opción B: Restricción por Bundle ID (Producción)
Si está restringida por Bundle ID, debe incluir:
- Bundle ID iOS: `com.wallmapu.app`

---

## 🔧 Cómo Habilitar Maps SDK for iOS

1. Ve a: https://console.cloud.google.com/apis/library
2. Busca: **Maps SDK for iOS**
3. Haz clic en **HABILITAR**
4. Espera 2-3 minutos para que se active

---

## 🚨 Errores Comunes

### Error: "This API project is not authorized to use this API"
**Solución**: Habilita "Maps SDK for iOS" en la biblioteca de APIs

### Error: Mapa en blanco/gris
**Solución**:
- Verifica que la API Key no tenga restricciones de Bundle ID incorrectas
- Verifica que Maps SDK for iOS esté habilitado

### Error: "API key not valid"
**Solución**:
- Verifica que la API Key esté activa (no eliminada)
- Espera 5-10 minutos después de crear la key

---

## 🎯 Configuración Recomendada para Desarrollo

Para que funcione en desarrollo sin problemas:

1. **API Key sin restricciones** (temporal)
2. **Maps SDK for iOS habilitado**
3. **Facturación habilitada** en el proyecto (Google requiere tarjeta de crédito, pero hay créditos gratuitos)

---

## 💳 Facturación

**IMPORTANTE**: Google Maps requiere que habilites la facturación en tu proyecto, aunque:
- ✅ Google da $200 USD de crédito mensual GRATIS
- ✅ Maps SDK tiene uso gratuito generoso
- ✅ Probablemente no te cobrarán nada en desarrollo

**Cómo habilitar**:
1. Ve a: https://console.cloud.google.com/billing
2. Vincula una tarjeta de crédito
3. El proyecto activará automáticamente los créditos gratuitos

---

## 🔍 Verificación Rápida

Ejecuta este comando para verificar si la API está respondiendo:

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Buenos+Aires&key=AIzaSyC56WIVTWhOvGn_r0JVhqdqx5-IYoWyL_Q"
```

**Si funciona**, deberías ver una respuesta JSON con coordenadas.

**Si no funciona**, verás un error como:
```json
{
  "error_message": "This API project is not authorized to use this API",
  "status": "REQUEST_DENIED"
}
```

---

## 📝 Checklist Final

Antes de recompilar la app, verifica:

- [ ] Maps SDK for iOS está HABILITADO
- [ ] API Key no tiene restricciones (o tiene el Bundle ID correcto)
- [ ] Facturación está habilitada en el proyecto
- [ ] Han pasado 5-10 minutos desde que habilitaste las APIs

---

## 🔄 Después de Verificar en Google Cloud

Una vez que confirmes que todo está bien en Google Cloud Console:

1. Espera 2-3 minutos para que los cambios se propaguen
2. Vuelve a compilar la app:
   ```bash
   npx expo run:ios
   ```
3. El mapa debería funcionar

---

## 📞 Enlaces Útiles

- Google Cloud Console: https://console.cloud.google.com
- Credenciales: https://console.cloud.google.com/apis/credentials
- Biblioteca de APIs: https://console.cloud.google.com/apis/library
- Facturación: https://console.cloud.google.com/billing
- Documentación Maps iOS: https://developers.google.com/maps/documentation/ios-sdk

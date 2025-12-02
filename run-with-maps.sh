#!/bin/bash

# Script para ejecutar Wallmapu con soporte de mapas
# Este script verifica requisitos y ejecuta el development build

echo "🗺️  Wallmapu - Development Build con Google Maps"
echo "=================================================="
echo ""

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

# Verificar Google Maps API Key
if grep -q "YOUR_GOOGLE_MAPS_API_KEY_HERE" .env; then
    echo "❌ Error: Google Maps API Key no configurada en .env"
    exit 1
fi

echo "✅ Google Maps API Key configurada"
echo ""

# Verificar adb (Android Debug Bridge)
if ! command -v adb &> /dev/null; then
    echo "⚠️  Advertencia: adb no encontrado"
    echo "   Instala Android Studio: https://developer.android.com/studio"
    echo ""
else
    echo "✅ adb encontrado"

    # Verificar dispositivos/emuladores
    DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
    if [ $DEVICES -eq 0 ]; then
        echo "⚠️  No hay dispositivos/emuladores conectados"
        echo "   Abre un emulador en Android Studio o conecta un dispositivo"
        echo ""
    else
        echo "✅ $DEVICES dispositivo(s) encontrado(s)"
        echo ""
    fi
fi

# Preguntar si desea limpiar cache
echo "¿Deseas limpiar cache antes de compilar? (recomendado la primera vez)"
echo "1) Sí, limpiar cache"
echo "2) No, compilar directamente"
read -p "Selecciona una opción (1 o 2): " option

echo ""
echo "🚀 Iniciando compilación..."
echo ""

if [ "$option" = "1" ]; then
    echo "🧹 Limpiando cache..."
    npx expo start -c &
    sleep 2
    pkill -f "expo start"

    echo "🗑️  Limpiando carpetas nativas anteriores..."
    rm -rf android ios

    echo "🔨 Generando archivos nativos..."
    npx expo prebuild --clean
fi

echo "📱 Ejecutando development build para Android..."
echo ""
echo "⏱️  Esto puede tardar 5-10 minutos la primera vez..."
echo ""

npx expo run:android

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ App ejecutándose exitosamente!"
    echo ""
    echo "📍 El mapa debería estar visible ahora"
    echo "🔐 Acepta los permisos de ubicación cuando la app lo solicite"
    echo ""
else
    echo ""
    echo "❌ Error al ejecutar la app"
    echo ""
    echo "Soluciones comunes:"
    echo "1. Verifica que Android Studio esté instalado"
    echo "2. Verifica que haya un emulador abierto o dispositivo conectado"
    echo "3. Ejecuta: adb devices"
    echo "4. Revisa el error específico arriba"
    echo ""
fi

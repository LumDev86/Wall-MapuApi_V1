/**
 * Validación de variables de entorno
 * Este archivo valida que todas las variables de entorno necesarias estén configuradas
 */

interface EnvConfig {
  API_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  ENV: 'development' | 'staging' | 'production';
  GOOGLE_MAPS_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/**
 * Valida que todas las variables de entorno necesarias estén presentes
 * Lanza un error si alguna falta
 */
function validateEnv(): EnvConfig {
  const requiredVars = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_APP_NAME',
    'EXPO_PUBLIC_APP_VERSION',
    'EXPO_PUBLIC_ENV',
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
❌ ERROR: Faltan las siguientes variables de entorno:
${missing.map(v => `  - ${v}`).join('\n')}

Por favor, crea un archivo .env basado en .env.example y configura todas las variables necesarias.
    `.trim();

    console.error(errorMessage);
    throw new Error('Variables de entorno faltantes. Revisa la consola para más detalles.');
  }

  // Validar formato de URLs
  const apiUrl = process.env.EXPO_PUBLIC_API_URL!;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_URL debe empezar con http:// o https://');
  }

  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL debe empezar con http:// o https://');
  }

  // Validar que las claves no sean placeholders
  const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  if (googleKey.includes('your_') || googleKey.includes('here')) {
    console.warn('⚠️  ADVERTENCIA: Parece que EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada correctamente');
  }

  if (supabaseKey.includes('your_') || supabaseKey.includes('here')) {
    console.warn('⚠️  ADVERTENCIA: Parece que EXPO_PUBLIC_SUPABASE_ANON_KEY no está configurada correctamente');
  }

  return {
    API_URL: apiUrl,
    APP_NAME: process.env.EXPO_PUBLIC_APP_NAME!,
    APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION!,
    ENV: process.env.EXPO_PUBLIC_ENV as any,
    GOOGLE_MAPS_API_KEY: googleKey,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseKey,
  };
}

// Validar al importar este módulo
export const env = validateEnv();

// Export por defecto
export default env;

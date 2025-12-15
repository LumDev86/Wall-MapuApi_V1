/**
 * Sistema de logging centralizado que solo muestra logs en desarrollo
 * En producción, los logs se silencian automáticamente
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

class Logger {
  private isDevelopment = __DEV__;

  private log(level: LogLevel, ...args: any[]) {
    if (!this.isDevelopment && level !== 'error') {
      // En producción, solo mostramos errores
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'debug':
        console.debug(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      case 'log':
      default:
        console.log(prefix, ...args);
        break;
    }
  }

  debug(...args: any[]) {
    this.log('debug', ...args);
  }

  info(...args: any[]) {
    this.log('info', ...args);
  }

  logMessage(...args: any[]) {
    this.log('log', ...args);
  }

  warn(...args: any[]) {
    this.log('warn', ...args);
  }

  error(...args: any[]) {
    this.log('error', ...args);
  }

  /**
   * Grupo de logs colapsable (solo en desarrollo)
   */
  group(label: string) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * Finaliza un grupo de logs
   */
  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Muestra una tabla (solo en desarrollo)
   */
  table(data: any) {
    if (this.isDevelopment && console.table) {
      console.table(data);
    }
  }

  /**
   * Mide tiempo de ejecución (solo en desarrollo)
   */
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * Finaliza medición de tiempo
   */
  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Exportar instancia única del logger
export const logger = new Logger();

// Export por defecto para importaciones más simples
export default logger;

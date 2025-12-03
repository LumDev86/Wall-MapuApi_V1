import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Scale factors
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Scale a value based on screen width
 * Use for: horizontal padding, margins, widths, font sizes
 */
export const scale = (size: number): number => {
  const newSize = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale a value based on screen height
 * Use for: vertical padding, margins, heights
 */
export const verticalScale = (size: number): number => {
  const newSize = size * heightScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Moderate scale - less aggressive scaling
 * Use for: font sizes, icon sizes, border radius
 * @param factor - 0.5 by default (50% of the scaling)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const newSize = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get screen dimensions
 */
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

/**
 * Check if device is small (iPhone SE, older Androids)
 */
export const isSmallDevice = SCREEN_WIDTH < 375;

/**
 * Check if device is large (tablets, large phones)
 */
export const isLargeDevice = SCREEN_WIDTH >= 428;

/**
 * Check if device is tablet
 */
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Get safe padding top (for notch/dynamic island)
 */
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    // iPhone X and later have notch
    if (SCREEN_HEIGHT >= 812) {
      return 47; // For notch devices
    }
    return 20; // For older iPhones
  }
  return StatusBar.currentHeight || 24;
};

/**
 * Get safe padding bottom (for home indicator)
 */
export const getBottomSpace = (): number => {
  if (Platform.OS === 'ios' && SCREEN_HEIGHT >= 812) {
    return 34; // For devices with home indicator
  }
  return 0;
};

/**
 * Responsive font size with min/max limits
 */
export const responsiveFontSize = (size: number, minSize?: number, maxSize?: number): number => {
  const scaledSize = moderateScale(size, 0.3);
  if (minSize && scaledSize < minSize) return minSize;
  if (maxSize && scaledSize > maxSize) return maxSize;
  return scaledSize;
};

/**
 * Get grid item width for 2 columns with gap
 */
export const getGridItemWidth = (gap: number = 12, padding: number = 20): number => {
  return (SCREEN_WIDTH - (padding * 2) - gap) / 2;
};

/**
 * Get grid item width for N columns with gap
 */
export const getGridItemWidthForColumns = (
  columns: number,
  gap: number = 12,
  padding: number = 20
): number => {
  return (SCREEN_WIDTH - (padding * 2) - (gap * (columns - 1))) / columns;
};

// Shorthand aliases
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;

export default {
  scale,
  verticalScale,
  moderateScale,
  screenWidth,
  screenHeight,
  isSmallDevice,
  isLargeDevice,
  isTablet,
  getStatusBarHeight,
  getBottomSpace,
  responsiveFontSize,
  getGridItemWidth,
  getGridItemWidthForColumns,
  s,
  vs,
  ms,
};

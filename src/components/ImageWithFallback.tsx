import React, { useState } from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { COLORS } from '../constants/colors';

interface ImageWithFallbackProps {
  uri: string | undefined | null;
  style?: ImageStyle;
  fallbackStyle?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  uri,
  style,
  fallbackStyle,
  resizeMode = 'cover',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={[styles.fallbackContainer, style, fallbackStyle]}>
        <Image
          source={require('../../assets/images/wallmapu-logo.png')}
          style={styles.fallbackLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogo: {
    width: '50%',
    height: '50%',
    opacity: 0.3,
    tintColor: COLORS.gray,
  },
});

export default ImageWithFallback;

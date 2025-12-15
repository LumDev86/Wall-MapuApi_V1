import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32; // 16px padding on each side
const BANNER_HEIGHT = 160;

interface Banner {
  id: string;
  image?: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  onPress?: () => void;
}

interface BannerCarouselProps {
  banners?: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const defaultBanners: Banner[] = [
  {
    id: '1',
    title: '¡Bienvenido a Wallmapu!',
    subtitle: 'Encuentra todo para tu mascota',
    backgroundColor: COLORS.primary,
  },
  {
    id: '2',
    title: 'Ofertas Especiales',
    subtitle: 'Descuentos en productos seleccionados',
    backgroundColor: '#FF6B6B',
  },
  {
    id: '3',
    title: 'Envío Gratis',
    subtitle: 'En compras mayores a $10,000',
    backgroundColor: '#4ECDC4',
  },
];

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners = defaultBanners,
  autoPlay = true,
  autoPlayInterval = 4000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / BANNER_WIDTH);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * BANNER_WIDTH,
      animated: true,
    });
  };

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, banners.length]);

  const handleBannerPress = (banner: Banner) => {
    if (banner.onPress) {
      banner.onPress();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.banner, { backgroundColor: banner.backgroundColor }]}
            onPress={() => handleBannerPress(banner)}
            activeOpacity={banner.onPress ? 0.8 : 1}
          >
            {banner.image ? (
              <Image source={{ uri: banner.image }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                scrollToIndex(index);
                setCurrentIndex(index);
              }}
            >
              <View
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  banner: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
});

export default BannerCarousel;

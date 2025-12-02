module.exports = {
  expo: {
    name: "Wallmapu",
    slug: "wallmapu",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/wallmapu-logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/wallmapu-logo.png",
      backgroundColor: "#FFFFFF",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wallmapu.app",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Wallmapu necesita acceso a tu ubicación para mostrarte tiendas cercanas",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Wallmapu necesita acceso a tu ubicación para mostrarte tiendas cercanas"
      }
    },
    android: {
      package: "com.wallmapu.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/wallmapu-logo.png",
        backgroundColor: "#FFFFFF"
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      },
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/wallmapu-logo.png"
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Wallmapu necesita acceso a tu ubicación para mostrarte tiendas cercanas"
        }
      ]
    ]
  }
};

module.exports = {
  expo: {
    name: "Wallmapu",
    slug: "wallmapu",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#2D8659",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wallmapu.app"
    },
    android: {
      package: "com.wallmapu.app",
      adaptiveIcon: {
        backgroundColor: "#2D8659"
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      }
    },
    web: {
      bundler: "metro"
    }
  }
};

import React from 'react';
import { AuthStackParamList, MainStackParamList } from '../types/navigation.types';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import CompleteProfileScreen from '../screens/Auth/CompleteProfileScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CartScreen from '../screens/CartScreen';
import MyShopScreen from '../screens/MyShopScreen';
import CreateShopScreen from '../screens/CreateShopScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import ManagePromotionalBannerScreen from '../screens/ManagePromotionalBannerScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="Terms" component={TermsScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </AuthStack.Navigator>
  );
};

const RootNavigator = ({ initialRoute }: { initialRoute: keyof MainStackParamList }) => {
  return (
    <MainStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="HomeTabs" component={BottomTabNavigator} />
      <MainStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <MainStack.Screen name="ProductList" component={ProductListScreen} />
      <MainStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <MainStack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <MainStack.Screen name="Search" component={SearchScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="Cart" component={CartScreen} />
      <MainStack.Screen name="MyShop" component={MyShopScreen} />
      <MainStack.Screen name="CreateShop" component={CreateShopScreen} />
      <MainStack.Screen name="CreateProduct" component={CreateProductScreen} />
      <MainStack.Screen name="EditProduct" component={EditProductScreen} />
      <MainStack.Screen name="ManagePromotionalBanner" component={ManagePromotionalBannerScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
      <MainStack.Screen name="About" component={AboutScreen} />
      <MainStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="MyOrders" component={MyOrdersScreen} />
      <MainStack.Screen name="Terms" component={TermsScreen} />
      <MainStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </MainStack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading, needsProfileCompletion } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Determinar la ruta inicial basado en si necesita completar perfil
  const initialRoute: keyof MainStackParamList = needsProfileCompletion ? 'CompleteProfile' : 'HomeTabs';

  return (
    <NavigationContainer>
      {user ? <RootNavigator initialRoute={initialRoute} /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default AppNavigator;

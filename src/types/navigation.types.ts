import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  Terms: undefined;
  PrivacyPolicy: undefined;
};

// Main Stack
export type MainStackParamList = {
  HomeTabs: undefined;
  CompleteProfile: undefined;
  ProductList: { title?: string; categoryId?: string; categoryName?: string; shopId?: string; shopName?: string };
  ProductDetail: { productId: string };
  ShopDetail: { shopId: string };
  Search: undefined;
  EditProfile: undefined;
  Cart: undefined;
  MyShop: undefined;
  CreateShop: undefined;
  CreateProduct: { shopId: string };
  EditProduct: { productId: string };
  Subscription: undefined;
  About: undefined;
  HelpSupport: undefined;
  Settings: undefined;
  MyOrders: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

// Bottom Tab
export type BottomTabParamList = {
  Inicio: undefined;
  Mapa: undefined;
  Perfil: undefined;
};

// Tipos compuestos de navegación para screens del Auth Stack
export type AuthStackNavigationProp<T extends keyof AuthStackParamList> = NativeStackNavigationProp<
  AuthStackParamList,
  T
>;

// Tipos compuestos de navegación para screens del Main Stack
export type MainStackNavigationProp<T extends keyof MainStackParamList> = NativeStackNavigationProp<
  MainStackParamList,
  T
>;

// Tipos compuestos para screens del Bottom Tab que también necesitan acceso al Main Stack
export type BottomTabScreenNavigationProp<T extends keyof BottomTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, T>,
  NativeStackNavigationProp<MainStackParamList>
>;

// Tipos de rutas
export type AuthStackRouteProp<T extends keyof AuthStackParamList> = RouteProp<AuthStackParamList, T>;
export type MainStackRouteProp<T extends keyof MainStackParamList> = RouteProp<MainStackParamList, T>;
export type BottomTabRouteProp<T extends keyof BottomTabParamList> = RouteProp<BottomTabParamList, T>;

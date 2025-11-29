import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/colors';

export type BottomTabParamList = {
  Inicio: undefined;
  Mapa: undefined;
  Catalogo: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TabIcon = ({ focused, iconName, label }: { focused: boolean; iconName: IoniconsName; label: string }) => {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Ionicons
        name={iconName}
        size={24}
        color={focused ? COLORS.primary : '#666'}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
};

const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home-outline" label="Inicio" />
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="map-outline" label="Mapa" />
          ),
        }}
      />
      <Tab.Screen
        name="Catalogo"
        component={CatalogScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="grid-outline" label="Catalogo" />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="person-outline" label="Perfil" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingTop: 8,
    position: 'absolute',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 75,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: '#D4F1E8',
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default BottomTabNavigator;

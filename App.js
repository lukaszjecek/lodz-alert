import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider } from './src/context/UserContext'; 

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import WalletScreen from './src/screens/WalletScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Tab.Navigator
        initialRouteName="Zgłoś"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#D4213D',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Mapa') iconName = focused ? 'map' : 'map-outline';
              else if (route.name === 'Zgłoś') iconName = focused ? 'camera' : 'camera-outline';
              else if (route.name === 'Portfel') iconName = focused ? 'wallet' : 'wallet-outline';
              else if (route.name === 'Historia') iconName = focused ? 'list-circle' : 'list-circle-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Mapa" component={HomeScreen} />
          <Tab.Screen name="Zgłoś" component={CameraScreen} />
          <Tab.Screen name="Portfel" component={WalletScreen} />
          <Tab.Screen name="Historia" component={HistoryScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
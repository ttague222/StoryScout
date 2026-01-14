/**
 * App Navigator
 *
 * Main navigation structure for StoryScout
 * - Onboarding flow (first launch)
 * - Main tabs (Recommend, Saved, Profile)
 * - Modal screens (Results, BookDetail, Premium)
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../styles/colors';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';

// Screens
import {
  OnboardingScreen,
  RecommendScreen,
  ResultsScreen,
  BookDetailScreen,
  SavedBooksScreen,
  ProfileScreen,
  PremiumScreen,
} from '../screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.card,
          borderTopColor: colors.divider,
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Recommend"
        component={RecommendScreen}
        options={{
          tabBarLabel: 'Find Books',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SavedBooks"
        component={SavedBooksScreen}
        options={{
          tabBarLabel: 'My Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator
export default function AppNavigator() {
  const { loading: authLoading } = useAuth();
  const { isLoaded: prefsLoaded, hasCompletedOnboarding } = usePreferences();

  // Show loading while initializing
  if (authLoading || !prefsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          // Onboarding flow
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Main app
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{
                presentation: 'card',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="BookDetail"
              component={BookDetailScreen}
              options={{
                presentation: 'card',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

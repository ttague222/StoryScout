/**
 * StoryScout App
 *
 * A mobile app for parents that provides intent-based
 * children's book recommendations.
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { SavedBooksProvider } from './src/context/SavedBooksContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { KidsProvider } from './src/context/KidsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/styles/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background.primary}
      />
      <AuthProvider>
        <PreferencesProvider>
          <PremiumProvider>
            <KidsProvider>
              <SavedBooksProvider>
                <AppNavigator />
              </SavedBooksProvider>
            </KidsProvider>
          </PremiumProvider>
        </PreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

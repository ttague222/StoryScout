/**
 * Preferences Context
 *
 * Manages user preferences for child info and reading preferences
 * Persisted locally and synced to cloud when logged in
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_STORAGE_KEY = '@storyscout_preferences';

const DEFAULT_PREFERENCES = {
  // Child info
  childAgeRange: null,        // '2-3', '4-5', '6-7', '8-10'
  readingType: null,          // 'read-aloud', 'independent', 'both'

  // Theme preferences (array of theme IDs)
  themes: [],

  // Onboarding state
  onboardingCompleted: false,

  // Last used mood/time (for quick repeat)
  lastMood: null,
  lastTimeOption: null,
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const savePreferences = useCallback(async (newPrefs) => {
    try {
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, []);

  // Update a single preference
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      savePreferences(updated);
      return updated;
    });
  }, [savePreferences]);

  // Update multiple preferences at once
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      savePreferences(updated);
      return updated;
    });
  }, [savePreferences]);

  // Complete onboarding with all preferences
  const completeOnboarding = useCallback((onboardingData) => {
    const updated = {
      ...preferences,
      ...onboardingData,
      onboardingCompleted: true,
    };
    setPreferences(updated);
    savePreferences(updated);
  }, [preferences, savePreferences]);

  // Reset preferences
  const resetPreferences = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);
    await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY);
  }, []);

  // Toggle a theme in the array
  const toggleTheme = useCallback((themeId) => {
    setPreferences(prev => {
      const themes = prev.themes.includes(themeId)
        ? prev.themes.filter(t => t !== themeId)
        : [...prev.themes, themeId];
      const updated = { ...prev, themes };
      savePreferences(updated);
      return updated;
    });
  }, [savePreferences]);

  const value = {
    preferences,
    isLoaded,
    updatePreference,
    updatePreferences,
    completeOnboarding,
    resetPreferences,
    toggleTheme,
    // Convenience getters
    hasCompletedOnboarding: preferences.onboardingCompleted,
    childAgeRange: preferences.childAgeRange,
    readingType: preferences.readingType,
    themes: preferences.themes,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export default PreferencesContext;

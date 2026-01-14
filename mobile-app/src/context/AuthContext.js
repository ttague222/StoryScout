/**
 * Authentication Context
 *
 * Handles anonymous auth and optional email sign-in
 * Similar pattern to PlayBeacon
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@storyscout_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // Check for existing user
      const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Create anonymous user
        const anonymousUser = {
          id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isAnonymous: true,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(anonymousUser));
        setUser(anonymousUser);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      // Fallback to anonymous
      const fallbackUser = {
        id: `anon_${Date.now()}`,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  // Link email to anonymous account (future feature)
  const linkEmail = async (email) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      email,
      isAnonymous: false,
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  // Sign out (reset to anonymous)
  const signOut = async () => {
    const newAnonymousUser = {
      id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAnonymousUser));
    setUser(newAnonymousUser);
  };

  const value = {
    user,
    loading,
    linkEmail,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

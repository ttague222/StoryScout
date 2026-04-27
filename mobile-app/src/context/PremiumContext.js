/**
 * Premium/Subscription Context
 *
 * Manages subscription state and limits
 * Uses RevenueCat for billing
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_TIERS } from '../config/options';

const USAGE_STORAGE_KEY = '@storyscout_daily_usage';
const DEBUG_PREMIUM_KEY = '@storyscout_debug_premium';

// ============================================
// DEBUG: Toggle this to test premium features
// Set to true to simulate premium, false for free
// ============================================
const DEBUG_FORCE_PREMIUM = false;

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  // Subscription state
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Daily usage tracking
  const [dailyRecommendations, setDailyRecommendations] = useState(0);
  const [lastUsageDate, setLastUsageDate] = useState(null);

  // Initialize on mount
  useEffect(() => {
    initializePremiumState();
  }, []);

  const initializePremiumState = async () => {
    try {
      // Load daily usage
      const usageData = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
      if (usageData) {
        const { count, date } = JSON.parse(usageData);
        const today = new Date().toDateString();

        if (date === today) {
          setDailyRecommendations(count);
          setLastUsageDate(date);
        } else {
          // Reset for new day
          setDailyRecommendations(0);
          setLastUsageDate(today);
        }
      }

      // Check for debug premium override
      if (DEBUG_FORCE_PREMIUM) {
        console.log('[DEBUG] Premium mode forced ON');
        setIsPremium(true);
      } else {
        // Check if debug toggle was set in app
        const debugPremium = await AsyncStorage.getItem(DEBUG_PREMIUM_KEY);
        if (debugPremium === 'true') {
          console.log('[DEBUG] Premium mode enabled via toggle');
          setIsPremium(true);
        } else {
          // TODO: Check RevenueCat for subscription status
          // For now, default to free tier
          setIsPremium(false);
        }
      }
    } catch (error) {
      console.error('Error initializing premium state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current tier
  const currentTier = isPremium
    ? SUBSCRIPTION_TIERS.premium
    : SUBSCRIPTION_TIERS.free;

  // Check if user can get more recommendations today
  const canGetRecommendation = useCallback(() => {
    if (isPremium) return true;
    return dailyRecommendations < currentTier.recommendationsPerDay;
  }, [isPremium, dailyRecommendations, currentTier]);

  // Get remaining recommendations for today
  const remainingRecommendations = useCallback(() => {
    if (isPremium) return Infinity;
    return Math.max(0, currentTier.recommendationsPerDay - dailyRecommendations);
  }, [isPremium, dailyRecommendations, currentTier]);

  // Increment daily usage
  const incrementUsage = useCallback(async () => {
    const today = new Date().toDateString();
    const newCount = lastUsageDate === today ? dailyRecommendations + 1 : 1;

    setDailyRecommendations(newCount);
    setLastUsageDate(today);

    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify({
      count: newCount,
      date: today,
    }));
  }, [dailyRecommendations, lastUsageDate]);

  // Purchase premium (placeholder for RevenueCat)
  const purchasePremium = useCallback(async () => {
    // TODO: Implement RevenueCat purchase flow
    console.log('Purchase premium - to be implemented with RevenueCat');
    return false;
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    // TODO: Implement RevenueCat restore
    console.log('Restore purchases - to be implemented with RevenueCat');
    return false;
  }, []);

  // ============================================
  // DEBUG FUNCTIONS - For testing only
  // ============================================

  // Toggle premium status for testing
  const debugTogglePremium = useCallback(async () => {
    const newValue = !isPremium;
    setIsPremium(newValue);
    await AsyncStorage.setItem(DEBUG_PREMIUM_KEY, newValue.toString());
    console.log(`[DEBUG] Premium toggled to: ${newValue}`);
    return newValue;
  }, [isPremium]);

  // Reset daily usage counter for testing
  const debugResetUsage = useCallback(async () => {
    setDailyRecommendations(0);
    setLastUsageDate(null);
    await AsyncStorage.removeItem(USAGE_STORAGE_KEY);
    console.log('[DEBUG] Daily usage reset');
  }, []);

  const value = {
    isPremium,
    isLoading,
    currentTier,
    dailyRecommendations,
    canGetRecommendation,
    remainingRecommendations,
    incrementUsage,
    purchasePremium,
    restorePurchases,
    // Limits
    maxSavedBooks: currentTier.maxSavedBooks,
    recommendationsPerDay: currentTier.recommendationsPerDay,
    // Debug functions (for testing)
    debugTogglePremium,
    debugResetUsage,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}

export default PremiumContext;

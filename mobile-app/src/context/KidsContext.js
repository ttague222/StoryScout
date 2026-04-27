/**
 * Kids Context
 *
 * Manages multiple child profiles for the family
 * Each kid has their own age range and theme preferences
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from './PremiumContext';

const KIDS_STORAGE_KEY = '@storyscout_kids';
const ACTIVE_KID_STORAGE_KEY = '@storyscout_active_kid';

// Avatar options for kids
export const KID_AVATARS = [
  { id: 'girl', emoji: '👧' },
  { id: 'boy', emoji: '👦' },
  { id: 'baby', emoji: '👶' },
  { id: 'child', emoji: '🧒' },
  { id: 'lion', emoji: '🦁' },
  { id: 'rabbit', emoji: '🐰' },
  { id: 'bear', emoji: '🐻' },
  { id: 'fox', emoji: '🦊' },
  { id: 'panda', emoji: '🐼' },
  { id: 'unicorn', emoji: '🦄' },
  { id: 'cat', emoji: '🐱' },
  { id: 'dog', emoji: '🐶' },
];

const KidsContext = createContext(null);

export function KidsProvider({ children }) {
  const [kids, setKids] = useState([]);
  const [activeKidId, setActiveKidId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isPremium } = usePremium();

  // Subscription limits
  const maxKids = isPremium ? 5 : 1;

  // Load kids on mount
  useEffect(() => {
    loadKids();
  }, []);

  const loadKids = async () => {
    try {
      const [savedKids, savedActiveId] = await Promise.all([
        AsyncStorage.getItem(KIDS_STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_KID_STORAGE_KEY),
      ]);

      if (savedKids) {
        const parsed = JSON.parse(savedKids);
        setKids(parsed);

        // Set active kid (use saved or first kid)
        if (savedActiveId && parsed.find(k => k.id === savedActiveId)) {
          setActiveKidId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveKidId(parsed[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading kids:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveKids = useCallback(async (newKids) => {
    try {
      await AsyncStorage.setItem(KIDS_STORAGE_KEY, JSON.stringify(newKids));
    } catch (error) {
      console.error('Error saving kids:', error);
    }
  }, []);

  const saveActiveKidId = useCallback(async (kidId) => {
    try {
      if (kidId) {
        await AsyncStorage.setItem(ACTIVE_KID_STORAGE_KEY, kidId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_KID_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving active kid:', error);
    }
  }, []);

  // Generate unique ID
  const generateId = () => `kid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add a new kid
  const addKid = useCallback(async (kidData) => {
    if (kids.length >= maxKids) {
      return { success: false, error: 'limit_reached' };
    }

    const newKid = {
      id: generateId(),
      name: kidData.name.trim(),
      avatar: kidData.avatar || 'child',
      ageRange: kidData.ageRange,
      themes: kidData.themes || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedKids = [...kids, newKid];
    setKids(updatedKids);
    await saveKids(updatedKids);

    // If this is the first kid, make them active
    if (kids.length === 0) {
      setActiveKidId(newKid.id);
      await saveActiveKidId(newKid.id);
    }

    return { success: true, kid: newKid };
  }, [kids, maxKids, saveKids, saveActiveKidId]);

  // Update an existing kid
  const updateKid = useCallback(async (kidId, updates) => {
    const updatedKids = kids.map(kid => {
      if (kid.id === kidId) {
        return {
          ...kid,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return kid;
    });

    setKids(updatedKids);
    await saveKids(updatedKids);

    return { success: true };
  }, [kids, saveKids]);

  // Remove a kid
  const removeKid = useCallback(async (kidId) => {
    const updatedKids = kids.filter(k => k.id !== kidId);
    setKids(updatedKids);
    await saveKids(updatedKids);

    // If we removed the active kid, switch to first remaining
    if (activeKidId === kidId) {
      const newActiveId = updatedKids.length > 0 ? updatedKids[0].id : null;
      setActiveKidId(newActiveId);
      await saveActiveKidId(newActiveId);
    }

    return { success: true };
  }, [kids, activeKidId, saveKids, saveActiveKidId]);

  // Set active kid
  const setActiveKid = useCallback(async (kidId) => {
    if (kids.find(k => k.id === kidId)) {
      setActiveKidId(kidId);
      await saveActiveKidId(kidId);
    }
  }, [kids, saveActiveKidId]);

  // Get kid by ID
  const getKidById = useCallback((kidId) => {
    return kids.find(k => k.id === kidId) || null;
  }, [kids]);

  // Get active kid
  const activeKid = kids.find(k => k.id === activeKidId) || null;

  // Check if can add more kids
  const canAddKid = kids.length < maxKids;
  const kidsRemaining = Math.max(0, maxKids - kids.length);

  // Computed properties
  const kidsCount = kids.length;
  const hasKids = kids.length > 0;

  const value = {
    // State
    kids,
    activeKid,
    activeKidId,
    isLoaded,

    // Limits
    maxKids,
    canAddKid,
    kidsRemaining,
    kidsCount,
    hasKids,

    // Actions
    addKid,
    updateKid,
    removeKid,
    setActiveKid,
    getKidById,
  };

  return (
    <KidsContext.Provider value={value}>
      {children}
    </KidsContext.Provider>
  );
}

export function useKids() {
  const context = useContext(KidsContext);
  if (!context) {
    throw new Error('useKids must be used within a KidsProvider');
  }
  return context;
}

export default KidsContext;

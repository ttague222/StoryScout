/**
 * Recommend Screen
 *
 * The main recommendation flow:
 * 1. Select mood
 * 2. Select time available
 * 3. Get recommendations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { MOODS, TIME_OPTIONS } from '../config/options';
import { usePreferences } from '../context/PreferencesContext';
import { usePremium } from '../context/PremiumContext';
import { useKids, KID_AVATARS } from '../context/KidsContext';

export default function RecommendScreen() {
  const navigation = useNavigation();
  const { preferences, updatePreferences } = usePreferences();
  const { canGetRecommendation, remainingRecommendations, isPremium } = usePremium();
  const { activeKid, hasKids } = useKids();

  // Get the active kid's avatar emoji
  const activeKidAvatar = activeKid
    ? KID_AVATARS.find(a => a.id === activeKid.avatar)?.emoji || '👤'
    : '👤';

  const [selectedMood, setSelectedMood] = useState(preferences.lastMood);
  const [selectedTime, setSelectedTime] = useState(preferences.lastTimeOption);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetRecommendations = useCallback(async () => {
    if (!selectedMood || !selectedTime) return;

    // Check daily limit
    if (!canGetRecommendation()) {
      navigation.navigate('Premium');
      return;
    }

    // Save last selections
    updatePreferences({
      lastMood: selectedMood,
      lastTimeOption: selectedTime,
    });

    setIsLoading(true);

    // Use active kid's preferences if available, otherwise fall back to general preferences
    const ageRange = activeKid?.ageRange || preferences.childAgeRange;
    const themes = activeKid?.themes?.length > 0 ? activeKid.themes : preferences.themes;

    console.log('[RecommendScreen] Active kid:', activeKid);
    console.log('[RecommendScreen] Using ageRange:', ageRange);
    console.log('[RecommendScreen] Fallback childAgeRange:', preferences.childAgeRange);

    // Navigate to results (passing params)
    navigation.navigate('Results', {
      mood: selectedMood,
      time: selectedTime,
      ageRange,
      readingType: preferences.readingType,
      themes,
      kidId: activeKid?.id,
      kidName: activeKid?.name,
    });

    setIsLoading(false);
  }, [selectedMood, selectedTime, preferences, activeKid, canGetRecommendation, navigation, updatePreferences]);

  const remaining = remainingRecommendations();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Find a book</Text>
              <Text style={styles.title}>What's the mood?</Text>
            </View>
            {/* Kid Switcher */}
            <Pressable
              style={styles.kidSwitcher}
              onPress={() => navigation.navigate('KidsList')}
            >
              <Text style={styles.kidAvatar}>{activeKidAvatar}</Text>
              <View style={styles.kidSwitcherText}>
                <Text style={styles.kidName} numberOfLines={1}>
                  {activeKid?.name || 'Select Child'}
                </Text>
                {activeKid && (
                  <Text style={styles.kidAge}>
                    {activeKid.ageRange} yrs
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={16} color={colors.text.tertiary} />
            </Pressable>
          </View>
        </View>

        {/* Usage indicator (free tier) */}
        {!isPremium && (
          <View style={styles.usageCard}>
            <Ionicons name="sparkles" size={20} color={colors.accent.main} />
            <Text style={styles.usageText}>
              {remaining > 0
                ? `${remaining} recommendation${remaining !== 1 ? 's' : ''} left today`
                : 'Daily limit reached'}
            </Text>
            {remaining === 0 && (
              <Pressable
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are they feeling?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(mood => (
              <Pressable
                key={mood.id}
                style={[
                  styles.moodCard,
                  selectedMood === mood.id && {
                    borderColor: mood.color,
                    backgroundColor: mood.color + '20',
                  },
                ]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <View style={[styles.moodEmojiContainer, { backgroundColor: mood.color + '40' }]}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </View>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.id && styles.moodLabelSelected,
                ]}>
                  {mood.label}
                </Text>
                <Text style={styles.moodDescription}>{mood.description}</Text>
                {selectedMood === mood.id && (
                  <View style={[styles.moodCheck, { backgroundColor: mood.color }]}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How much time do you have?</Text>
          <View style={styles.timeOptions}>
            {TIME_OPTIONS.map(time => (
              <Pressable
                key={time.id}
                style={[
                  styles.timeOption,
                  selectedTime === time.id && styles.timeOptionSelected,
                ]}
                onPress={() => setSelectedTime(time.id)}
              >
                <Text style={styles.timeEmoji}>{time.emoji}</Text>
                <View style={styles.timeTextContainer}>
                  <Text style={[
                    styles.timeLabel,
                    selectedTime === time.id && styles.timeLabelSelected,
                  ]}>
                    {time.label}
                  </Text>
                  <Text style={styles.timeDescription}>{time.description}</Text>
                </View>
                {selectedTime === time.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Get Recommendations Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.recommendButton,
            (!selectedMood || !selectedTime) && styles.recommendButtonDisabled,
          ]}
          onPress={handleGetRecommendations}
          disabled={!selectedMood || !selectedTime || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary.contrast} />
          ) : (
            <>
              <Ionicons name="book" size={22} color={colors.primary.contrast} />
              <Text style={styles.recommendButtonText}>Find Books</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kidSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radii.full,
    gap: spacing.xs,
    ...shadows.sm,
    maxWidth: 140,
  },
  kidAvatar: {
    fontSize: 24,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  kidSwitcherText: {
    flex: 1,
    minWidth: 0,
  },
  kidName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  kidAge: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  greeting: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  usageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.main + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  usageText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  upgradeButton: {
    backgroundColor: colors.accent.main,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  upgradeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent.contrast,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moodCard: {
    width: '47%',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  moodEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  moodLabelSelected: {
    color: colors.text.primary,
  },
  moodDescription: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  moodCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeOptions: {
    gap: spacing.md,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.md,
    ...shadows.sm,
  },
  timeOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  timeEmoji: {
    fontSize: 28,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  timeLabelSelected: {
    color: colors.primary.main,
  },
  timeDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    gap: spacing.sm,
    ...shadows.md,
  },
  recommendButtonDisabled: {
    backgroundColor: colors.border,
  },
  recommendButtonText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
    color: colors.primary.contrast,
  },
});

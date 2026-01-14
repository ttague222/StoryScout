/**
 * Profile Screen
 *
 * User settings and preferences management
 * - View/edit child preferences
 * - Theme preferences
 * - Subscription status
 * - App settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { AGE_RANGES, READING_TYPES, THEMES } from '../config/options';
import { usePreferences } from '../context/PreferencesContext';
import { usePremium } from '../context/PremiumContext';
import { useSavedBooks } from '../context/SavedBooksContext';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { preferences, resetPreferences } = usePreferences();
  const { isPremium, currentTier, restorePurchases } = usePremium();
  const { savedCount } = useSavedBooks();

  // Get display values
  const ageRange = AGE_RANGES.find(a => a.id === preferences.childAgeRange);
  const readingType = READING_TYPES.find(r => r.id === preferences.readingType);
  const selectedThemes = preferences.themes
    .map(id => THEMES.find(t => t.id === id))
    .filter(Boolean);

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'This will clear all your preferences and show the onboarding flow again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetPreferences();
            // Force app to show onboarding again
            // This would typically trigger a state change in the navigator
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Success', 'Your purchases have been restored.');
    } else {
      Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Subscription Card */}
        <Pressable
          style={styles.subscriptionCard}
          onPress={() => !isPremium && navigation.navigate('Premium')}
        >
          <View style={styles.subscriptionHeader}>
            <View style={[
              styles.tierBadge,
              isPremium && styles.tierBadgePremium,
            ]}>
              <Ionicons
                name={isPremium ? 'star' : 'star-outline'}
                size={16}
                color={isPremium ? colors.premium.gold : colors.text.secondary}
              />
              <Text style={[
                styles.tierText,
                isPremium && styles.tierTextPremium,
              ]}>
                {currentTier.name}
              </Text>
            </View>
            {!isPremium && (
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            )}
          </View>
          <Text style={styles.subscriptionInfo}>
            {isPremium
              ? 'Unlimited recommendations and saved books'
              : `${currentTier.recommendationsPerDay} recommendations/day • ${currentTier.maxSavedBooks} saved books`
            }
          </Text>
          {!isPremium && (
            <Text style={styles.upgradeHint}>Tap to upgrade to Premium</Text>
          )}
        </Pressable>

        {/* Child Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Child Preferences</Text>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Text style={styles.preferenceEmoji}>{ageRange?.emoji || '👶'}</Text>
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Age Range</Text>
                <Text style={styles.preferenceValue}>
                  {ageRange?.label || 'Not set'}
                </Text>
              </View>
            </View>

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Text style={styles.preferenceEmoji}>{readingType?.emoji || '📖'}</Text>
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Reading Type</Text>
                <Text style={styles.preferenceValue}>
                  {readingType?.label || 'Not set'}
                </Text>
              </View>
            </View>

            {selectedThemes.length > 0 && (
              <View style={styles.themesRow}>
                <Text style={styles.themesLabel}>Favorite Themes</Text>
                <View style={styles.themesContainer}>
                  {selectedThemes.map(theme => (
                    <View key={theme.id} style={styles.themeChip}>
                      <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                      <Text style={styles.themeText}>{theme.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{savedCount}</Text>
              <Text style={styles.statLabel}>Books Saved</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Pressable style={styles.menuItem} onPress={handleRestorePurchases}>
            <Ionicons name="refresh" size={22} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Restore Purchases</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleResetPreferences}>
            <Ionicons name="refresh-circle" size={22} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Reset Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <Pressable style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={22} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="shield-outline" size={22} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>StoryScout v1.0.0</Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subscriptionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  tierBadgePremium: {
    backgroundColor: colors.premium.goldLight,
  },
  tierText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  tierTextPremium: {
    color: colors.premium.gold,
  },
  subscriptionInfo: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  upgradeHint: {
    fontSize: typography.sizes.xs,
    color: colors.primary.main,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceCard: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  preferenceEmoji: {
    fontSize: 20,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  preferenceValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  themesRow: {
    paddingTop: spacing.md,
  },
  themesLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  themeEmoji: {
    fontSize: 14,
  },
  themeText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  statsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    ...shadows.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    color: colors.primary.main,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  menuItemText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: spacing.lg,
  },
});

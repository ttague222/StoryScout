/**
 * Kids List Screen
 *
 * Shows all child profiles with ability to:
 * - View all kids
 * - Tap to select active kid
 * - Edit existing kids
 * - Add new kids
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { AGE_RANGES, THEMES } from '../config/options';
import { useKids, KID_AVATARS } from '../context/KidsContext';
import { usePremium } from '../context/PremiumContext';

export default function KidsListScreen() {
  const navigation = useNavigation();
  const { kids, activeKidId, setActiveKid, canAddKid, maxKids } = useKids();
  const { isPremium } = usePremium();

  const getAvatarEmoji = (avatarId) => {
    const avatar = KID_AVATARS.find(a => a.id === avatarId);
    return avatar?.emoji || '🧒';
  };

  const getAgeRangeLabel = (ageRangeId) => {
    const ageRange = AGE_RANGES.find(a => a.id === ageRangeId);
    return ageRange?.label || ageRangeId;
  };

  const handleKidPress = (kidId) => {
    setActiveKid(kidId);
    navigation.goBack();
  };

  const handleEditKid = (kidId) => {
    navigation.navigate('AddKid', { kidId });
  };

  const handleAddKid = () => {
    if (canAddKid) {
      navigation.navigate('AddKid');
    } else {
      navigation.navigate('Premium');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Children</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kids Count */}
        <View style={styles.countCard}>
          <Ionicons name="people" size={20} color={colors.primary.main} />
          <Text style={styles.countText}>
            {kids.length} of {maxKids} profile{maxKids !== 1 ? 's' : ''}
          </Text>
          {!isPremium && kids.length >= maxKids && (
            <Pressable
              style={styles.upgradeChip}
              onPress={() => navigation.navigate('Premium')}
            >
              <Text style={styles.upgradeChipText}>Upgrade for more</Text>
            </Pressable>
          )}
        </View>

        {/* Kids List */}
        {kids.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👶</Text>
            <Text style={styles.emptyTitle}>No children added yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first child to get personalized book recommendations
            </Text>
          </View>
        ) : (
          <View style={styles.kidsList}>
            {kids.map(kid => (
              <Pressable
                key={kid.id}
                style={[
                  styles.kidCard,
                  activeKidId === kid.id && styles.kidCardActive,
                ]}
                onPress={() => handleKidPress(kid.id)}
              >
                <View style={styles.kidAvatarContainer}>
                  <Text style={styles.kidAvatar}>{getAvatarEmoji(kid.avatar)}</Text>
                  {activeKidId === kid.id && (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </View>

                <View style={styles.kidInfo}>
                  <Text style={styles.kidName}>{kid.name}</Text>
                  <Text style={styles.kidAge}>{getAgeRangeLabel(kid.ageRange)}</Text>

                  {/* Show themes if any */}
                  {kid.themes && kid.themes.length > 0 && (
                    <View style={styles.kidThemes}>
                      {kid.themes.slice(0, 3).map(themeId => {
                        const theme = THEMES.find(t => t.id === themeId);
                        return theme ? (
                          <Text key={themeId} style={styles.kidThemeEmoji}>
                            {theme.emoji}
                          </Text>
                        ) : null;
                      })}
                      {kid.themes.length > 3 && (
                        <Text style={styles.moreThemes}>+{kid.themes.length - 3}</Text>
                      )}
                    </View>
                  )}
                </View>

                <Pressable
                  style={styles.editButton}
                  onPress={() => handleEditKid(kid.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="pencil" size={18} color={colors.text.tertiary} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}

        {/* Add Kid Button */}
        <Pressable
          style={[
            styles.addKidButton,
            !canAddKid && styles.addKidButtonDisabled,
          ]}
          onPress={handleAddKid}
        >
          <View style={styles.addKidIcon}>
            <Ionicons
              name={canAddKid ? 'add' : 'lock-closed'}
              size={24}
              color={canAddKid ? colors.primary.main : colors.text.tertiary}
            />
          </View>
          <View style={styles.addKidTextContainer}>
            <Text style={[
              styles.addKidText,
              !canAddKid && styles.addKidTextDisabled,
            ]}>
              Add Another Child
            </Text>
            {!canAddKid && (
              <Text style={styles.addKidSubtext}>Upgrade to Premium</Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.tertiary}
          />
        </Pressable>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  countText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  upgradeChip: {
    backgroundColor: colors.accent.main,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  upgradeChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.accent.contrast,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  kidsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.md,
    ...shadows.sm,
  },
  kidCardActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  kidAvatarContainer: {
    position: 'relative',
  },
  kidAvatar: {
    fontSize: 40,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  kidAge: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  kidThemes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  kidThemeEmoji: {
    fontSize: 14,
  },
  moreThemes: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addKidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  addKidButtonDisabled: {
    opacity: 0.7,
  },
  addKidIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addKidTextContainer: {
    flex: 1,
  },
  addKidText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.primary.main,
  },
  addKidTextDisabled: {
    color: colors.text.secondary,
  },
  addKidSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

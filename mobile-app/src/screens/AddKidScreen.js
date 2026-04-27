/**
 * Add/Edit Kid Screen
 *
 * Form for adding a new child profile or editing an existing one
 * - Name input
 * - Avatar selection
 * - Age range selection
 * - Theme preferences (optional)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { AGE_RANGES, THEMES } from '../config/options';
import { useKids, KID_AVATARS } from '../context/KidsContext';

export default function AddKidScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { addKid, updateKid, removeKid, getKidById, canAddKid } = useKids();

  // Check if editing existing kid
  const editKidId = route.params?.kidId;
  const isEditing = !!editKidId;
  const existingKid = isEditing ? getKidById(editKidId) : null;

  // Form state
  const [name, setName] = useState(existingKid?.name || '');
  const [avatar, setAvatar] = useState(existingKid?.avatar || 'child');
  const [ageRange, setAgeRange] = useState(existingKid?.ageRange || null);
  const [selectedThemes, setSelectedThemes] = useState(existingKid?.themes || []);
  const [isSaving, setIsSaving] = useState(false);

  // Validate form
  const isValid = name.trim().length > 0 && ageRange;

  const handleSave = async () => {
    if (!isValid) return;

    // Check limit for new kids
    if (!isEditing && !canAddKid) {
      Alert.alert(
        'Limit Reached',
        'Upgrade to Premium to add more child profiles.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }

    setIsSaving(true);

    const kidData = {
      name: name.trim(),
      avatar,
      ageRange,
      themes: selectedThemes,
    };

    let result;
    if (isEditing) {
      result = await updateKid(editKidId, kidData);
    } else {
      result = await addKid(kidData);
    }

    setIsSaving(false);

    if (result.success) {
      navigation.goBack();
    } else if (result.error === 'limit_reached') {
      Alert.alert('Limit Reached', 'Upgrade to Premium to add more profiles.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${existingKid?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeKid(editKidId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleTheme = (themeId) => {
    setSelectedThemes(prev =>
      prev.includes(themeId)
        ? prev.filter(t => t !== themeId)
        : [...prev, themeId]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Child' : 'Add Child'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter child's name"
              placeholderTextColor={colors.text.tertiary}
              maxLength={30}
              autoCapitalize="words"
            />
          </View>

          {/* Avatar Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose an Avatar</Text>
            <View style={styles.avatarGrid}>
              {KID_AVATARS.map(av => (
                <Pressable
                  key={av.id}
                  style={[
                    styles.avatarOption,
                    avatar === av.id && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setAvatar(av.id)}
                >
                  <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                  {avatar === av.id && (
                    <View style={styles.avatarCheck}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Age Range Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age Range</Text>
            <View style={styles.ageOptions}>
              {AGE_RANGES.map(age => (
                <Pressable
                  key={age.id}
                  style={[
                    styles.ageOption,
                    ageRange === age.id && styles.ageOptionSelected,
                  ]}
                  onPress={() => setAgeRange(age.id)}
                >
                  <Text style={styles.ageEmoji}>{age.emoji}</Text>
                  <View style={styles.ageTextContainer}>
                    <Text style={[
                      styles.ageLabel,
                      ageRange === age.id && styles.ageLabelSelected,
                    ]}>
                      {age.label}
                    </Text>
                    <Text style={styles.ageDescription}>{age.description}</Text>
                  </View>
                  {ageRange === age.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Theme Preferences (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Themes (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Select themes they enjoy for better recommendations
            </Text>
            <View style={styles.themesGrid}>
              {THEMES.map(theme => (
                <Pressable
                  key={theme.id}
                  style={[
                    styles.themeChip,
                    selectedThemes.includes(theme.id) && {
                      backgroundColor: theme.color + '30',
                      borderColor: theme.color,
                    },
                  ]}
                  onPress={() => toggleTheme(theme.id)}
                >
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                  <Text style={[
                    styles.themeLabel,
                    selectedThemes.includes(theme.id) && styles.themeLabelSelected,
                  ]}>
                    {theme.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Delete Button (Edit mode only) */}
          {isEditing && (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.status.error} />
              <Text style={styles.deleteButtonText}>Remove Child</Text>
            </Pressable>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[
              styles.saveButton,
              !isValid && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValid || isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Child'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  nameInput: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '15',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageOptions: {
    gap: spacing.sm,
  },
  ageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.md,
  },
  ageOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  ageEmoji: {
    fontSize: 24,
  },
  ageTextContainer: {
    flex: 1,
  },
  ageLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  ageLabelSelected: {
    color: colors.primary.main,
  },
  ageDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  themeEmoji: {
    fontSize: 16,
  },
  themeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  themeLabelSelected: {
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  deleteButtonText: {
    fontSize: typography.sizes.body,
    color: colors.status.error,
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
  saveButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    alignItems: 'center',
    ...shadows.md,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
    color: colors.primary.contrast,
  },
});

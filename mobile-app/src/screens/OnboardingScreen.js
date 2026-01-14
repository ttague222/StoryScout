/**
 * Onboarding Screen
 *
 * Multi-step onboarding flow:
 * 1. Welcome
 * 2. Child age selection
 * 3. Reading type
 * 4. Theme preferences
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { typography, spacing, radii } from '../styles/theme';
import { AGE_RANGES, READING_TYPES, THEMES } from '../config/options';
import { usePreferences } from '../context/PreferencesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['welcome', 'age', 'readingType', 'themes'];

export default function OnboardingScreen({ onComplete }) {
  const { completeOnboarding } = usePreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedReadingType, setSelectedReadingType] = useState(null);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(callback, 150);
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      animateTransition(() => setCurrentStep(currentStep + 1));
    } else {
      // Complete onboarding
      completeOnboarding({
        childAgeRange: selectedAge,
        readingType: selectedReadingType,
        themes: selectedThemes,
      });
      onComplete?.();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(currentStep - 1));
    }
  };

  const toggleTheme = (themeId) => {
    setSelectedThemes(prev =>
      prev.includes(themeId)
        ? prev.filter(t => t !== themeId)
        : [...prev, themeId]
    );
  };

  const canProceed = () => {
    switch (STEPS[currentStep]) {
      case 'welcome':
        return true;
      case 'age':
        return selectedAge !== null;
      case 'readingType':
        return selectedReadingType !== null;
      case 'themes':
        return true; // Themes are optional
      default:
        return false;
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>📚</Text>
      <Text style={styles.title}>Welcome to StoryScout</Text>
      <Text style={styles.subtitle}>
        Tell us about your child and we'll find the perfect book for every moment.
      </Text>
      <View style={styles.featureList}>
        <FeatureItem emoji="🎯" text="Personalized recommendations" />
        <FeatureItem emoji="⏱️" text="Books for any amount of time" />
        <FeatureItem emoji="😌" text="Match books to your child's mood" />
      </View>
    </View>
  );

  const renderAgeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How old is your child?</Text>
      <Text style={styles.stepSubtitle}>
        We'll recommend age-appropriate books
      </Text>
      <View style={styles.optionsGrid}>
        {AGE_RANGES.map(age => (
          <Pressable
            key={age.id}
            style={[
              styles.optionCard,
              selectedAge === age.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedAge(age.id)}
          >
            <Text style={styles.optionEmoji}>{age.emoji}</Text>
            <Text style={[
              styles.optionLabel,
              selectedAge === age.id && styles.optionLabelSelected,
            ]}>
              {age.label}
            </Text>
            <Text style={styles.optionDescription}>{age.description}</Text>
            {selectedAge === age.id && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderReadingType = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How will they read?</Text>
      <Text style={styles.stepSubtitle}>
        This helps us pick the right complexity
      </Text>
      <View style={styles.optionsList}>
        {READING_TYPES.map(type => (
          <Pressable
            key={type.id}
            style={[
              styles.listOption,
              selectedReadingType === type.id && styles.listOptionSelected,
            ]}
            onPress={() => setSelectedReadingType(type.id)}
          >
            <Text style={styles.listOptionEmoji}>{type.emoji}</Text>
            <View style={styles.listOptionText}>
              <Text style={[
                styles.listOptionLabel,
                selectedReadingType === type.id && styles.listOptionLabelSelected,
              ]}>
                {type.label}
              </Text>
              <Text style={styles.listOptionDescription}>{type.description}</Text>
            </View>
            {selectedReadingType === type.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderThemes = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What themes interest them?</Text>
      <Text style={styles.stepSubtitle}>
        Select any that apply (optional)
      </Text>
      <View style={styles.themesGrid}>
        {THEMES.map(theme => (
          <Pressable
            key={theme.id}
            style={[
              styles.themeChip,
              selectedThemes.includes(theme.id) && {
                backgroundColor: theme.color,
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
  );

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'welcome':
        return renderWelcome();
      case 'age':
        return renderAgeSelection();
      case 'readingType':
        return renderReadingType();
      case 'themes':
        return renderThemes();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 ? (
          <Pressable style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text.secondary} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        <Pressable
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
          ]}
          onPress={goNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primary.contrast} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, text }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary.main,
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.bodyLarge * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureList: {
    width: '100%',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.md,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  stepTitle: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  optionCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  optionEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionLabelSelected: {
    color: colors.primary.main,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  optionsList: {
    width: '100%',
    gap: spacing.md,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.md,
  },
  listOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  listOptionEmoji: {
    fontSize: 32,
  },
  listOptionText: {
    flex: 1,
  },
  listOptionLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  listOptionLabelSelected: {
    color: colors.primary.main,
  },
  listOptionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  themesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  themeEmoji: {
    fontSize: 18,
  },
  themeLabel: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  themeLabelSelected: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
    gap: spacing.sm,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.primary.contrast,
  },
});

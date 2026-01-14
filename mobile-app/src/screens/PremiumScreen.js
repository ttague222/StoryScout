/**
 * Premium Screen
 *
 * Subscription upgrade screen showing:
 * - Free vs Premium comparison
 * - Pricing
 * - Purchase buttons
 */

import React, { useState } from 'react';
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
import { usePremium } from '../context/PremiumContext';

const PREMIUM_FEATURES = [
  {
    icon: 'infinite',
    title: 'Unlimited Recommendations',
    description: 'Get as many book suggestions as you need, any time',
  },
  {
    icon: 'heart',
    title: 'Unlimited Saved Books',
    description: 'Save your entire reading list without limits',
  },
  {
    icon: 'snow',
    title: 'Seasonal Collections',
    description: 'Access themed book lists for holidays and special occasions',
  },
  {
    icon: 'sparkles',
    title: 'Priority Recommendations',
    description: 'Get the best matches powered by our advanced algorithm',
  },
];

const PRICING_OPTIONS = [
  {
    id: 'monthly',
    period: 'Monthly',
    price: '$4.99',
    pricePerMonth: '$4.99/mo',
    savings: null,
  },
  {
    id: 'yearly',
    period: 'Yearly',
    price: '$29.99',
    pricePerMonth: '$2.50/mo',
    savings: 'Save 50%',
    recommended: true,
  },
];

export default function PremiumScreen() {
  const navigation = useNavigation();
  const { purchasePremium, isPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const success = await purchasePremium(selectedPlan);
      if (success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.alreadyPremium}>
          <Ionicons name="star" size={64} color={colors.premium.gold} />
          <Text style={styles.alreadyPremiumTitle}>You're Premium!</Text>
          <Text style={styles.alreadyPremiumText}>
            Enjoy unlimited recommendations and saved books.
          </Text>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="star" size={40} color={colors.premium.gold} />
          </View>
          <Text style={styles.heroTitle}>Upgrade to Premium</Text>
          <Text style={styles.heroSubtitle}>
            Unlimited recommendations for every reading moment
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color={colors.primary.main} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Options */}
        <View style={styles.pricingSection}>
          <Text style={styles.pricingSectionTitle}>Choose your plan</Text>
          <View style={styles.pricingOptions}>
            {PRICING_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.pricingCard,
                  selectedPlan === option.id && styles.pricingCardSelected,
                  option.recommended && styles.pricingCardRecommended,
                ]}
                onPress={() => setSelectedPlan(option.id)}
              >
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Best Value</Text>
                  </View>
                )}
                <View style={styles.pricingHeader}>
                  <Text style={styles.pricingPeriod}>{option.period}</Text>
                  {option.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{option.savings}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pricingPrice}>{option.price}</Text>
                <Text style={styles.pricingPerMonth}>{option.pricePerMonth}</Text>
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radio,
                    selectedPlan === option.id && styles.radioSelected,
                  ]}>
                    {selectedPlan === option.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          Payment will be charged to your App Store account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary.contrast} />
          ) : (
            <>
              <Ionicons name="star" size={22} color={colors.primary.contrast} />
              <Text style={styles.purchaseButtonText}>
                Start Premium - {PRICING_OPTIONS.find(p => p.id === selectedPlan)?.price}
              </Text>
            </>
          )}
        </Pressable>
        <Pressable style={styles.restoreButton}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.premium.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  featuresSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  pricingSection: {
    marginBottom: spacing.lg,
  },
  pricingSectionTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pricingOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  pricingCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  pricingCardRecommended: {
    borderColor: colors.premium.gold,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.premium.gold,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  recommendedText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#FFF',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  pricingPeriod: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  savingsBadge: {
    backgroundColor: colors.status.success + '20',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    marginTop: spacing.xs,
  },
  savingsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
  },
  pricingPrice: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pricingPerMonth: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  radioContainer: {
    marginTop: spacing.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary.main,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.main,
  },
  terms: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.sm,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    gap: spacing.sm,
    ...shadows.md,
  },
  purchaseButtonText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
    color: colors.primary.contrast,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  restoreButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  alreadyPremium: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  alreadyPremiumTitle: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  alreadyPremiumText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
    marginTop: spacing.lg,
  },
  closeButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.primary.contrast,
  },
});

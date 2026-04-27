/**
 * Results Screen
 *
 * Displays book recommendations based on user selections
 * Shows 3-5 books with "Why this fits" explanations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { MOODS, TIME_OPTIONS } from '../config/options';
import { useSavedBooks } from '../context/SavedBooksContext';
import { usePremium } from '../context/PremiumContext';
import { usePreferences } from '../context/PreferencesContext';
import { api } from '../services/api';

export default function ResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mood, time, ageRange, themes: kidThemes, kidName } = route.params || {};
  const { isBookSaved, toggleSaveBook } = useSavedBooks();
  const { incrementUsage } = usePremium();
  const { childAgeRange, themes: defaultThemes } = usePreferences();

  // Use kid-specific values if passed, otherwise fall back to preferences
  const effectiveAgeRange = ageRange || childAgeRange;
  const effectiveThemes = kidThemes?.length > 0 ? kidThemes : (defaultThemes || []);

  console.log('[ResultsScreen] route.params:', route.params);
  console.log('[ResultsScreen] ageRange from params:', ageRange);
  console.log('[ResultsScreen] childAgeRange from prefs:', childAgeRange);
  console.log('[ResultsScreen] effectiveAgeRange:', effectiveAgeRange);

  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const moodInfo = MOODS.find(m => m.id === mood);
  const timeInfo = TIME_OPTIONS.find(t => t.id === time);

  // Fetch recommendations from API
  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const recommendations = await api.getRecommendations({
        mood,
        time,
        ageRange: effectiveAgeRange,
        themes: effectiveThemes,
      });

      setBooks(recommendations);

      // Track usage (only on initial load, not refresh)
      if (!isRefresh) {
        incrementUsage();
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setBooks([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [mood, time, effectiveAgeRange, effectiveThemes, incrementUsage]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleBookPress = (book) => {
    navigation.navigate('BookDetail', { book });
  };

  const handleSavePress = (book) => {
    toggleSaveBook(book);
  };

  const handleTryAgain = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Finding the perfect books...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Books</Text>
          <View style={styles.headerTags}>
            {moodInfo && (
              <View style={[styles.tag, { backgroundColor: moodInfo.color + '30' }]}>
                <Text style={styles.tagText}>{moodInfo.emoji} {moodInfo.label}</Text>
              </View>
            )}
            {timeInfo && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{timeInfo.emoji} {timeInfo.label}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRecommendations(true)}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Results count */}
        <Text style={styles.resultsCount}>
          We found {books.length} book{books.length !== 1 ? 's' : ''} for you
        </Text>

        {/* Book cards */}
        <View style={styles.booksContainer}>
          {books.map((book, index) => (
            <Pressable
              key={book.id}
              style={styles.bookCard}
              onPress={() => handleBookPress(book)}
            >
              <View style={styles.bookCoverContainer}>
                <Image
                  source={{ uri: book.coverUrl }}
                  style={styles.bookCover}
                  resizeMode="cover"
                />
                <Pressable
                  style={[
                    styles.saveButton,
                    isBookSaved(book.id) && styles.saveButtonActive,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSavePress(book);
                  }}
                >
                  <Ionicons
                    name={isBookSaved(book.id) ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isBookSaved(book.id) ? colors.status.error : colors.text.secondary}
                  />
                </Pressable>
              </View>

              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>

                <View style={styles.bookMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.metaText}>{book.readingTime}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.metaText}>{book.ageRange} yrs</Text>
                  </View>
                </View>

                <View style={styles.whyContainer}>
                  <Text style={styles.whyLabel}>Why this fits:</Text>
                  <Text style={styles.whyText} numberOfLines={2}>{book.whyItFits}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Try again button */}
        <Pressable style={styles.tryAgainButton} onPress={handleTryAgain}>
          <Ionicons name="refresh" size={20} color={colors.primary.main} />
          <Text style={styles.tryAgainText}>Try Different Options</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerTags: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  tagText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  resultsCount: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  booksContainer: {
    gap: spacing.lg,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  bookCoverContainer: {
    position: 'relative',
  },
  bookCover: {
    width: 100,
    height: 150,
    backgroundColor: colors.background.tertiary,
  },
  saveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: 'rgba(255,255,255,1)',
  },
  bookInfo: {
    flex: 1,
    padding: spacing.md,
  },
  bookTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  bookAuthor: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  bookMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  whyContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  whyLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary.main,
    marginBottom: 2,
  },
  whyText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: typography.sizes.xs * 1.4,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: radii.full,
  },
  tryAgainText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.primary.main,
  },
});

/**
 * Book Detail Screen
 *
 * Shows full book details:
 * - Large cover image
 * - Title, author
 * - Expanded "Why this book" explanation
 * - Key themes
 * - Reading length estimate
 * - Save/favorite button
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// Amazon Associates affiliate tag - replace with your own
const AMAZON_AFFILIATE_TAG = 'storyscout-20';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { THEMES } from '../config/options';
import { useSavedBooks } from '../context/SavedBooksContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_WIDTH = SCREEN_WIDTH * 0.5;
const COVER_HEIGHT = COVER_WIDTH * 1.5;

export default function BookDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { book } = route.params || {};
  const { isBookSaved, toggleSaveBook } = useSavedBooks();

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Book not found</Text>
          <Pressable style={styles.backButtonError} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonErrorText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isSaved = isBookSaved(book.id);

  // Share the book
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${book.title}" by ${book.author} - a great book for ${book.ageRange} year olds! Found via StoryScout.`,
        title: book.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Open Amazon search for this book
  const handleBuyOnAmazon = () => {
    // If book has ISBN, use it for direct product search (most reliable)
    // The book.id is often the ISBN from Open Library
    const bookId = book.id || '';
    const isIsbn = /^\d{10}$|^\d{13}$/.test(bookId);

    let amazonUrl;
    if (isIsbn) {
      // Search by ISBN for exact match
      amazonUrl = `https://www.amazon.com/s?k=${bookId}&tag=${AMAZON_AFFILIATE_TAG}`;
    } else {
      // Search by title and author
      const searchQuery = encodeURIComponent(`"${book.title}" ${book.author}`);
      amazonUrl = `https://www.amazon.com/s?k=${searchQuery}&i=stripbooks&tag=${AMAZON_AFFILIATE_TAG}`;
    }

    Linking.openURL(amazonUrl);
  };

  // Get theme info for display
  const bookThemes = (book.themes || []).map(themeId => {
    const theme = THEMES.find(t => t.id === themeId);
    return theme || { id: themeId, label: themeId, emoji: '📖', color: colors.primary.light };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: book.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        {/* Title & Author */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
        </View>

        {/* Meta info */}
        <View style={styles.metaSection}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary.main} />
            <View>
              <Text style={styles.metaValue}>{book.readingTime}</Text>
              <Text style={styles.metaLabel}>Reading time</Text>
            </View>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={20} color={colors.primary.main} />
            <View>
              <Text style={styles.metaValue}>{book.ageRange} years</Text>
              <Text style={styles.metaLabel}>Age range</Text>
            </View>
          </View>
        </View>

        {/* Why This Book */}
        <View style={styles.whySection}>
          <View style={styles.whyHeader}>
            <Ionicons name="sparkles" size={20} color={colors.accent.main} />
            <Text style={styles.whyTitle}>Why this book</Text>
          </View>
          <Text style={styles.whyText}>{book.whyItFits}</Text>
        </View>

        {/* Themes */}
        {bookThemes.length > 0 && (
          <View style={styles.themesSection}>
            <Text style={styles.sectionTitle}>Key themes</Text>
            <View style={styles.themesContainer}>
              {bookThemes.map(theme => (
                <View
                  key={theme.id}
                  style={[styles.themeChip, { backgroundColor: theme.color + '30' }]}
                >
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional Info Placeholder */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About this book</Text>
          <Text style={styles.infoText}>
            This book is perfect for {book.ageRange === '2-3' ? 'toddlers' :
              book.ageRange === '4-5' ? 'preschoolers' :
              book.ageRange === '6-7' ? 'early readers' : 'independent readers'}.
            {book.readingTime === '5 min' ? ' A quick read that keeps attention.' :
              book.readingTime === '10 min' ? ' Great for regular story time.' :
              ' Perfect when you have more time to explore.'}
          </Text>
        </View>

        {/* Buy on Amazon Button */}
        <Pressable style={styles.amazonButton} onPress={handleBuyOnAmazon}>
          <Ionicons name="cart-outline" size={20} color={colors.text.inverse} />
          <Text style={styles.amazonButtonText}>Buy on Amazon</Text>
          <Ionicons name="open-outline" size={16} color={colors.text.inverse} />
        </Pressable>
        <Text style={styles.affiliateDisclosure}>
          As an Amazon Associate, we earn from qualifying purchases.
        </Text>

        {/* Spacer for button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.saveButton,
            isSaved && styles.saveButtonSaved,
          ]}
          onPress={() => toggleSaveBook(book)}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={24}
            color={isSaved ? colors.background.card : colors.primary.contrast}
          />
          <Text style={[
            styles.saveButtonText,
            isSaved && styles.saveButtonTextSaved,
          ]}>
            {isSaved ? 'Saved to Library' : 'Save to Library'}
          </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  backButtonError: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
  },
  backButtonErrorText: {
    color: colors.primary.contrast,
    fontWeight: typography.weights.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  coverContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  coverImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: colors.background.tertiary,
    ...shadows.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  author: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  metaSection: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    ...shadows.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  metaDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  metaValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  metaLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  whySection: {
    backgroundColor: colors.accent.main + '15',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  whyTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.accent.dark,
  },
  whyText: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  themesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  themesContainer: {
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
    gap: spacing.xs,
  },
  themeEmoji: {
    fontSize: 16,
  },
  themeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    gap: spacing.sm,
    ...shadows.md,
  },
  saveButtonSaved: {
    backgroundColor: colors.status.error,
  },
  saveButtonText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
    color: colors.primary.contrast,
  },
  saveButtonTextSaved: {
    color: colors.background.card,
  },
  amazonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9900',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  amazonButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  affiliateDisclosure: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
});

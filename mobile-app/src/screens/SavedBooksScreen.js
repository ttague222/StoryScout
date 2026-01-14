/**
 * Saved Books Screen
 *
 * Displays the user's saved/favorited books
 * Ability to remove books from saved list
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { useSavedBooks } from '../context/SavedBooksContext';
import { usePremium } from '../context/PremiumContext';

export default function SavedBooksScreen() {
  const navigation = useNavigation();
  const { savedBooks, removeBook, savedCount } = useSavedBooks();
  const { maxSavedBooks, isPremium } = usePremium();
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(k => k + 1);
    }, [])
  );

  const handleBookPress = (book) => {
    navigation.navigate('BookDetail', { book });
  };

  const handleRemoveBook = (book) => {
    Alert.alert(
      'Remove Book',
      `Remove "${book.title}" from your saved books?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeBook(book.id),
        },
      ]
    );
  };

  const formatSavedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Check if near limit (free tier)
  const nearLimit = !isPremium && savedCount >= maxSavedBooks - 2;
  const atLimit = !isPremium && savedCount >= maxSavedBooks;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
        <Text style={styles.subtitle}>
          {savedCount} book{savedCount !== 1 ? 's' : ''} saved
          {!isPremium && ` (${maxSavedBooks} max)`}
        </Text>
      </View>

      {/* Limit warning */}
      {nearLimit && !atLimit && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color={colors.status.warning} />
          <Text style={styles.warningText}>
            You're almost at your limit. Upgrade for unlimited saves.
          </Text>
          <Pressable
            style={styles.upgradeLink}
            onPress={() => navigation.navigate('Premium')}
          >
            <Text style={styles.upgradeLinkText}>Upgrade</Text>
          </Pressable>
        </View>
      )}

      {atLimit && (
        <View style={[styles.warningBanner, styles.errorBanner]}>
          <Ionicons name="alert-circle" size={18} color={colors.status.error} />
          <Text style={styles.warningText}>
            Library full. Remove books or upgrade to save more.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        key={refreshKey}
      >
        {savedBooks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No saved books yet</Text>
            <Text style={styles.emptyText}>
              When you find books you love, save them here for easy access.
            </Text>
            <Pressable
              style={styles.findBooksButton}
              onPress={() => navigation.navigate('Recommend')}
            >
              <Ionicons name="search" size={20} color={colors.primary.contrast} />
              <Text style={styles.findBooksText}>Find Books</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.booksGrid}>
            {savedBooks.map((book, index) => (
              <Pressable
                key={book.id}
                style={styles.bookCard}
                onPress={() => handleBookPress(book)}
              >
                <View style={styles.coverContainer}>
                  <Image
                    source={{ uri: book.coverUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveBook(book);
                    }}
                  >
                    <Ionicons name="close" size={16} color={colors.text.secondary} />
                  </Pressable>
                </View>
                <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                {book.savedAt && (
                  <Text style={styles.savedDate}>{formatSavedDate(book.savedAt)}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warning + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.status.error + '15',
  },
  warningText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  upgradeLink: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  upgradeLinkText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary.main,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  findBooksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
    gap: spacing.sm,
  },
  findBooksText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.primary.contrast,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bookCard: {
    width: '47%',
    marginBottom: spacing.md,
  },
  coverContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 0.67,
    borderRadius: radii.md,
    backgroundColor: colors.background.tertiary,
    ...shadows.sm,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  savedDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});

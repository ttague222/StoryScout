/**
 * Saved Books Context
 *
 * Manages the user's saved/favorited books
 * Local persistence with cloud sync capability
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_BOOKS_STORAGE_KEY = '@storyscout_saved_books';

const SavedBooksContext = createContext(null);

export function SavedBooksProvider({ children }) {
  const [savedBooks, setSavedBooks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved books on mount
  useEffect(() => {
    loadSavedBooks();
  }, []);

  const loadSavedBooks = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_BOOKS_STORAGE_KEY);
      if (saved) {
        setSavedBooks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved books:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const persistBooks = useCallback(async (books) => {
    try {
      await AsyncStorage.setItem(SAVED_BOOKS_STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving books:', error);
    }
  }, []);

  // Save a book
  const saveBook = useCallback((book) => {
    setSavedBooks(prev => {
      // Check if already saved
      if (prev.some(b => b.id === book.id)) {
        return prev;
      }

      const bookWithTimestamp = {
        ...book,
        savedAt: new Date().toISOString(),
      };

      const updated = [bookWithTimestamp, ...prev];
      persistBooks(updated);
      return updated;
    });
  }, [persistBooks]);

  // Remove a book
  const removeBook = useCallback((bookId) => {
    setSavedBooks(prev => {
      const updated = prev.filter(b => b.id !== bookId);
      persistBooks(updated);
      return updated;
    });
  }, [persistBooks]);

  // Check if a book is saved
  const isBookSaved = useCallback((bookId) => {
    return savedBooks.some(b => b.id === bookId);
  }, [savedBooks]);

  // Toggle save status
  const toggleSaveBook = useCallback((book) => {
    if (isBookSaved(book.id)) {
      removeBook(book.id);
      return false;
    } else {
      saveBook(book);
      return true;
    }
  }, [isBookSaved, removeBook, saveBook]);

  // Clear all saved books
  const clearAllBooks = useCallback(async () => {
    setSavedBooks([]);
    await AsyncStorage.removeItem(SAVED_BOOKS_STORAGE_KEY);
  }, []);

  const value = {
    savedBooks,
    isLoaded,
    saveBook,
    removeBook,
    isBookSaved,
    toggleSaveBook,
    clearAllBooks,
    savedCount: savedBooks.length,
  };

  return (
    <SavedBooksContext.Provider value={value}>
      {children}
    </SavedBooksContext.Provider>
  );
}

export function useSavedBooks() {
  const context = useContext(SavedBooksContext);
  if (!context) {
    throw new Error('useSavedBooks must be used within a SavedBooksProvider');
  }
  return context;
}

export default SavedBooksContext;

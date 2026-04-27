/**
 * API Service
 *
 * Handles all API communication with the StoryScout backend
 * Supports both real API and fallback mock data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration
const getBaseUrl = () => {
  // Always use production API (Cloud Run)
  // Local development can override by changing this
  return 'https://storyscout-api-447022398745.us-central1.run.app';
};

const API_BASE_URL = getBaseUrl();
const AUTH_TOKEN_KEY = '@storyscout_auth_token';
const USE_MOCK_FALLBACK = true; // Fall back to mock data if API fails

// Mock book database for fallback
const MOCK_BOOKS_DB = [
  {
    id: 'book_001',
    title: 'Goodnight Moon',
    author: 'Margaret Wise Brown',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780064430173-M.jpg',
    age_range: '2-3',
    reading_time: '5 min',
    themes: ['bedtime', 'animals'],
    description: 'A beloved bedtime classic that says goodnight to everything in the great green room.',
    why_it_fits: 'The rhythmic, soothing text makes it perfect for winding down before sleep.',
  },
  {
    id: 'book_002',
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780060254926-M.jpg',
    age_range: '4-5',
    reading_time: '10 min',
    themes: ['adventure', 'emotions'],
    description: 'Max sails to where the wild things are and becomes their king.',
    why_it_fits: 'A timeless adventure that validates big feelings and the comfort of home.',
  },
  {
    id: 'book_003',
    title: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780399226908-M.jpg',
    age_range: '2-3',
    reading_time: '5 min',
    themes: ['animals', 'learning'],
    description: 'Follow a caterpillar as he eats through the week and transforms into a butterfly.',
    why_it_fits: 'Teaches counting and days of the week through an engaging, colorful story.',
  },
  {
    id: 'book_004',
    title: 'Dragons Love Tacos',
    author: 'Adam Rubin',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780803736801-M.jpg',
    age_range: '4-5',
    reading_time: '8 min',
    themes: ['humor', 'adventure'],
    description: 'Dragons love tacos, but watch out for the spicy salsa!',
    why_it_fits: 'Guaranteed giggles with absurd humor that kids and parents both enjoy.',
  },
  {
    id: 'book_005',
    title: 'The Feelings Book',
    author: 'Todd Parr',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780316043465-M.jpg',
    age_range: '2-3',
    reading_time: '5 min',
    themes: ['emotions', 'kindness'],
    description: 'A colorful exploration of all the feelings we can feel.',
    why_it_fits: 'Simple text and bold illustrations help kids identify and discuss emotions.',
  },
  {
    id: 'book_006',
    title: "Charlotte's Web",
    author: 'E.B. White',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780064400558-M.jpg',
    age_range: '8-10',
    reading_time: '20 min',
    themes: ['friendship', 'animals', 'emotions'],
    description: 'The friendship between a pig named Wilbur and a spider named Charlotte.',
    why_it_fits: 'A timeless story about friendship, loyalty, and the circle of life.',
  },
  {
    id: 'book_007',
    title: 'Dog Man',
    author: 'Dav Pilkey',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780545581608-M.jpg',
    age_range: '6-7',
    reading_time: '15 min',
    themes: ['humor', 'adventure'],
    description: 'Part dog, part police officer, all hero!',
    why_it_fits: 'Graphic novel format and hilarious adventures that reluctant readers love.',
  },
  {
    id: 'book_008',
    title: 'The Giving Tree',
    author: 'Shel Silverstein',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780060256654-M.jpg',
    age_range: '4-5',
    reading_time: '10 min',
    themes: ['kindness', 'emotions', 'nature'],
    description: 'A tree gives everything it has to a boy it loves.',
    why_it_fits: 'A moving story about unconditional love and generosity.',
  },
  {
    id: 'book_009',
    title: 'Pete the Cat: I Love My White Shoes',
    author: 'James Dean',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780061906220-M.jpg',
    age_range: '2-3',
    reading_time: '5 min',
    themes: ['humor', 'kindness'],
    description: 'Pete the cat keeps his cool no matter what happens.',
    why_it_fits: 'Catchy repetitive text and a positive message about staying calm.',
  },
  {
    id: 'book_010',
    title: 'The Cat in the Hat',
    author: 'Dr. Seuss',
    cover_url: 'https://covers.openlibrary.org/b/isbn/9780394800011-M.jpg',
    age_range: '4-5',
    reading_time: '10 min',
    themes: ['humor', 'adventure'],
    description: 'A rainy day turns into wild fun when the Cat in the Hat arrives.',
    why_it_fits: 'The perfect mix of silly rhymes and mischievous adventure.',
  },
];

// Mood mappings for mock filtering
const MOOD_TO_THEMES = {
  calm: ['bedtime', 'nature', 'kindness'],
  silly: ['humor', 'adventure'],
  adventurous: ['adventure', 'learning'],
  emotional: ['emotions', 'kindness', 'friendship'],
};

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
    this.isOnline = true;
  }

  // Initialize token from storage
  async init() {
    try {
      this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  // Set auth token
  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  // Clear auth token
  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // Base fetch wrapper with error handling
  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      this.isOnline = true;
      return response.json();
    } catch (error) {
      console.warn(`API fetch error (${endpoint}):`, error.message);
      this.isOnline = false;
      throw error;
    }
  }

  /**
   * Get book recommendations based on user preferences
   *
   * @param {Object} params - Recommendation parameters
   * @param {string} params.mood - Selected mood (calm, silly, adventurous, emotional)
   * @param {string} params.time - Time available (quick, medium, long)
   * @param {string} params.ageRange - Child's age range
   * @param {string} params.readingType - Reading type (read-aloud, independent, both)
   * @param {string[]} params.themes - Preferred themes
   * @returns {Promise<Object[]>} Array of book recommendations
   */
  async getRecommendations({ mood, time, ageRange, readingType, themes = [] }) {
    // Try real API first
    try {
      console.log('[API] Fetching recommendations with:', { mood, time, ageRange, themes });

      const response = await this.fetch('/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          mood,
          time,
          age_range: ageRange,
          reading_type: readingType,
          themes,
        }),
      });

      console.log('[API] Got response:', response);

      // Transform response to match expected format
      return response.books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        ageRange: book.age_range,
        readingTime: book.reading_time,
        themes: book.themes,
        description: book.description,
        whyItFits: book.why_it_fits,
      }));
    } catch (error) {
      console.warn('API unavailable, using mock data:', error.message);

      if (!USE_MOCK_FALLBACK) {
        throw error;
      }

      // Fall back to mock data
      return this._getMockRecommendations({ mood, time, ageRange, themes });
    }
  }

  /**
   * Get mock recommendations (fallback when API is unavailable)
   */
  _getMockRecommendations({ mood, time, ageRange, themes }) {
    let filtered = [...MOCK_BOOKS_DB];

    // Filter by mood (match themes associated with mood)
    if (mood) {
      const moodThemes = MOOD_TO_THEMES[mood] || [];
      filtered = filtered.filter(book =>
        book.themes.some(t => moodThemes.includes(t))
      );
    }

    // Filter by age range
    if (ageRange) {
      filtered = filtered.filter(book => {
        const bookAges = book.age_range.split('-').map(Number);
        const userAges = ageRange.split('-').map(Number);
        return bookAges[0] <= userAges[1] && bookAges[1] >= userAges[0];
      });
    }

    // Filter by time
    if (time) {
      const timeMap = { quick: 7, medium: 15, long: 30 };
      const maxMinutes = timeMap[time] || 15;
      filtered = filtered.filter(book => {
        const bookMinutes = parseInt(book.reading_time) || 10;
        return bookMinutes <= maxMinutes;
      });
    }

    // Boost books that match themes
    if (themes && themes.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aMatches = a.themes.filter(t => themes.includes(t)).length;
        const bMatches = b.themes.filter(t => themes.includes(t)).length;
        return bMatches - aMatches;
      });
    }

    // Shuffle and return 3-5 books
    filtered = filtered.sort(() => Math.random() - 0.5);
    const count = Math.min(filtered.length, Math.floor(Math.random() * 3) + 3);

    // Transform to expected format
    return filtered.slice(0, count).map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.cover_url,
      ageRange: book.age_range,
      readingTime: book.reading_time,
      themes: book.themes,
      description: book.description,
      whyItFits: book.why_it_fits,
    }));
  }

  /**
   * Get book details by ID
   */
  async getBookById(bookId) {
    try {
      const book = await this.fetch(`/books/${bookId}`);
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        ageRange: book.age_range,
        readingTime: book.reading_time,
        themes: book.themes,
        description: book.description,
        whyItFits: book.why_it_fits,
      };
    } catch (error) {
      if (!USE_MOCK_FALLBACK) throw error;

      // Fall back to mock
      const book = MOCK_BOOKS_DB.find(b => b.id === bookId);
      if (!book) return null;

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        ageRange: book.age_range,
        readingTime: book.reading_time,
        themes: book.themes,
        description: book.description,
        whyItFits: book.why_it_fits,
      };
    }
  }

  /**
   * Search books by query
   */
  async searchBooks(query) {
    try {
      const books = await this.fetch(`/books?q=${encodeURIComponent(query)}`);
      return books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        ageRange: book.age_range,
        readingTime: book.reading_time,
        themes: book.themes,
      }));
    } catch (error) {
      if (!USE_MOCK_FALLBACK) throw error;

      // Fall back to mock
      const lowerQuery = query.toLowerCase();
      return MOCK_BOOKS_DB.filter(book =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        book.themes.some(t => t.includes(lowerQuery))
      ).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        ageRange: book.age_range,
        readingTime: book.reading_time,
        themes: book.themes,
      }));
    }
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await this.fetch('/health');
      this.isOnline = response.status === 'healthy';
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Save user feedback on a recommendation
   */
  async saveFeedback(bookId, feedback) {
    try {
      return await this.fetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ bookId, feedback }),
      });
    } catch (error) {
      console.log('Feedback saved locally:', { bookId, feedback });
      return { success: true, offline: true };
    }
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;

/**
 * API Service
 *
 * Handles all API communication with the backend
 * Currently uses mock data, will be connected to Cloud Run API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080'  // Local development
  : 'https://api.storyscout.app'; // Production (placeholder)

const AUTH_TOKEN_KEY = '@storyscout_auth_token';

// Mock book database for MVP
const MOCK_BOOKS_DB = [
  {
    id: 'book_001',
    title: 'Goodnight Moon',
    author: 'Margaret Wise Brown',
    coverUrl: 'https://via.placeholder.com/150x220/A8D5BA/FFFFFF?text=Goodnight+Moon',
    ageRange: '2-3',
    readingTime: '5 min',
    themes: ['bedtime', 'animals'],
    mood: ['calm'],
    description: 'A beloved bedtime classic that says goodnight to everything in the great green room.',
    whyItFits: 'The rhythmic, soothing text makes it perfect for winding down before sleep.',
  },
  {
    id: 'book_002',
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    coverUrl: 'https://via.placeholder.com/150x220/6BB3E0/FFFFFF?text=Wild+Things',
    ageRange: '4-5',
    readingTime: '10 min',
    themes: ['adventure', 'emotions'],
    mood: ['adventurous', 'emotional'],
    description: 'Max sails to where the wild things are and becomes their king.',
    whyItFits: 'A timeless adventure that validates big feelings and the comfort of home.',
  },
  {
    id: 'book_003',
    title: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    coverUrl: 'https://via.placeholder.com/150x220/98D8C8/FFFFFF?text=Caterpillar',
    ageRange: '2-3',
    readingTime: '5 min',
    themes: ['animals', 'learning'],
    mood: ['calm', 'silly'],
    description: 'Follow a caterpillar as he eats through the week and transforms into a butterfly.',
    whyItFits: 'Teaches counting and days of the week through an engaging, colorful story.',
  },
  {
    id: 'book_004',
    title: 'Dragons Love Tacos',
    author: 'Adam Rubin',
    coverUrl: 'https://via.placeholder.com/150x220/FFD93D/333333?text=Dragons',
    ageRange: '4-5',
    readingTime: '8 min',
    themes: ['humor', 'adventure'],
    mood: ['silly'],
    description: 'Dragons love tacos, but watch out for the spicy salsa!',
    whyItFits: 'Guaranteed giggles with absurd humor that kids and parents both enjoy.',
  },
  {
    id: 'book_005',
    title: 'The Feelings Book',
    author: 'Todd Parr',
    coverUrl: 'https://via.placeholder.com/150x220/DDA0DD/FFFFFF?text=Feelings',
    ageRange: '2-3',
    readingTime: '5 min',
    themes: ['emotions', 'kindness'],
    mood: ['emotional', 'calm'],
    description: 'A colorful exploration of all the feelings we can feel.',
    whyItFits: 'Simple text and bold illustrations help kids identify and discuss emotions.',
  },
  {
    id: 'book_006',
    title: 'Charlotte\'s Web',
    author: 'E.B. White',
    coverUrl: 'https://via.placeholder.com/150x220/90EE90/333333?text=Charlotte',
    ageRange: '8-10',
    readingTime: '20 min',
    themes: ['friendship', 'animals', 'emotions'],
    mood: ['emotional', 'calm'],
    description: 'The friendship between a pig named Wilbur and a spider named Charlotte.',
    whyItFits: 'A timeless story about friendship, loyalty, and the circle of life.',
  },
  {
    id: 'book_007',
    title: 'Dog Man',
    author: 'Dav Pilkey',
    coverUrl: 'https://via.placeholder.com/150x220/FFE66D/333333?text=Dog+Man',
    ageRange: '6-7',
    readingTime: '15 min',
    themes: ['humor', 'adventure'],
    mood: ['silly', 'adventurous'],
    description: 'Part dog, part police officer, all hero!',
    whyItFits: 'Graphic novel format and hilarious adventures that reluctant readers love.',
  },
  {
    id: 'book_008',
    title: 'The Giving Tree',
    author: 'Shel Silverstein',
    coverUrl: 'https://via.placeholder.com/150x220/C8E6C9/333333?text=Giving+Tree',
    ageRange: '4-5',
    readingTime: '10 min',
    themes: ['kindness', 'emotions', 'nature'],
    mood: ['emotional', 'calm'],
    description: 'A tree gives everything it has to a boy it loves.',
    whyItFits: 'A moving story about unconditional love and generosity.',
  },
  {
    id: 'book_009',
    title: 'Pete the Cat',
    author: 'James Dean',
    coverUrl: 'https://via.placeholder.com/150x220/87CEEB/FFFFFF?text=Pete+Cat',
    ageRange: '2-3',
    readingTime: '5 min',
    themes: ['humor', 'kindness'],
    mood: ['silly', 'calm'],
    description: 'Pete the cat keeps his cool no matter what happens.',
    whyItFits: 'Catchy repetitive text and a positive message about staying calm.',
  },
  {
    id: 'book_010',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    coverUrl: 'https://via.placeholder.com/150x220/9B89B3/FFFFFF?text=Harry+Potter',
    ageRange: '8-10',
    readingTime: '25 min',
    themes: ['adventure', 'friendship', 'learning'],
    mood: ['adventurous'],
    description: 'A young wizard discovers his magical destiny.',
    whyItFits: 'The perfect chapter book to spark imagination and a love of reading.',
  },
];

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
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

  // Base fetch wrapper
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

      return response.json();
    } catch (error) {
      console.error(`API fetch error (${endpoint}):`, error);
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
    // TODO: Replace with actual API call when backend is ready
    // return this.fetch('/recommendations', {
    //   method: 'POST',
    //   body: JSON.stringify({ mood, time, ageRange, readingType, themes }),
    // });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    // Filter mock books based on parameters
    let filtered = [...MOCK_BOOKS_DB];

    // Filter by mood
    if (mood) {
      filtered = filtered.filter(book =>
        book.mood.includes(mood)
      );
    }

    // Filter by age range
    if (ageRange) {
      filtered = filtered.filter(book => {
        // Parse age ranges and check overlap
        const bookAges = book.ageRange.split('-').map(Number);
        const userAges = ageRange.split('-').map(Number);
        return bookAges[0] <= userAges[1] && bookAges[1] >= userAges[0];
      });
    }

    // Filter by time (reading time in minutes)
    if (time) {
      const timeMap = { quick: 5, medium: 12, long: 25 };
      const maxMinutes = timeMap[time] || 15;
      filtered = filtered.filter(book => {
        const bookMinutes = parseInt(book.readingTime) || 10;
        return bookMinutes <= maxMinutes + 5;
      });
    }

    // Boost books that match themes
    if (themes.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aMatches = a.themes.filter(t => themes.includes(t)).length;
        const bMatches = b.themes.filter(t => themes.includes(t)).length;
        return bMatches - aMatches;
      });
    }

    // Shuffle and return 3-5 books
    filtered = filtered.sort(() => Math.random() - 0.5);
    const count = Math.min(filtered.length, Math.floor(Math.random() * 3) + 3);

    return filtered.slice(0, count);
  }

  /**
   * Get book details by ID
   */
  async getBookById(bookId) {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_BOOKS_DB.find(book => book.id === bookId) || null;
  }

  /**
   * Search books by query
   */
  async searchBooks(query) {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const lowerQuery = query.toLowerCase();
    return MOCK_BOOKS_DB.filter(book =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery) ||
      book.themes.some(t => t.includes(lowerQuery))
    );
  }

  /**
   * Save user feedback on a recommendation
   */
  async saveFeedback(bookId, feedback) {
    // TODO: Implement when backend is ready
    console.log('Feedback saved:', { bookId, feedback });
    return { success: true };
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;

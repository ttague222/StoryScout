/**
 * StoryScout Configuration Options
 *
 * Defines all the selection options for onboarding and recommendations
 */

// Age ranges for children
export const AGE_RANGES = [
  { id: '2-3', label: '2-3 years', emoji: '👶', description: 'Board books & simple stories' },
  { id: '4-5', label: '4-5 years', emoji: '🧒', description: 'Picture books & early learning' },
  { id: '6-7', label: '6-7 years', emoji: '📖', description: 'Early readers & chapter intros' },
  { id: '8-10', label: '8-10 years', emoji: '📚', description: 'Chapter books & middle grade' },
];

// Reading types
export const READING_TYPES = [
  {
    id: 'read-aloud',
    label: 'Read Aloud',
    emoji: '👨‍👩‍👧',
    description: 'Parent reads to child',
  },
  {
    id: 'independent',
    label: 'Independent',
    emoji: '🧒📖',
    description: 'Child reads alone',
  },
  {
    id: 'both',
    label: 'Both',
    emoji: '📚',
    description: 'Mix of both styles',
  },
];

// Theme preferences (multi-select)
export const THEMES = [
  { id: 'kindness', label: 'Kindness', emoji: '💝', color: '#FFB6C1' },
  { id: 'adventure', label: 'Adventure', emoji: '🗺️', color: '#87CEEB' },
  { id: 'bedtime', label: 'Bedtime', emoji: '🌙', color: '#9B89B3' },
  { id: 'emotions', label: 'Emotions', emoji: '🎭', color: '#DDA0DD' },
  { id: 'animals', label: 'Animals', emoji: '🦁', color: '#FFD700' },
  { id: 'learning', label: 'Learning', emoji: '🔬', color: '#98D8C8' },
  { id: 'humor', label: 'Humor', emoji: '😄', color: '#FFE66D' },
  { id: 'friendship', label: 'Friendship', emoji: '🤝', color: '#FF9999' },
  { id: 'nature', label: 'Nature', emoji: '🌿', color: '#90EE90' },
  { id: 'family', label: 'Family', emoji: '🏠', color: '#F0E68C' },
];

// Mood options for recommendation flow
export const MOODS = [
  {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    description: 'Peaceful, soothing stories',
    color: '#A8D5BA',
  },
  {
    id: 'silly',
    label: 'Silly',
    emoji: '🤪',
    description: 'Fun, giggly adventures',
    color: '#FFD93D',
  },
  {
    id: 'adventurous',
    label: 'Adventurous',
    emoji: '🚀',
    description: 'Exciting, action-packed tales',
    color: '#6BB3E0',
  },
  {
    id: 'emotional',
    label: 'Emotional',
    emoji: '🥹',
    description: 'Stories about feelings',
    color: '#DDA0DD',
  },
];

// Time available options
export const TIME_OPTIONS = [
  {
    id: 'quick',
    label: '5 minutes',
    emoji: '⚡',
    description: 'Quick bedtime read',
    minutes: 5,
  },
  {
    id: 'medium',
    label: '10-15 minutes',
    emoji: '📖',
    description: 'Standard story time',
    minutes: 12,
  },
  {
    id: 'long',
    label: 'Longer read',
    emoji: '📚',
    description: 'We have time to spare',
    minutes: 25,
  },
];

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    recommendationsPerDay: 3,
    maxSavedBooks: 10,
    features: [
      '3 recommendations per day',
      'Save up to 10 books',
      'Basic themes',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    recommendationsPerDay: Infinity,
    maxSavedBooks: Infinity,
    features: [
      'Unlimited recommendations',
      'Unlimited saved books',
      'Seasonal collections',
      'Priority support',
    ],
  },
};

export default {
  AGE_RANGES,
  READING_TYPES,
  THEMES,
  MOODS,
  TIME_OPTIONS,
  SUBSCRIPTION_TIERS,
};

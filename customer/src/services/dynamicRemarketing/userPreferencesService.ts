/**
 * User Preferences Service for Dynamic Remarketing
 */

import type { UserPreferences, UserTourView, UserInteraction, TourProduct } from './types';
import { getPriceRange } from '../analytics/helpers';

export class UserPreferencesService {
    private userTourPreferences: Map<string, UserPreferences>;

    constructor() {
        this.userTourPreferences = new Map();
    }

    /**
     * Update user tour preferences based on behavior
     */
    updateUserTourPreferences(userId: string, tourId: string, tourProduct: TourProduct): void {
        if (!this.userTourPreferences.has(userId)) {
            this.userTourPreferences.set(userId, {
                tourViews: [],
                preferences: {},
                lastUpdated: Date.now()
            });
        }

        const userPrefs = this.userTourPreferences.get(userId)!;

        // Add tour view
        userPrefs.tourViews.push({
            tourId,
            timestamp: Date.now(),
            category: tourProduct.category,
            location: tourProduct.location,
            duration: tourProduct.duration,
            priceRange: getPriceRange(tourProduct.price)
        });

        // Update preferences based on tour characteristics
        const prefs = userPrefs.preferences;
        prefs.categories = prefs.categories || {};
        prefs.locations = prefs.locations || {};
        prefs.durations = prefs.durations || {};
        prefs.priceRanges = prefs.priceRanges || {};

        // Increment preference counters
        prefs.categories[tourProduct.category] = (prefs.categories[tourProduct.category] || 0) + 1;
        prefs.locations[tourProduct.location] = (prefs.locations[tourProduct.location] || 0) + 1;
        prefs.durations[tourProduct.duration] = (prefs.durations[tourProduct.duration] || 0) + 1;
        prefs.priceRanges[getPriceRange(tourProduct.price)] = (prefs.priceRanges[getPriceRange(tourProduct.price)] || 0) + 1;

        userPrefs.lastUpdated = Date.now();

        // Store preferences in localStorage for persistence
        this.storeUserPreferences(userId, userPrefs);
    }

    /**
     * Calculate user engagement level
     */
    calculateEngagementLevel(userId: string): number {
        try {
            const interactions: UserInteraction[] = typeof sessionStorage !== 'undefined' ?
                JSON.parse(sessionStorage.getItem('user_interactions') || '[]') : [];
            const userInteractions = interactions.filter(i => i.userId === userId || !i.userId);

            let score = 0;
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            userInteractions.forEach(interaction => {
                const age = now - interaction.timestamp;
                const recencyMultiplier = age < oneHour ? 2 : age < (24 * oneHour) ? 1.5 : 1;

                switch (interaction.type) {
                    case 'view_item':
                        score += 1 * recencyMultiplier;
                        break;
                    case 'add_to_cart':
                        score += 3 * recencyMultiplier;
                        break;
                    case 'begin_checkout':
                        score += 5 * recencyMultiplier;
                        break;
                    default:
                        score += 0.5 * recencyMultiplier;
                }
            });

            return Math.round(score);
        } catch (error) {
            console.warn('Error calculating engagement level:', error);
            return 0;
        }
    }

    /**
     * Calculate tour preference score for a specific tour
     */
    calculateTourPreferenceScore(userId: string, _tourId: string, tourProduct: TourProduct): number {
        const userPrefs = this.getUserTourPreferences(userId);
        if (!userPrefs || !userPrefs.preferences) return 0;

        let score = 0;
        const prefs = userPrefs.preferences;

        // Score based on category preference
        if (prefs.categories && prefs.categories[tourProduct.category]) {
            score += prefs.categories[tourProduct.category] * 3;
        }

        // Score based on location preference
        if (prefs.locations && prefs.locations[tourProduct.location]) {
            score += prefs.locations[tourProduct.location] * 2;
        }

        // Score based on duration preference
        if (prefs.durations && prefs.durations[tourProduct.duration]) {
            score += prefs.durations[tourProduct.duration] * 1;
        }

        // Score based on price range preference
        const priceRange = getPriceRange(tourProduct.price);
        if (prefs.priceRanges && prefs.priceRanges[priceRange]) {
            score += prefs.priceRanges[priceRange] * 1;
        }

        return Math.min(score, 10); // Cap at 10
    }

    /**
     * Get user tour preferences
     */
    getUserTourPreferences(userId: string): UserPreferences | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const stored = localStorage.getItem(`tour_preferences_${userId}`);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('Error retrieving user preferences:', error);
            return null;
        }
    }

    /**
     * Get user tour views
     */
    getUserTourViews(userId: string): UserTourView[] {
        const userPrefs = this.getUserTourPreferences(userId);
        return userPrefs && userPrefs.tourViews ? userPrefs.tourViews : [];
    }

    /**
     * Get dominant preference from preference object
     */
    getDominantPreference(preferences?: Record<string, number>): string | null {
        if (!preferences || Object.keys(preferences).length === 0) return null;

        return Object.entries(preferences).reduce((max, [key, value]) =>
            value > (preferences[max] || 0) ? key : max,
            Object.keys(preferences)[0]
        );
    }

    /**
     * Clear user data (for privacy compliance)
     */
    clearUserData(userId: string): void {
        try {
            // Remove from preferences
            this.userTourPreferences.delete(userId);

            // Clear localStorage data
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(`tour_preferences_${userId}`);
            }
        } catch (error) {
            console.warn('Error clearing user preferences data:', error);
        }
    }

    /**
     * Store user preferences in localStorage
     */
    private storeUserPreferences(userId: string, userPrefs: UserPreferences): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`tour_preferences_${userId}`, JSON.stringify(userPrefs));
            }
        } catch (error) {
            console.warn('Failed to store user preferences:', error);
        }
    }
}

export const userPreferencesService = new UserPreferencesService();
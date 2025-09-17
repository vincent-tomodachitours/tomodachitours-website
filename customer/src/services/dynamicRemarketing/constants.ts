/**
 * Constants and configurations for Dynamic Remarketing Service
 */

import type { TourProduct, DynamicAudienceConfig } from './types';

export const TOUR_PRODUCT_CATALOG: Record<string, TourProduct> = {
    'gion-tour': {
        id: 'gion-tour',
        title: 'Gion District Cultural Walking Tour',
        description: 'Explore the historic Gion district with traditional architecture and geisha culture',
        price: 8000,
        currency: 'JPY',
        category: 'Cultural Tours',
        subcategory: 'Walking Tours',
        location: 'Gion, Kyoto',
        duration: '3 hours',
        image_url: '/IMG/Gion-Tour/geisha.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'easy',
        highlights: ['Geisha districts', 'Traditional architecture', 'Cultural insights'],
        season: 'year-round',
        time_of_day: 'afternoon'
    },
    'morning-tour': {
        id: 'morning-tour',
        title: 'Arashiyama Bamboo Grove Morning Tour',
        description: 'Early morning exploration of the famous bamboo forest and Tenryu-ji Temple',
        price: 9000,
        currency: 'JPY',
        category: 'Nature Tours',
        subcategory: 'Walking Tours',
        location: 'Arashiyama, Kyoto',
        duration: '4 hours',
        image_url: '/IMG/Morning-Tour/bamboo-main-highres1.85.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'easy',
        highlights: ['Bamboo grove', 'Temple visit', 'Morning serenity'],
        season: 'year-round',
        time_of_day: 'morning'
    },
    'night-tour': {
        id: 'night-tour',
        title: 'Fushimi Inari Night Photography Tour',
        description: 'Evening photography tour of the famous thousand torii gates',
        price: 7000,
        currency: 'JPY',
        category: 'Cultural Tours',
        subcategory: 'Photography Tours',
        location: 'Fushimi, Kyoto',
        duration: '2 hours',
        image_url: '/IMG/Night-Tour/1.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'moderate',
        highlights: ['Torii gates', 'Night photography', 'Spiritual experience'],
        season: 'year-round',
        time_of_day: 'evening'
    },
    'uji-tour': {
        id: 'uji-tour',
        title: 'Uji Tea Culture and Temple Tour',
        description: 'Full day exploration of Uji\'s tea culture and historic temples',
        price: 12000,
        currency: 'JPY',
        category: 'Cultural Tours',
        subcategory: 'Food & Culture Tours',
        location: 'Uji, Kyoto',
        duration: '5 hours',
        image_url: '/IMG/Uji-Tour/uji-temple.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'easy',
        highlights: ['Tea ceremony', 'Historic temples', 'Cultural immersion'],
        season: 'year-round',
        time_of_day: 'full-day'
    }
};

export const DYNAMIC_REMARKETING_AUDIENCES: Record<string, DynamicAudienceConfig> = {
    TOUR_VIEWERS_GION: {
        id: 'dynamic_gion_viewers',
        name: 'Gion Tour Viewers - Dynamic',
        description: 'Users who viewed Gion tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['gion-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'gion-tour',
            customParameters: {
                tour_category: 'Cultural',
                tour_location: 'Gion',
                price_range: 'mid-range'
            }
        }
    },
    TOUR_VIEWERS_MORNING: {
        id: 'dynamic_morning_viewers',
        name: 'Morning Tour Viewers - Dynamic',
        description: 'Users who viewed Morning tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['morning-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'morning-tour',
            customParameters: {
                tour_category: 'Nature',
                tour_location: 'Arashiyama',
                price_range: 'mid-range'
            }
        }
    },
    TOUR_VIEWERS_NIGHT: {
        id: 'dynamic_night_viewers',
        name: 'Night Tour Viewers - Dynamic',
        description: 'Users who viewed Night tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['night-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'night-tour',
            customParameters: {
                tour_category: 'Cultural',
                tour_location: 'Fushimi',
                price_range: 'budget'
            }
        }
    },
    TOUR_VIEWERS_UJI: {
        id: 'dynamic_uji_viewers',
        name: 'Uji Tour Viewers - Dynamic',
        description: 'Users who viewed Uji tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['uji-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'uji-tour',
            customParameters: {
                tour_category: 'Cultural',
                tour_location: 'Uji',
                price_range: 'premium'
            }
        }
    },
    MULTI_TOUR_BROWSERS: {
        id: 'dynamic_multi_tour_browsers',
        name: 'Multi-Tour Browsers - Dynamic',
        description: 'Users who viewed multiple tours with personalized recommendations',
        membershipDuration: 14,
        criteria: {
            minTourViews: 2,
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'multi-tour',
            customParameters: {
                tour_category: 'Mixed',
                tour_location: 'Kyoto',
                price_range: 'varied'
            }
        }
    },
    HIGH_INTENT_BROWSERS: {
        id: 'dynamic_high_intent_browsers',
        name: 'High Intent Browsers - Dynamic',
        description: 'Users with high engagement showing strong booking intent',
        membershipDuration: 7,
        criteria: {
            minEngagementScore: 5,
            events: ['view_item', 'add_to_cart', 'begin_checkout'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'high-intent',
            customParameters: {
                tour_category: 'High-Intent',
                tour_location: 'Kyoto',
                price_range: 'premium'
            }
        }
    }
};

export const TOUR_AUDIENCE_MAP: Record<string, string> = {
    'gion-tour': 'dynamic_gion_viewers',
    'morning-tour': 'dynamic_morning_viewers',
    'night-tour': 'dynamic_night_viewers',
    'uji-tour': 'dynamic_uji_viewers'
};

export const GOOGLE_PRODUCT_CATEGORY_MAP: Record<string, string> = {
    'Cultural Tours': 'Arts & Entertainment > Events & Attractions',
    'Nature Tours': 'Arts & Entertainment > Events & Attractions',
    'Photography Tours': 'Arts & Entertainment > Events & Attractions',
    'Food & Culture Tours': 'Arts & Entertainment > Events & Attractions'
};
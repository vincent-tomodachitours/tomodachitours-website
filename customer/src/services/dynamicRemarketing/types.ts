/**
 * Type definitions for Dynamic Remarketing Service
 */

export interface TourProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    subcategory: string;
    location: string;
    duration: string;
    image_url: string;
    availability: string;
    group_size: string;
    difficulty: string;
    highlights: string[];
    season: string;
    time_of_day: string;
}

export interface DynamicAudienceConfig {
    id: string;
    name: string;
    description: string;
    membershipDuration: number;
    criteria: {
        tourTypes?: string[];
        events?: string[];
        dynamicParameters?: boolean;
        minTourViews?: number;
        minEngagementScore?: number;
        preferredCategory?: string;
        preferredLocation?: string;
        preferredPriceRange?: string;
    };
    dynamicConfig: {
        productId: string;
        customParameters: {
            tour_category: string;
            tour_location: string;
            price_range: string;
        };
    };
}

export interface DynamicAudience extends DynamicAudienceConfig {
    isActive: boolean;
    createdAt: number;
    members: Set<string>;
}

export interface SessionData {
    sessionId: string;
    userId: string | null;
    startTime: number;
}

export interface DynamicRemarketingParameters {
    ecomm_prodid: string;
    ecomm_pagetype: string;
    ecomm_totalvalue: number;
    ecomm_category: string;
    tour_title: string;
    tour_location: string;
    tour_duration: string;
    tour_difficulty: string;
    tour_time_of_day: string;
    tour_season: string;
    tour_highlights: string;
    view_timestamp: number;
    user_engagement_level: number;
    tour_preference_score: number;
    traffic_source?: string;
    campaign_data?: string;
}

export interface UserTourView {
    tourId: string;
    timestamp: number;
    category: string;
    location: string;
    duration: string;
    priceRange: string;
}

export interface UserPreferences {
    tourViews: UserTourView[];
    preferences: {
        categories?: Record<string, number>;
        locations?: Record<string, number>;
        durations?: Record<string, number>;
        priceRanges?: Record<string, number>;
    };
    lastUpdated: number;
}

export interface UserInteraction {
    userId?: string;
    type: string;
    timestamp: number;
}

export interface ProductCatalogData {
    id: string;
    title: string;
    description: string;
    price: string;
    image_link: string;
    link: string;
    product_type: string;
    google_product_category: string;
    custom_label_0: string;
    custom_label_1: string;
    custom_label_2: string;
    custom_label_3: string;
    custom_label_4: string;
    availability: string;
    condition: string;
    brand: string;
    mpn: string;
    gtin: string;
    tour_highlights: string;
    group_size: string;
    booking_url: string;
}

export interface CustomAudienceConfig {
    name: string;
    description: string;
    criteria: DynamicAudienceConfig['criteria'];
    dynamicConfig: DynamicAudienceConfig['dynamicConfig'];
    membershipDuration?: number;
}
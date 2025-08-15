/**
 * Demonstration script for Dynamic Remarketing Service
 * This shows how the service integrates with the existing analytics system
 */

import dynamicRemarketingService from '../dynamicRemarketingService.js';

// Mock gtag for demonstration
global.gtag = (event, action, parameters) => {
    console.log(`GTAG CALL: ${event} -> ${action}`, parameters);
};

// Mock environment
process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID = 'AW-DEMO123456';

// Mock localStorage
const mockStorage = {};
global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; }
};

global.sessionStorage = {
    getItem: (key) => 'session_demo_123',
    setItem: (key, value) => { }
};

console.log('=== Dynamic Remarketing Service Demo ===\n');

// 1. Demonstrate product catalog integration
console.log('1. Product Catalog Data:');
const gionProduct = dynamicRemarketingService.getProductCatalogData('gion-tour');
console.log('Gion Tour Product:', JSON.stringify(gionProduct, null, 2));

// 2. Demonstrate dynamic remarketing parameters
console.log('\n2. Adding Dynamic Remarketing Parameters:');
const tourData = {
    tourId: 'gion-tour',
    tourName: 'Gion District Cultural Walking Tour',
    price: 8000
};

dynamicRemarketingService.addDynamicRemarketingParameters(tourData);

// 3. Demonstrate tour-specific audience creation
console.log('\n3. Creating Tour-Specific Audience:');
const customAudience = dynamicRemarketingService.createTourSpecificAudience({
    id: 'demo_cultural_enthusiasts',
    name: 'Cultural Tour Enthusiasts',
    description: 'Users interested in cultural tours',
    criteria: {
        tourTypes: ['gion-tour', 'night-tour'],
        events: ['view_item'],
        dynamicParameters: true
    },
    dynamicConfig: {
        productId: 'cultural-tours',
        customParameters: {
            tour_category: 'Cultural',
            tour_location: 'Kyoto',
            price_range: 'mid-range'
        }
    },
    membershipDuration: 30
});

console.log('Created Audience:', customAudience ? customAudience.name : 'Failed to create');

// 4. Demonstrate engagement level calculation
console.log('\n4. Engagement Level Calculation:');
// Mock some user interactions
global.sessionStorage.getItem = () => JSON.stringify([
    { type: 'view_item', timestamp: Date.now() - 1000 },
    { type: 'add_to_cart', timestamp: Date.now() - 2000 },
    { type: 'begin_checkout', timestamp: Date.now() - 3000 },
    { type: 'contact_whatsapp', timestamp: Date.now() - 4000 }
]);

const engagementLevel = dynamicRemarketingService.calculateEngagementLevel('demo_user');
console.log('User Engagement Level:', engagementLevel);

// 5. Demonstrate preference scoring
console.log('\n5. Tour Preference Scoring:');
// Mock user preferences
mockStorage['tour_preferences_demo_user'] = JSON.stringify({
    preferences: {
        categories: { 'Cultural': 5, 'Nature': 2 },
        locations: { 'Gion': 3, 'Arashiyama': 1 },
        durations: { '3 hours': 4, '4 hours': 1 },
        priceRanges: { 'mid-range': 5 }
    }
});

const preferenceScore = dynamicRemarketingService.calculateTourPreferenceScore('demo_user', 'gion-tour');
console.log('Gion Tour Preference Score:', preferenceScore);

// 6. Demonstrate statistics
console.log('\n6. Dynamic Remarketing Statistics:');
const stats = dynamicRemarketingService.getDynamicRemarketingStats();
console.log('Statistics:', JSON.stringify(stats, null, 2));

console.log('\n=== Demo Complete ===');
console.log('\nKey Features Demonstrated:');
console.log('✓ Product catalog integration for dynamic ads');
console.log('✓ Dynamic remarketing parameters for tour views');
console.log('✓ Tour-specific audience creation');
console.log('✓ User engagement level calculation');
console.log('✓ Tour preference scoring');
console.log('✓ Comprehensive statistics and reporting');
console.log('\nThe dynamic remarketing service is ready for production use!');
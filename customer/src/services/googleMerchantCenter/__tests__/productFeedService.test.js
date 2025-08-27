/**
 * Unit tests for Product Feed Service
 */

import productFeedService from '../productFeedService.js';
import { fetchTours, getAvailableTimeSlots } from '../../toursService.js';

// Mock dependencies
jest.mock('../../toursService.js');

describe('ProductFeedService', () => {
    const mockTours = {
        'night-tour': {
            'tour-title': 'Kyoto Fushimi-Inari Night Walking Tour',
            'tour-description': 'Join us an unforgettable evening walking tour of the Fushimi-Inari Shrine',
            'tour-price': 6500,
            'tour-duration': '90-120 minutes',
            'reviews': 178,
            'time-slots': ['17:00', '18:00', '19:00'],
            'max-participants': 12,
            'meeting-point': 'Fushimi-Inari Station'
        },
        'morning-tour': {
            'tour-title': 'Kyoto Early Bird English Tour',
            'tour-description': 'Early morning tour to avoid crowds',
            'tour-price': 14500,
            'tour-duration': '4.5 - 5 hours',
            'reviews': 108,
            'time-slots': ['6:30', '7:15', '8:00'],
            'max-participants': 9,
            'meeting-point': 'Kyoto Station'
        }
    };

    const mockAvailableSlots = [
        { time: '17:00', availableSpots: 8 },
        { time: '18:00', availableSpots: 5 },
        { time: '19:00', availableSpots: 12 }
    ];

    beforeEach(() => {
        fetchTours.mockResolvedValue(mockTours);
        getAvailableTimeSlots.mockResolvedValue(mockAvailableSlots);

        // Reset environment variables
        process.env.REACT_APP_BASE_URL = 'https://tomodachitours.com';
        process.env.REACT_APP_GOOGLE_MERCHANT_ID = 'TEST_MERCHANT_123';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateJSONFeed', () => {
        test('should generate JSON feed with basic tour data', async () => {
            const feed = await productFeedService.generateJSONFeed({
                includeAvailability: false
            });

            expect(feed).toHaveProperty('version', '1.0');
            expect(feed).toHaveProperty('title');
            expect(feed).toHaveProperty('products');
            expect(Array.isArray(feed.products)).toBe(true);
            expect(feed.products.length).toBeGreaterThan(0);

            // Check first product structure
            const product = feed.products[0];
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('title');
            expect(product).toHaveProperty('description');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('availability');
        });

        test('should generate date-specific products when includeAvailability is true', async () => {
            const feed = await productFeedService.generateJSONFeed({
                includeAvailability: true,
                daysAhead: 2
            });

            expect(feed.products.length).toBeGreaterThan(2); // Should have multiple date/time combinations

            // Check for date-specific product IDs
            const dateSpecificProducts = feed.products.filter(p =>
                p.id.includes('_2025-') && p.id.includes('_1700')
            );
            expect(dateSpecificProducts.length).toBeGreaterThan(0);
        });

        test('should handle empty tour data gracefully', async () => {
            fetchTours.mockResolvedValue({});

            const feed = await productFeedService.generateJSONFeed();

            expect(feed.products).toEqual([]);
        });

        test('should handle tour service errors', async () => {
            fetchTours.mockRejectedValue(new Error('Service unavailable'));

            await expect(productFeedService.generateJSONFeed()).rejects.toThrow('Service unavailable');
        });
    });

    describe('generateXMLFeed', () => {
        test('should generate valid XML feed structure', async () => {
            const xmlFeed = await productFeedService.generateXMLFeed({
                includeAvailability: false
            });

            expect(typeof xmlFeed).toBe('string');
            expect(xmlFeed).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xmlFeed).toContain('<rss version="2.0"');
            expect(xmlFeed).toContain('<channel>');
            expect(xmlFeed).toContain('<item>');
            expect(xmlFeed).toContain('<g:id>');
            expect(xmlFeed).toContain('<g:title>');
            expect(xmlFeed).toContain('<g:price>');
        });

        test('should escape XML special characters', async () => {
            const toursWithSpecialChars = {
                'test-tour': {
                    'tour-title': 'Tour with "quotes" & <tags>',
                    'tour-description': 'Description with special chars: < > & " \'',
                    'tour-price': 5000,
                    'tour-duration': '2 hours',
                    'reviews': 0,
                    'time-slots': ['10:00'],
                    'max-participants': 10
                }
            };

            fetchTours.mockResolvedValue(toursWithSpecialChars);

            const xmlFeed = await productFeedService.generateXMLFeed();

            expect(xmlFeed).toContain('&quot;');
            expect(xmlFeed).toContain('&amp;');
            expect(xmlFeed).toContain('&lt;');
            expect(xmlFeed).toContain('&gt;');
            expect(xmlFeed).not.toContain('<tags>');
        });
    });

    describe('validateFeed', () => {
        test('should validate correct feed data', () => {
            const validProducts = [
                {
                    id: 'tour_night-tour',
                    title: 'Night Tour',
                    description: 'A great night tour',
                    link: 'https://example.com/tour',
                    image_link: 'https://example.com/image.jpg',
                    availability: 'in stock',
                    price: '6500 JPY'
                }
            ];

            const validation = productFeedService.validateFeed(validProducts);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toEqual([]);
            expect(validation.productCount).toBe(1);
        });

        test('should detect missing required fields', () => {
            const invalidProducts = [
                {
                    id: 'tour_test',
                    // Missing required fields
                    description: 'Test description'
                }
            ];

            const validation = productFeedService.validateFeed(invalidProducts);

            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors.some(error => error.includes('title'))).toBe(true);
        });

        test('should detect invalid URLs', () => {
            const productsWithInvalidUrls = [
                {
                    id: 'tour_test',
                    title: 'Test Tour',
                    description: 'Test description',
                    link: 'invalid-url',
                    image_link: 'also-invalid',
                    availability: 'in stock',
                    price: '5000 JPY'
                }
            ];

            const validation = productFeedService.validateFeed(productsWithInvalidUrls);

            expect(validation.valid).toBe(false);
            expect(validation.errors.some(error => error.includes('Invalid link URL'))).toBe(true);
            expect(validation.errors.some(error => error.includes('Invalid image URL'))).toBe(true);
        });

        test('should handle empty product array', () => {
            const validation = productFeedService.validateFeed([]);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('No products found in feed');
        });
    });

    describe('getFeedStatistics', () => {
        test('should calculate correct statistics', () => {
            const products = [
                {
                    custom_label_0: 'night-tour',
                    availability: 'in stock',
                    price: '6500 JPY'
                },
                {
                    custom_label_0: 'morning-tour',
                    availability: 'in stock',
                    price: '14500 JPY'
                },
                {
                    custom_label_0: 'night-tour',
                    availability: 'out of stock',
                    price: '6500 JPY'
                }
            ];

            const stats = productFeedService.getFeedStatistics(products);

            expect(stats.totalProducts).toBe(3);
            expect(stats.tourTypes['night-tour']).toBe(2);
            expect(stats.tourTypes['morning-tour']).toBe(1);
            expect(stats.availabilityStatus['in stock']).toBe(2);
            expect(stats.availabilityStatus['out of stock']).toBe(1);
            expect(stats.priceRange.min).toBe(6500);
            expect(stats.priceRange.max).toBe(14500);
            expect(stats.averagePrice).toBe((6500 + 14500 + 6500) / 3);
        });

        test('should handle empty products array', () => {
            const stats = productFeedService.getFeedStatistics([]);

            expect(stats.totalProducts).toBe(0);
        });

        test('should handle products without price information', () => {
            const products = [
                {
                    custom_label_0: 'test-tour',
                    availability: 'in stock'
                    // No price field
                }
            ];

            const stats = productFeedService.getFeedStatistics(products);

            expect(stats.totalProducts).toBe(1);
            expect(stats.priceRange.min).toBe(0);
            expect(stats.priceRange.max).toBe(0);
        });
    });

    describe('_createBaseProduct', () => {
        test('should create base product with correct structure', async () => {
            const tourKey = 'night-tour';
            const tourData = mockTours[tourKey];

            // Access private method for testing
            const baseProduct = await productFeedService._createBaseProduct(tourKey, tourData);

            expect(baseProduct.id).toBe('tour_night-tour');
            expect(baseProduct.title).toBe(tourData['tour-title']);
            expect(baseProduct.price).toBe('6500 JPY');
            expect(baseProduct.brand).toBe('Tomodachi Tours');
            expect(baseProduct.condition).toBe('new');
            expect(baseProduct.availability).toBe('in stock');
            expect(baseProduct.custom_label_0).toBe(tourKey);
        });
    });

    describe('_getTourImageUrl', () => {
        test('should return correct image URLs for known tours', () => {
            const nightTourImage = productFeedService._getTourImageUrl('night-tour');
            const morningTourImage = productFeedService._getTourImageUrl('morning-tour');
            const unknownTourImage = productFeedService._getTourImageUrl('unknown-tour');

            expect(nightTourImage).toContain('fushimi-inari-night.webp');
            expect(morningTourImage).toContain('arashiyama-bamboo.webp');
            expect(unknownTourImage).toContain('kyoto-tour-default.webp');
        });
    });

    describe('_sanitizeDescription', () => {
        test('should remove HTML tags and escape special characters', () => {
            const htmlDescription = '<p>This is a <strong>great</strong> tour with "quotes" & symbols.</p>';
            const sanitized = productFeedService._sanitizeDescription(htmlDescription);

            expect(sanitized).not.toContain('<p>');
            expect(sanitized).not.toContain('<strong>');
            expect(sanitized).toContain('&amp;');
            expect(sanitized).toContain('&quot;');
        });

        test('should handle empty or null descriptions', () => {
            expect(productFeedService._sanitizeDescription('')).toBe('');
            expect(productFeedService._sanitizeDescription(null)).toBe('');
            expect(productFeedService._sanitizeDescription(undefined)).toBe('');
        });

        test('should limit description length', () => {
            const longDescription = 'A'.repeat(6000);
            const sanitized = productFeedService._sanitizeDescription(longDescription);

            expect(sanitized.length).toBeLessThanOrEqual(5000);
        });
    });

    describe('_escapeXML', () => {
        test('should escape XML special characters', () => {
            const input = 'Text with <tags> & "quotes" and \'apostrophes\'';
            const escaped = productFeedService._escapeXML(input);

            expect(escaped).toBe('Text with &lt;tags&gt; &amp; &quot;quotes&quot; and &#39;apostrophes&#39;');
        });

        test('should handle empty or null input', () => {
            expect(productFeedService._escapeXML('')).toBe('');
            expect(productFeedService._escapeXML(null)).toBe('');
            expect(productFeedService._escapeXML(undefined)).toBe('');
        });
    });
});
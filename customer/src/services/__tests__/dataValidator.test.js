/**
 * Data Validator Service Tests
 * Tests for data validation, sanitization, and error handling
 */

import dataValidator, { ValidationError } from '../dataValidator.js';

// Mock performance monitor
jest.mock('../performanceMonitor.js', () => ({
    handleError: jest.fn(),
    recordMetric: jest.fn(),
    ERROR_TYPES: {
        VALIDATION_ERROR: 'validation_error'
    }
}));

describe('DataValidator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        dataValidator.resetStats();
    });

    describe('Transaction Validation', () => {
        test('should validate valid transaction data', () => {
            const validTransaction = {
                transactionId: 'txn_123456',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                quantity: 2
            };

            const result = dataValidator.validateTransaction(validTransaction);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.sanitizedData).toEqual(validTransaction);
        });

        test('should reject transaction with missing required fields', () => {
            const invalidTransaction = {
                value: 15000,
                // Missing transactionId
                currency: 'JPY'
            };

            const result = dataValidator.validateTransaction(invalidTransaction);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Required field missing: transactionId');
        });

        test('should validate transaction value constraints', () => {
            const invalidTransaction = {
                transactionId: 'txn_123',
                value: -100, // Invalid negative value
                currency: 'JPY'
            };

            const result = dataValidator.validateTransaction(invalidTransaction);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('below minimum'))).toBe(true);
        });

        test('should validate currency format', () => {
            const invalidTransaction = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'japanese_yen' // Invalid format, should be 3-letter code
            };

            const result = dataValidator.validateTransaction(invalidTransaction);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should sanitize transaction data', () => {
            const unsafeTransaction = {
                transactionId: 'txn_<script>alert("xss")</script>',
                value: 15000,
                currency: 'JPY',
                tourName: 'Tour with "quotes" & ampersands'
            };

            const result = dataValidator.validateTransaction(unsafeTransaction);

            expect(result.sanitizedData.transactionId).not.toContain('<script>');
            expect(result.sanitizedData.tourName).not.toContain('"');
            expect(result.sanitizedData.tourName).not.toContain('&');
        });
    });

    describe('Tour Data Validation', () => {
        test('should validate valid tour data', () => {
            const validTour = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000,
                tour_category: 'Cultural',
                tour_location: 'Gion',
                tour_duration: '3-hours'
            };

            const result = dataValidator.validateTour(validTour);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate tour ID format', () => {
            const invalidTour = {
                tourId: 'GION_TOUR_123', // Invalid format, should be lowercase with hyphens
                price: 12000
            };

            const result = dataValidator.validateTour(invalidTour);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should validate tour category enum', () => {
            const invalidTour = {
                tourId: 'gion-tour',
                price: 12000,
                tour_category: 'InvalidCategory'
            };

            const result = dataValidator.validateTour(invalidTour);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('not in allowed values'))).toBe(true);
        });

        test('should validate tour location enum', () => {
            const invalidTour = {
                tourId: 'gion-tour',
                price: 12000,
                tour_location: 'Tokyo' // Not in allowed locations
            };

            const result = dataValidator.validateTour(invalidTour);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('not in allowed values'))).toBe(true);
        });
    });

    describe('Attribution Data Validation', () => {
        test('should validate valid attribution data', () => {
            const validAttribution = {
                source: 'google',
                medium: 'cpc',
                campaign: 'summer-tours-2024',
                term: 'kyoto tours',
                content: 'ad-variant-a',
                gclid: 'Cj0KCQjw-abc123def',
                session_id: 'session_1234567890_abcdef123'
            };

            const result = dataValidator.validateAttribution(validAttribution);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate GCLID format', () => {
            const invalidAttribution = {
                source: 'google',
                medium: 'cpc',
                gclid: 'invalid gclid with spaces' // Invalid format
            };

            const result = dataValidator.validateAttribution(invalidAttribution);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should validate session ID format', () => {
            const invalidAttribution = {
                source: 'google',
                medium: 'cpc',
                session_id: 'invalid_session_format' // Should start with 'session_'
            };

            const result = dataValidator.validateAttribution(invalidAttribution);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should validate string length constraints', () => {
            const invalidAttribution = {
                source: 'a'.repeat(101), // Exceeds maxLength of 100
                medium: 'cpc'
            };

            const result = dataValidator.validateAttribution(invalidAttribution);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('above maximum'))).toBe(true);
        });
    });

    describe('Google Ads Conversion Validation', () => {
        test('should validate valid Google Ads conversion data', () => {
            const validConversion = {
                send_to: 'AW-123456789/AbCdEfGhIj',
                value: 15000,
                currency: 'JPY',
                transaction_id: 'txn_123456',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Tour'
            };

            const result = dataValidator.validateGoogleAdsConversion(validConversion);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate send_to format', () => {
            const invalidConversion = {
                send_to: 'invalid-send-to-format', // Should match AW-XXXXXXXXX/XXXXXXXXXXXXX pattern
                value: 15000
            };

            const result = dataValidator.validateGoogleAdsConversion(invalidConversion);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should require send_to field', () => {
            const invalidConversion = {
                value: 15000,
                currency: 'JPY'
                // Missing required send_to field
            };

            const result = dataValidator.validateGoogleAdsConversion(invalidConversion);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Required field missing: send_to');
        });
    });

    describe('Enhanced Conversion Validation', () => {
        test('should validate valid enhanced conversion data', () => {
            const validEnhanced = {
                email: 'user@example.com',
                phone_number: '+81901234567',
                first_name: 'John',
                last_name: 'Doe',
                country: 'JP'
            };

            const result = dataValidator.validateEnhancedConversion(validEnhanced);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate email format', () => {
            const invalidEnhanced = {
                email: 'invalid-email-format' // Missing @ and domain
            };

            const result = dataValidator.validateEnhancedConversion(invalidEnhanced);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should validate phone number format', () => {
            const invalidEnhanced = {
                phone_number: 'not-a-phone-number'
            };

            const result = dataValidator.validateEnhancedConversion(invalidEnhanced);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should validate country code format', () => {
            const invalidEnhanced = {
                country: 'Japan' // Should be 2-letter code like 'JP'
            };

            const result = dataValidator.validateEnhancedConversion(invalidEnhanced);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });
    });

    describe('Event Data Validation', () => {
        test('should validate valid event data', () => {
            const validEvent = {
                event_name: 'purchase',
                event_parameters: {
                    value: 15000,
                    currency: 'JPY'
                },
                user_properties: {
                    user_type: 'returning'
                }
            };

            const result = dataValidator.validateEvent(validEvent);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate event name format', () => {
            const invalidEvent = {
                event_name: '123invalid-start' // Should start with letter
            };

            const result = dataValidator.validateEvent(invalidEvent);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('does not match required pattern'))).toBe(true);
        });

        test('should validate event name length', () => {
            const invalidEvent = {
                event_name: 'a'.repeat(41) // Exceeds 40 character limit
            };

            const result = dataValidator.validateEvent(invalidEvent);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('above maximum'))).toBe(true);
        });

        test('should reject reserved event names', () => {
            const invalidEvent = {
                event_name: 'ad_click' // Reserved event name
            };

            const result = dataValidator.validateEvent(invalidEvent);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('reserved'))).toBe(true);
        });

        test('should require event_name field', () => {
            const invalidEvent = {
                event_parameters: {
                    value: 15000
                }
                // Missing required event_name
            };

            const result = dataValidator.validateEvent(invalidEvent);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Required field missing: event_name');
        });
    });

    describe('Data Sanitization', () => {
        test('should remove harmful characters from strings', () => {
            const unsafeData = {
                tourId: 'gion-tour',
                tourName: 'Tour with <script>alert("xss")</script> content',
                description: 'Tour "description" with & ampersands'
            };

            const result = dataValidator.validateTour(unsafeData);

            expect(result.sanitizedData.tourName).not.toContain('<');
            expect(result.sanitizedData.tourName).not.toContain('>');
            expect(result.sanitizedData.tourName).not.toContain('"');
            expect(result.sanitizedData.description).not.toContain('&');
        });

        test('should remove control characters', () => {
            const unsafeData = {
                tourId: 'gion-tour',
                tourName: 'Tour\x00with\x1Fcontrol\x7Fcharacters'
            };

            const result = dataValidator.validateTour(unsafeData);

            expect(result.sanitizedData.tourName).not.toMatch(/[\x00-\x1F\x7F]/);
        });

        test('should normalize whitespace', () => {
            const unsafeData = {
                tourId: 'gion-tour',
                tourName: '  Tour   with    excessive     whitespace  '
            };

            const result = dataValidator.validateTour(unsafeData);

            expect(result.sanitizedData.tourName).toBe('Tour with excessive whitespace');
        });

        test('should sanitize nested objects', () => {
            const unsafeData = {
                tourId: 'gion-tour',
                attribution: {
                    source: 'google<script>',
                    campaign: 'summer"tours'
                }
            };

            const result = dataValidator.validateTour(unsafeData);

            expect(result.sanitizedData.attribution.source).not.toContain('<script>');
            expect(result.sanitizedData.attribution.campaign).not.toContain('"');
        });

        test('should sanitize arrays', () => {
            const unsafeData = {
                event_name: 'custom_event',
                event_parameters: {
                    items: ['item<script>', 'item"with"quotes']
                }
            };

            const result = dataValidator.validateEvent(unsafeData);

            expect(result.sanitizedData.event_parameters.items[0]).not.toContain('<script>');
            expect(result.sanitizedData.event_parameters.items[1]).not.toContain('"');
        });
    });

    describe('Type Validation', () => {
        test('should validate string types', () => {
            expect(dataValidator.isValidType('test', 'string')).toBe(true);
            expect(dataValidator.isValidType(123, 'string')).toBe(false);
            expect(dataValidator.isValidType(null, 'string')).toBe(false);
        });

        test('should validate number types', () => {
            expect(dataValidator.isValidType(123, 'number')).toBe(true);
            expect(dataValidator.isValidType(123.45, 'number')).toBe(true);
            expect(dataValidator.isValidType('123', 'number')).toBe(false);
            expect(dataValidator.isValidType(NaN, 'number')).toBe(false);
        });

        test('should validate boolean types', () => {
            expect(dataValidator.isValidType(true, 'boolean')).toBe(true);
            expect(dataValidator.isValidType(false, 'boolean')).toBe(true);
            expect(dataValidator.isValidType('true', 'boolean')).toBe(false);
            expect(dataValidator.isValidType(1, 'boolean')).toBe(false);
        });

        test('should validate object types', () => {
            expect(dataValidator.isValidType({}, 'object')).toBe(true);
            expect(dataValidator.isValidType({ key: 'value' }, 'object')).toBe(true);
            expect(dataValidator.isValidType([], 'object')).toBe(false);
            expect(dataValidator.isValidType(null, 'object')).toBe(false);
        });

        test('should validate array types', () => {
            expect(dataValidator.isValidType([], 'array')).toBe(true);
            expect(dataValidator.isValidType([1, 2, 3], 'array')).toBe(true);
            expect(dataValidator.isValidType({}, 'array')).toBe(false);
            expect(dataValidator.isValidType('array', 'array')).toBe(false);
        });
    });

    describe('Batch Validation', () => {
        test('should validate multiple data objects', () => {
            const dataArray = [
                { tourId: 'gion-tour', price: 12000 },
                { tourId: 'morning-tour', price: 15000 },
                { tourId: 'invalid tour id', price: -100 } // Invalid
            ];

            const results = dataValidator.validateBatch(dataArray, 'tour');

            expect(results).toHaveLength(3);
            expect(results[0].isValid).toBe(true);
            expect(results[1].isValid).toBe(true);
            expect(results[2].isValid).toBe(false);
        });

        test('should include index in batch results', () => {
            const dataArray = [
                { tourId: 'gion-tour', price: 12000 },
                { tourId: 'morning-tour', price: 15000 }
            ];

            const results = dataValidator.validateBatch(dataArray, 'tour');

            expect(results[0].index).toBe(0);
            expect(results[1].index).toBe(1);
        });

        test('should reject non-array input for batch validation', () => {
            expect(() => {
                dataValidator.validateBatch('not-an-array', 'tour');
            }).toThrow(ValidationError);
        });
    });

    describe('Validation Statistics', () => {
        test('should track validation statistics', () => {
            // Perform some validations
            dataValidator.validateTour({ tourId: 'gion-tour', price: 12000 });
            dataValidator.validateTour({ tourId: 'invalid', price: -100 });
            dataValidator.validateTransaction({ transactionId: 'txn_123', value: 15000 });

            const stats = dataValidator.getValidationStats();

            expect(stats.totalValidations).toBe(3);
            expect(stats.successfulValidations).toBe(2);
            expect(stats.failedValidations).toBe(1);
            expect(stats.successRate).toBeCloseTo(2 / 3);
            expect(stats.errorRate).toBeCloseTo(1 / 3);
        });

        test('should reset statistics', () => {
            // Perform some validations
            dataValidator.validateTour({ tourId: 'gion-tour', price: 12000 });

            dataValidator.resetStats();

            const stats = dataValidator.getValidationStats();
            expect(stats.totalValidations).toBe(0);
            expect(stats.successfulValidations).toBe(0);
            expect(stats.failedValidations).toBe(0);
        });
    });

    describe('Custom Validation Rules', () => {
        test('should add custom validation rules', () => {
            const customRule = {
                required: ['customField'],
                optional: ['optionalField'],
                types: {
                    customField: 'string',
                    optionalField: 'number'
                },
                constraints: {
                    customField: { minLength: 5 }
                }
            };

            dataValidator.addValidationRule('customType', customRule);

            const testData = {
                customField: 'test', // Too short
                optionalField: 123
            };

            const result = dataValidator.validateData(testData, 'customType');

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('below minimum'))).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid data types gracefully', () => {
            expect(() => {
                dataValidator.validateTransaction(null);
            }).toThrow(ValidationError);

            expect(() => {
                dataValidator.validateTransaction('not-an-object');
            }).toThrow(ValidationError);
        });

        test('should handle unknown data types', () => {
            expect(() => {
                dataValidator.validateData({}, 'unknownType');
            }).toThrow(ValidationError);
        });

        test('should handle validation errors in performance monitoring', () => {
            const performanceMonitor = require('../performanceMonitor.js').default;

            // This should trigger a validation error
            dataValidator.validateTransaction({ value: 'invalid-number' });

            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                'validation_error',
                expect.objectContaining({
                    dataType: 'transaction'
                })
            );
        });
    });

    describe('Performance Monitoring Integration', () => {
        test('should record validation performance metrics', () => {
            const performanceMonitor = require('../performanceMonitor.js').default;

            dataValidator.validateTour({ tourId: 'gion-tour', price: 12000 });

            expect(performanceMonitor.recordMetric).toHaveBeenCalledWith(
                'validation_time',
                expect.objectContaining({
                    dataType: 'tour'
                })
            );
        });

        test('should alert on slow validations', () => {
            const performanceMonitor = require('../performanceMonitor.js').default;

            // Mock slow validation
            const originalNow = performance.now;
            let callCount = 0;
            performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 150; // 150ms validation time
            });

            dataValidator.validateTour({ tourId: 'gion-tour', price: 12000 });

            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                'validation_error',
                expect.objectContaining({
                    message: 'Slow validation detected'
                })
            );

            performance.now = originalNow;
        });
    });
});
/**
 * Unit tests for Enhanced Conversion Service
 * 
 * Tests data hashing, privacy compliance validation, and enhanced conversion preparation
 */

import enhancedConversionService from '../enhancedConversionService';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
    process.env = {
        ...originalEnv,
        REACT_APP_ENHANCED_CONVERSIONS_ENABLED: 'true',
        REACT_APP_CUSTOMER_DATA_HASHING_SALT: 'test_salt_123',
        REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-17482092392'
    };
});

afterEach(() => {
    process.env = originalEnv;
});

describe('EnhancedConversionService', () => {
    describe('Configuration', () => {
        test('should be enabled when environment variable is true', () => {
            const status = enhancedConversionService.getStatus();
            expect(status.isEnabled).toBe(true);
            expect(status.hasSalt).toBe(true);
            expect(status.isConfigured).toBe(true);
        });

        test('should be disabled when environment variable is false', () => {
            process.env.REACT_APP_ENHANCED_CONVERSIONS_ENABLED = 'false';
            // Need to create new instance to pick up env change
            const { default: service } = require('../enhancedConversionService');
            const status = service.getStatus();
            expect(status.isEnabled).toBe(false);
        });
    });

    describe('Data Hashing', () => {
        test('should hash email correctly', () => {
            const email = 'test@example.com';
            const hashedEmail = enhancedConversionService.hashEmail(email);

            expect(hashedEmail).toBeTruthy();
            expect(hashedEmail).toHaveLength(64); // SHA-256 produces 64-character hex string
            expect(hashedEmail).not.toBe(email);
        });

        test('should normalize email before hashing', () => {
            const email1 = 'Test@Example.Com';
            const email2 = '  test@example.com  ';

            const hash1 = enhancedConversionService.hashEmail(email1);
            const hash2 = enhancedConversionService.hashEmail(email2);

            expect(hash1).toBe(hash2);
        });

        test('should return empty string for invalid email', () => {
            expect(enhancedConversionService.hashEmail('')).toBe('');
            expect(enhancedConversionService.hashEmail('invalid-email')).toBe('');
            expect(enhancedConversionService.hashEmail(null)).toBe('');
            expect(enhancedConversionService.hashEmail(undefined)).toBe('');
        });

        test('should hash phone number correctly', () => {
            const phone = '+81-90-1234-5678';
            const hashedPhone = enhancedConversionService.hashPhone(phone);

            expect(hashedPhone).toBeTruthy();
            expect(hashedPhone).toHaveLength(64);
        });

        test('should normalize Japanese phone numbers', () => {
            const domesticPhone = '090-1234-5678';
            const internationalPhone = '+81-90-1234-5678';

            const hash1 = enhancedConversionService.hashPhone(domesticPhone);
            const hash2 = enhancedConversionService.hashPhone(internationalPhone);

            expect(hash1).toBe(hash2);
        });

        test('should return empty string for invalid phone', () => {
            expect(enhancedConversionService.hashPhone('')).toBe('');
            expect(enhancedConversionService.hashPhone('123')).toBe(''); // Too short
            expect(enhancedConversionService.hashPhone(null)).toBe('');
        });

        test('should hash name correctly', () => {
            const name = 'John Doe';
            const hashedName = enhancedConversionService.hashName(name);

            expect(hashedName).toBeTruthy();
            expect(hashedName).toHaveLength(64);
            expect(hashedName).not.toBe(name);
        });

        test('should handle Japanese names', () => {
            const japaneseName = '田中太郎';
            const hashedName = enhancedConversionService.hashName(japaneseName);

            expect(hashedName).toBeTruthy();
            expect(hashedName).toHaveLength(64);
        });

        test('should return empty string for invalid name', () => {
            expect(enhancedConversionService.hashName('')).toBe('');
            expect(enhancedConversionService.hashName('123!@#')).toBe(''); // Only special characters
            expect(enhancedConversionService.hashName(null)).toBe('');
        });
    });

    describe('Email Validation', () => {
        test('should validate correct email formats', () => {
            expect(enhancedConversionService.isValidEmail('test@example.com')).toBe(true);
            expect(enhancedConversionService.isValidEmail('user.name@domain.co.jp')).toBe(true);
            expect(enhancedConversionService.isValidEmail('test+tag@example.org')).toBe(true);
        });

        test('should reject invalid email formats', () => {
            expect(enhancedConversionService.isValidEmail('invalid-email')).toBe(false);
            expect(enhancedConversionService.isValidEmail('@example.com')).toBe(false);
            expect(enhancedConversionService.isValidEmail('test@')).toBe(false);
            expect(enhancedConversionService.isValidEmail('')).toBe(false);
            expect(enhancedConversionService.isValidEmail(null)).toBe(false);
        });
    });

    describe('GDPR Consent Validation', () => {
        test('should validate correct GDPR consent', () => {
            const validConsent = {
                analytics: 'granted',
                ad_storage: 'granted'
            };

            expect(enhancedConversionService.validateGDPRConsent(validConsent)).toBe(true);
        });

        test('should validate boolean consent values', () => {
            const validConsent = {
                analytics: true,
                ad_storage: true
            };

            expect(enhancedConversionService.validateGDPRConsent(validConsent)).toBe(true);
        });

        test('should reject incomplete consent', () => {
            const incompleteConsent1 = {
                analytics: 'granted'
                // Missing ad_storage
            };

            const incompleteConsent2 = {
                analytics: 'denied',
                ad_storage: 'granted'
            };

            expect(enhancedConversionService.validateGDPRConsent(incompleteConsent1)).toBe(false);
            expect(enhancedConversionService.validateGDPRConsent(incompleteConsent2)).toBe(false);
        });

        test('should reject empty or missing consent', () => {
            expect(enhancedConversionService.validateGDPRConsent({})).toBe(false);
            expect(enhancedConversionService.validateGDPRConsent(null)).toBe(false);
            expect(enhancedConversionService.validateGDPRConsent()).toBe(false);
        });
    });

    describe('Privacy Compliance Validation', () => {
        const validCustomerData = {
            email: 'test@example.com',
            phone: '090-1234-5678',
            firstName: 'John',
            lastName: 'Doe'
        };

        const validConsent = {
            analytics: 'granted',
            ad_storage: 'granted'
        };

        test('should validate compliant data and consent', () => {
            const result = enhancedConversionService.validatePrivacyCompliance(
                validCustomerData,
                validConsent
            );

            expect(result.isCompliant).toBe(true);
            expect(result.hasValidConsent).toBe(true);
            expect(result.hasValidData).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject missing consent', () => {
            const result = enhancedConversionService.validatePrivacyCompliance(
                validCustomerData,
                {}
            );

            expect(result.isCompliant).toBe(false);
            expect(result.hasValidConsent).toBe(false);
            expect(result.errors).toContain('Missing or invalid GDPR consent for enhanced conversions');
        });

        test('should reject missing customer data', () => {
            const result = enhancedConversionService.validatePrivacyCompliance(
                {},
                validConsent
            );

            expect(result).toBeDefined();
            expect(result.isCompliant).toBe(false);
            expect(result.hasValidData).toBe(false);
            expect(result.errors).toContain('No valid customer data (email, phone, or name) provided for enhanced conversions');
        });

        test('should accept partial customer data', () => {
            const partialData = { email: 'test@example.com' };
            const result = enhancedConversionService.validatePrivacyCompliance(
                partialData,
                validConsent
            );

            expect(result.isCompliant).toBe(true);
            expect(result.hasValidData).toBe(true);
        });
    });

    describe('Enhanced Conversion Preparation', () => {
        const baseConversionData = {
            conversion_label: 'test_label',
            value: 100,
            currency: 'JPY',
            transaction_id: 'test_transaction_123'
        };

        const customerData = {
            email: 'test@example.com',
            phone: '090-1234-5678',
            firstName: 'John',
            lastName: 'Doe'
        };

        const validConsent = {
            analytics: 'granted',
            ad_storage: 'granted'
        };

        test('should prepare enhanced conversion data correctly', () => {
            const result = enhancedConversionService.prepareEnhancedConversion(
                baseConversionData,
                customerData,
                validConsent
            );

            expect(result).toBeTruthy();
            expect(result.conversion_label).toBe('test_label');
            expect(result.enhanced_conversion_data).toBeTruthy();
            expect(result.enhanced_conversion_data.email).toBeTruthy();
            expect(result.enhanced_conversion_data.phone_number).toBeTruthy();
            expect(result.enhanced_conversion_data.first_name).toBeTruthy();
            expect(result.enhanced_conversion_data.last_name).toBeTruthy();
        });

        test('should handle full name when first/last names not provided', () => {
            const customerWithFullName = {
                email: 'test@example.com',
                name: 'John Doe Smith'
            };

            const result = enhancedConversionService.prepareEnhancedConversion(
                baseConversionData,
                customerWithFullName,
                validConsent
            );

            expect(result.enhanced_conversion_data.first_name).toBeTruthy();
            expect(result.enhanced_conversion_data.last_name).toBeTruthy();
        });

        test('should include address data when provided', () => {
            const customerWithAddress = {
                ...customerData,
                address: {
                    street: '123 Main St',
                    city: 'Tokyo',
                    region: 'Tokyo',
                    postalCode: '100-0001',
                    country: 'Japan'
                }
            };

            const result = enhancedConversionService.prepareEnhancedConversion(
                baseConversionData,
                customerWithAddress,
                validConsent
            );

            expect(result.enhanced_conversion_data.street).toBeTruthy();
            expect(result.enhanced_conversion_data.city).toBe('tokyo');
            expect(result.enhanced_conversion_data.region).toBe('tokyo');
            expect(result.enhanced_conversion_data.postal_code).toBe('100-0001');
            expect(result.enhanced_conversion_data.country).toBe('japan');
        });

        test('should return null when not compliant', () => {
            const result = enhancedConversionService.prepareEnhancedConversion(
                baseConversionData,
                customerData,
                {} // No consent
            );

            expect(result).toBeNull();
        });

        test('should return null when enhanced conversions disabled', () => {
            process.env.REACT_APP_ENHANCED_CONVERSIONS_ENABLED = 'false';
            const { default: service } = require('../enhancedConversionService');

            const result = service.prepareEnhancedConversion(
                baseConversionData,
                customerData,
                validConsent
            );

            expect(result).toBeNull();
        });

        test('should return null when no valid enhanced data can be prepared', () => {
            const invalidCustomerData = {
                email: 'invalid-email',
                phone: '123', // Too short
                name: '!@#' // Only special characters
            };

            const result = enhancedConversionService.prepareEnhancedConversion(
                baseConversionData,
                invalidCustomerData,
                validConsent
            );

            expect(result).toBeNull();
        });
    });

    describe('Enhanced Conversion Tracking', () => {
        let mockGtag;

        beforeEach(() => {
            mockGtag = jest.fn();
            // Set up window object for both global and window
            Object.defineProperty(global, 'window', {
                value: {
                    gtag: mockGtag
                },
                writable: true
            });
        });

        afterEach(() => {
            delete global.window;
        });

        test('should track enhanced conversion successfully', async () => {
            const enhancedData = {
                conversion_label: 'test_label',
                value: 100,
                currency: 'JPY',
                transaction_id: 'test_123',
                enhanced_conversion_data: {
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                }
            };

            const result = await enhancedConversionService.trackEnhancedConversion(enhancedData);

            expect(result).toBe(true);
            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-17482092392/test_label',
                value: 100,
                currency: 'JPY',
                transaction_id: 'test_123',
                enhanced_conversion_data: {
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                }
            });
        });

        test('should handle missing gtag gracefully', async () => {
            delete global.window.gtag;

            const enhancedData = {
                conversion_label: 'test_label',
                enhanced_conversion_data: {}
            };

            const result = await enhancedConversionService.trackEnhancedConversion(enhancedData);

            expect(result).toBe(false);
        });

        test('should handle missing data gracefully', async () => {
            const result = await enhancedConversionService.trackEnhancedConversion(null);

            expect(result).toBe(false);
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should handle gtag errors gracefully', async () => {
            mockGtag.mockImplementation(() => {
                throw new Error('gtag error');
            });

            const enhancedData = {
                conversion_label: 'test_label',
                enhanced_conversion_data: {}
            };

            const result = await enhancedConversionService.trackEnhancedConversion(enhancedData);

            expect(result).toBe(false);
        });
    });

    describe('Data Consistency', () => {
        test('should produce consistent hashes for same input', () => {
            const email = 'test@example.com';
            const hash1 = enhancedConversionService.hashEmail(email);
            const hash2 = enhancedConversionService.hashEmail(email);

            expect(hash1).toBe(hash2);
        });

        test('should produce different hashes for different inputs', () => {
            const email1 = 'test1@example.com';
            const email2 = 'test2@example.com';

            const hash1 = enhancedConversionService.hashEmail(email1);
            const hash2 = enhancedConversionService.hashEmail(email2);

            expect(hash1).not.toBe(hash2);
        });

        test('should handle edge cases in phone normalization', () => {
            // Test various phone formats
            const phones = [
                '090-1234-5678',
                '09012345678',
                '+81-90-1234-5678',
                '+81 90 1234 5678',
                '81-90-1234-5678'
            ];

            const hashes = phones.map(phone => enhancedConversionService.hashPhone(phone));

            // All should produce the same hash (normalized to same format)
            expect(hashes[0]).toBe(hashes[1]);
            expect(hashes[0]).toBe(hashes[2]);
            expect(hashes[0]).toBe(hashes[3]);
            expect(hashes[0]).toBe(hashes[4]);
        });
    });
});
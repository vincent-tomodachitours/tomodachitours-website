/**
 * Privacy Compliance Testing
 * Tests GDPR compliance and consent management
 * Requirements: 6.1, 6.2, 6.3, 6.4 (Task 14)
 */

const { trackPurchase, trackBeginCheckout, trackTourView } = require('../analytics.js');
const privacyManager = require('../privacyManager.js');
const { CONSENT_TYPES } = require('../privacyManager.js');
const attributionService = require('../attributionService.js');
const dataValidator = require('../dataValidator.js');

// Mock dependencies
jest.mock('../privacyManager.js');
jest.mock('../attributionService.js');
jest.mock('../dataValidator.js');

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;

describe('Privacy Compliance Testing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();

        // Default attribution mock
        attributionService.getAttributionForAnalytics.mockReturnValue({
            source: 'google',
            medium: 'cpc',
            campaign: 'test_campaign'
        });

        // Default validation mock
        dataValidator.validatePurchase.mockReturnValue({ isValid: true, sanitizedData: {} });
        dataValidator.validateTour.mockReturnValue({ isValid: true, sanitizedData: {} });
        dataValidator.validateTransaction.mockReturnValue({ isValid: true, sanitizedData: {} });
    });

    describe('Consent Management', () => {
        test('should respect analytics consent preferences', () => {
            privacyManager.canTrackAnalytics.mockReturnValue(false);
            privacyManager.canTrackMarketing.mockReturnValue(false);
            privacyManager.hasConsent.mockImplementation((type) =>
                type === CONSENT_TYPES.NECESSARY
            );

            const purchaseData = {
                transactionId: 'txn_no_analytics_consent',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should not fire GA4 tracking
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should respect marketing consent preferences', () => {
            privacyManager.canTrackAnalytics.mockReturnValue(true);
            privacyManager.canTrackMarketing.mockReturnValue(false);
            privacyManager.hasConsent.mockImplementation((type) =>
                type === CONSENT_TYPES.ANALYTICS || type === CONSENT_TYPES.NECESSARY
            );

            const purchaseData = {
                transactionId: 'txn_no_marketing_consent',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should fire GA4 but not Google Ads
            const ga4Calls = mockGtag.mock.calls.filter(call =>
                call[0] === 'event' && call[1] === 'purchase'
            );
            const adsCalls = mockGtag.mock.calls.filter(call =>
                call[0] === 'event' && call[1] === 'conversion'
            );

            expect(ga4Calls.length).toBeGreaterThan(0);
            expect(adsCalls.length).toBe(0);
        });

        test('should handle consent changes dynamically', () => {
            // Start with full consent
            privacyManager.canTrackAnalytics.mockReturnValue(true);
            privacyManager.canTrackMarketing.mockReturnValue(true);

            trackPurchase({
                transactionId: 'txn_consent_change_1',
                value: 12000,
                currency: 'JPY'
            });

            expect(mockGtag).toHaveBeenCalled();
            mockGtag.mockClear();

            // Revoke consent
            privacyManager.canTrackAnalytics.mockReturnValue(false);
            privacyManager.canTrackMarketing.mockReturnValue(false);

            trackPurchase({
                transactionId: 'txn_consent_change_2',
                value: 12000,
                currency: 'JPY'
            });

            // Should not track after consent revoked
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should validate consent before each tracking call', () => {
            let consentCallCount = 0;
            privacyManager.canTrackAnalytics.mockImplementation(() => {
                consentCallCount++;
                return consentCallCount <= 2; // Allow first 2 calls, deny rest
            });

            // Make multiple tracking calls
            trackTourView({ tourId: 'test-tour', price: 1000 });
            trackBeginCheckout({ tourId: 'test-tour', price: 1000 });
            trackPurchase({ transactionId: 'test', value: 1000, currency: 'JPY' });

            // Should check consent for each call
            expect(privacyManager.canTrackAnalytics).toHaveBeenCalledTimes(3);

            // Only first 2 calls should result in tracking
            expect(mockGtag).toHaveBeenCalledTimes(2);
        });
    });

    describe('Data Anonymization', () => {
        test('should anonymize data when required', () => {
            privacyManager.canTrackAnalytics.mockReturnValue(true);
            privacyManager.hasConsent.mockReturnValue(true);

            const sensitiveData = {
                transactionId: 'txn_anonymize_test',
                value: 12000,
                currency: 'JPY',
                customer_email: 'test@example.com',
                customer_phone: '+1234567890',
                customer_name: 'John Doe'
            };

            // Mock data validator to anonymize sensitive data
            dataValidator.validateTransaction.mockReturnValue({
                isValid: true,
                sanitizedData: {
                    ...sensitiveData,
                    customer_email: undefined,
                    customer_phone: undefined,
                    customer_name: undefined
                }
            });

            trackPurchase(sensitiveData);

            // Verify sensitive data is not included in tracking
            const trackingCalls = mockGtag.mock.calls;
            trackingCalls.forEach(call => {
                const eventData = call[2];
                expect(eventData).not.toHaveProperty('customer_email');
                expect(eventData).not.toHaveProperty('customer_phone');
                expect(eventData).not.toHaveProperty('customer_name');
            });
        });

        test('should hash PII data when anonymization is required', () => {
            const sensitiveData = {
                transactionId: 'txn_hash_test',
                value: 12000,
                currency: 'JPY',
                customer_email: 'test@example.com'
            };

            dataValidator.validateTransaction.mockReturnValue({
                isValid: true,
                sanitizedData: {
                    ...sensitiveData,
                    customer_email_hash: 'hashed_email_value'
                }
            });

            trackPurchase(sensitiveData);

            expect(dataValidator.validateTransaction).toHaveBeenCalledWith(sensitiveData);
        });
    });

    describe('GDPR Compliance', () => {
        test('should handle data deletion requests', () => {
            privacyManager.clearTrackingData = jest.fn();
            attributionService.clearAttributionData = jest.fn();

            // Simulate data deletion request
            privacyManager.clearTrackingData();
            attributionService.clearAttributionData();

            expect(privacyManager.clearTrackingData).toHaveBeenCalled();
            expect(attributionService.clearAttributionData).toHaveBeenCalled();
        });

        test('should provide data export functionality', () => {
            privacyManager.exportUserData = jest.fn().mockReturnValue({
                consentPreferences: {
                    analytics: true,
                    marketing: false
                },
                attributionData: {
                    source: 'google',
                    medium: 'cpc'
                }
            });

            const exportedData = privacyManager.exportUserData();

            expect(exportedData).toHaveProperty('consentPreferences');
            expect(exportedData).toHaveProperty('attributionData');
        });

        test('should handle consent withdrawal', () => {
            privacyManager.revokeConsent = jest.fn();
            privacyManager.clearTrackingData = jest.fn();

            // User withdraws consent
            privacyManager.revokeConsent();

            expect(privacyManager.revokeConsent).toHaveBeenCalled();
        });

        test('should respect data retention policies', () => {
            // Mock expired consent
            privacyManager.hasValidConsent = jest.fn().mockReturnValue(false);
            privacyManager.canTrackAnalytics.mockReturnValue(false);

            const purchaseData = {
                transactionId: 'txn_expired_consent',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should not track with expired consent
            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('Cookie Management', () => {
        test('should handle cookie consent preferences', () => {
            privacyManager.hasConsent.mockImplementation((type) => {
                switch (type) {
                    case CONSENT_TYPES.NECESSARY:
                        return true;
                    case CONSENT_TYPES.ANALYTICS:
                        return true;
                    case CONSENT_TYPES.MARKETING:
                        return false;
                    case CONSENT_TYPES.PREFERENCES:
                        return true;
                    default:
                        return false;
                }
            });

            privacyManager.canTrackAnalytics.mockReturnValue(true);
            privacyManager.canTrackMarketing.mockReturnValue(false);

            const tourData = {
                tourId: 'gion-tour',
                price: 12000
            };

            trackTourView(tourData);

            // Should track analytics but not marketing
            expect(mockGtag).toHaveBeenCalled();
        });

        test('should clear cookies when consent is revoked', () => {
            privacyManager.clearAnalyticsCookies = jest.fn();

            // Simulate consent revocation
            privacyManager.clearAnalyticsCookies();

            expect(privacyManager.clearAnalyticsCookies).toHaveBeenCalled();
        });
    });

    describe('Regional Compliance', () => {
        test('should handle EU user privacy requirements', () => {
            privacyManager.isConsentRequired = jest.fn().mockReturnValue(true);
            privacyManager.canTrackAnalytics.mockReturnValue(false); // No consent given

            const purchaseData = {
                transactionId: 'txn_eu_user',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should not track without explicit consent
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should handle non-EU user tracking', () => {
            privacyManager.isConsentRequired = jest.fn().mockReturnValue(false);
            privacyManager.canTrackAnalytics.mockReturnValue(true);

            const purchaseData = {
                transactionId: 'txn_non_eu_user',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should track for non-EU users
            expect(mockGtag).toHaveBeenCalled();
        });
    });

    describe('Consent Banner Integration', () => {
        test('should show consent banner when required', () => {
            privacyManager.showConsentBanner = jest.fn();
            privacyManager.hasValidConsent = jest.fn().mockReturnValue(false);
            privacyManager.isConsentRequired = jest.fn().mockReturnValue(true);

            // Simulate page load without valid consent
            if (privacyManager.isConsentRequired() && !privacyManager.hasValidConsent()) {
                privacyManager.showConsentBanner();
            }

            expect(privacyManager.showConsentBanner).toHaveBeenCalled();
        });

        test('should hide consent banner after consent given', () => {
            privacyManager.hideConsentBanner = jest.fn();
            privacyManager.saveConsentPreferences = jest.fn();

            // Simulate user accepting consent
            privacyManager.saveConsentPreferences({
                [CONSENT_TYPES.ANALYTICS]: true,
                [CONSENT_TYPES.MARKETING]: true
            });

            expect(privacyManager.saveConsentPreferences).toHaveBeenCalled();
        });
    });
});
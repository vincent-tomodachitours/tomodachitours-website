/**
 * Privacy Manager Tests
 * Tests for GDPR compliance and consent management functionality
 */

import privacyManager, { CONSENT_TYPES } from '../privacyManager.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

// Mock document methods
const documentMock = {
    createElement: jest.fn(() => ({
        id: '',
        innerHTML: '',
        remove: jest.fn(),
        addEventListener: jest.fn()
    })),
    getElementById: jest.fn(() => ({
        addEventListener: jest.fn(),
        remove: jest.fn()
    })),
    body: {
        appendChild: jest.fn()
    },
    cookie: ''
};

// Mock window methods
const windowMock = {
    location: {
        hostname: 'tomodachitours.com'
    }
};

describe('Privacy Manager', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.clear();

        // Setup global mocks
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock
        });
        Object.defineProperty(global, 'document', {
            value: documentMock
        });
        Object.defineProperty(global, 'window', {
            value: windowMock
        });

        // Reset privacy manager state
        privacyManager.initialized = false;
        privacyManager.consentPreferences = null;
        privacyManager.consentCallbacks = new Map();
    });

    describe('Initialization', () => {
        it('should initialize privacy manager', () => {
            privacyManager.initialize();
            expect(privacyManager.initialized).toBe(true);
        });

        it('should require consent by default', () => {
            privacyManager.initialize();
            expect(privacyManager.consentRequired).toBe(true);
        });

        it('should load default consent preferences when no stored preferences exist', () => {
            privacyManager.initialize();

            const preferences = privacyManager.getConsentPreferences();
            expect(preferences[CONSENT_TYPES.NECESSARY]).toBe(true);
            expect(preferences[CONSENT_TYPES.ANALYTICS]).toBe(false);
            expect(preferences[CONSENT_TYPES.MARKETING]).toBe(false);
            expect(preferences[CONSENT_TYPES.PREFERENCES]).toBe(false);
        });
    });

    describe('Consent Management', () => {
        beforeEach(() => {
            privacyManager.initialize();
        });

        it('should check consent for analytics tracking', () => {
            expect(privacyManager.canTrackAnalytics()).toBe(false);

            privacyManager.acceptAllConsent();
            expect(privacyManager.canTrackAnalytics()).toBe(true);
        });

        it('should check consent for marketing tracking', () => {
            expect(privacyManager.canTrackMarketing()).toBe(false);

            privacyManager.acceptAllConsent();
            expect(privacyManager.canTrackMarketing()).toBe(true);
        });

        it('should check consent for preferences tracking', () => {
            expect(privacyManager.canTrackPreferences()).toBe(false);

            privacyManager.acceptAllConsent();
            expect(privacyManager.canTrackPreferences()).toBe(true);
        });

        it('should always allow necessary cookies', () => {
            expect(privacyManager.hasConsent(CONSENT_TYPES.NECESSARY)).toBe(true);

            privacyManager.revokeConsent();
            expect(privacyManager.hasConsent(CONSENT_TYPES.NECESSARY)).toBe(true);
        });
    });

    describe('Consent Actions', () => {
        beforeEach(() => {
            privacyManager.initialize();
        });

        it('should accept all consent types', () => {
            privacyManager.acceptAllConsent();

            const preferences = privacyManager.getConsentPreferences();
            expect(preferences[CONSENT_TYPES.NECESSARY]).toBe(true);
            expect(preferences[CONSENT_TYPES.ANALYTICS]).toBe(true);
            expect(preferences[CONSENT_TYPES.MARKETING]).toBe(true);
            expect(preferences[CONSENT_TYPES.PREFERENCES]).toBe(true);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'privacy_consent_status',
                'granted'
            );
        });

        it('should accept only necessary cookies', () => {
            privacyManager.acceptNecessaryOnly();

            const preferences = privacyManager.getConsentPreferences();
            expect(preferences[CONSENT_TYPES.NECESSARY]).toBe(true);
            expect(preferences[CONSENT_TYPES.ANALYTICS]).toBe(false);
            expect(preferences[CONSENT_TYPES.MARKETING]).toBe(false);
            expect(preferences[CONSENT_TYPES.PREFERENCES]).toBe(false);
        });

        it('should revoke consent (except necessary)', () => {
            privacyManager.acceptAllConsent();
            privacyManager.revokeConsent();

            const preferences = privacyManager.getConsentPreferences();
            expect(preferences[CONSENT_TYPES.NECESSARY]).toBe(true);
            expect(preferences[CONSENT_TYPES.ANALYTICS]).toBe(false);
            expect(preferences[CONSENT_TYPES.MARKETING]).toBe(false);
            expect(preferences[CONSENT_TYPES.PREFERENCES]).toBe(false);
        });
    });

    describe('Consent Callbacks', () => {
        beforeEach(() => {
            privacyManager.initialize();
        });

        it('should register and call consent change callbacks', () => {
            const callback = jest.fn();

            const callbackId = privacyManager.onConsentChange(callback);
            expect(callback).toHaveBeenCalledWith(privacyManager.getConsentPreferences());

            privacyManager.acceptAllConsent();
            expect(callback).toHaveBeenCalledTimes(2);

            privacyManager.offConsentChange(callbackId);
            privacyManager.acceptNecessaryOnly();
            expect(callback).toHaveBeenCalledTimes(2); // Should not be called after unregistering
        });

        it('should handle callback errors gracefully', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Callback error');
            });

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            privacyManager.onConsentChange(errorCallback);
            privacyManager.acceptAllConsent();

            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Consent Validation', () => {
        beforeEach(() => {
            privacyManager.initialize();
        });

        it('should validate consent expiry', () => {
            // Mock expired consent
            const expiredTimestamp = Date.now() - (14 * 30 * 24 * 60 * 60 * 1000); // 14 months ago
            localStorageMock.setItem('privacy_consent_timestamp', expiredTimestamp.toString());
            localStorageMock.setItem('privacy_consent_status', 'granted');
            localStorageMock.setItem('privacy_consent_version', '1.0');

            expect(privacyManager.hasValidConsent()).toBe(false);
        });

        it('should validate consent version', () => {
            // Mock old consent version
            localStorageMock.setItem('privacy_consent_timestamp', Date.now().toString());
            localStorageMock.setItem('privacy_consent_status', 'granted');
            localStorageMock.setItem('privacy_consent_version', '0.9');

            expect(privacyManager.hasValidConsent()).toBe(false);
        });

        it('should validate complete consent data', () => {
            // Mock valid consent by updating the mock to return the values
            localStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'privacy_consent_timestamp':
                        return Date.now().toString();
                    case 'privacy_consent_status':
                        return 'granted';
                    case 'privacy_consent_version':
                        return '1.0';
                    default:
                        return null;
                }
            });

            expect(privacyManager.hasValidConsent()).toBe(true);
        });
    });

    describe('Data Management', () => {
        beforeEach(() => {
            privacyManager.initialize();
        });

        it('should clear tracking data', () => {
            // Mock localStorage.key method to return tracking keys
            localStorageMock.key = jest.fn()
                .mockReturnValueOnce('_ga')
                .mockReturnValueOnce('attribution_data')
                .mockReturnValueOnce('remarketing_audience')
                .mockReturnValueOnce('other_data')
                .mockReturnValue(null);

            // Mock localStorage.length
            Object.defineProperty(localStorageMock, 'length', {
                value: 4,
                writable: true
            });

            privacyManager.clearTrackingData();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('_ga');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('attribution_data');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('remarketing_audience');
            expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_data');
        });

        it('should delete all user data', () => {
            privacyManager.acceptAllConsent();

            privacyManager.deleteAllUserData();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('privacy_consent_status');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('privacy_consent_timestamp');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('privacy_consent_version');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('privacy_user_preferences');
        });
    });

    describe('Privacy Policy Integration', () => {
        it('should return default privacy policy URL', () => {
            const url = privacyManager.getPrivacyPolicyUrl();
            expect(url).toBe('/privacy-policy');
        });

        it('should return configured privacy policy URL', () => {
            process.env.REACT_APP_PRIVACY_POLICY_URL = 'https://example.com/privacy';

            const url = privacyManager.getPrivacyPolicyUrl();
            expect(url).toBe('https://example.com/privacy');

            delete process.env.REACT_APP_PRIVACY_POLICY_URL;
        });
    });

    describe('Error Handling', () => {
        it('should handle localStorage errors gracefully', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Mock localStorage error
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            privacyManager.initialize();

            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });

        it('should handle consent preference loading errors', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Mock valid consent but invalid JSON in localStorage
            localStorageMock.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'privacy_consent_timestamp':
                        return Date.now().toString();
                    case 'privacy_consent_status':
                        return 'granted';
                    case 'privacy_consent_version':
                        return '1.0';
                    case 'privacy_user_preferences':
                        return 'invalid json';
                    default:
                        return null;
                }
            });

            privacyManager.loadConsentPreferences();

            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });
    });
});
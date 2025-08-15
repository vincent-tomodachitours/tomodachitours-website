// Simple tests for Attribution Service core functionality
import attributionService from '../attributionService';

// Mock sessionStorage
const mockSessionStorage = {
    store: {},
    getItem: jest.fn((key) => mockSessionStorage.store[key] || null),
    setItem: jest.fn((key, value) => {
        mockSessionStorage.store[key] = value;
    }),
    removeItem: jest.fn((key) => {
        delete mockSessionStorage.store[key];
    }),
    clear: jest.fn(() => {
        mockSessionStorage.store = {};
    })
};

Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage
});

describe('AttributionService Core Functionality', () => {
    beforeEach(() => {
        mockSessionStorage.clear();
        jest.clearAllMocks();
    });

    describe('parseUTMParameters', () => {
        it('should parse UTM parameters from URL with all parameters', () => {
            const testUrl = 'https://example.com/tours?utm_source=google&utm_medium=cpc&utm_campaign=summer2024&utm_term=kyoto+tours&utm_content=ad1&gclid=abc123';
            const params = attributionService.parseUTMParameters(testUrl);

            expect(params).toEqual({
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'summer2024',
                utm_term: 'kyoto+tours',
                utm_content: 'ad1',
                gclid: 'abc123',
                fbclid: null,
                msclkid: null
            });
        });

        it('should handle URL without UTM parameters', () => {
            const testUrl = 'https://example.com/tours';
            const params = attributionService.parseUTMParameters(testUrl);

            expect(params).toEqual({
                utm_source: null,
                utm_medium: null,
                utm_campaign: null,
                utm_term: null,
                utm_content: null,
                gclid: null,
                fbclid: null,
                msclkid: null
            });
        });

        it('should handle partial UTM parameters', () => {
            const testUrl = 'https://example.com/tours?utm_source=facebook&gclid=xyz789';
            const params = attributionService.parseUTMParameters(testUrl);

            expect(params).toEqual({
                utm_source: 'facebook',
                utm_medium: null,
                utm_campaign: null,
                utm_term: null,
                utm_content: null,
                gclid: 'xyz789',
                fbclid: null,
                msclkid: null
            });
        });
    });

    describe('session management', () => {
        it('should generate unique session IDs', () => {
            const sessionId1 = attributionService.generateSessionId();
            const sessionId2 = attributionService.generateSessionId();

            expect(sessionId1).not.toBe(sessionId2);
            expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
            expect(sessionId2).toMatch(/^session_\d+_[a-z0-9]+$/);
        });
    });

    describe('data storage and retrieval', () => {
        it('should store and retrieve attribution data', () => {
            const testData = {
                timestamp: Date.now(),
                session_id: 'test_session_123',
                source: 'google',
                medium: 'cpc',
                campaign: 'test_campaign',
                gclid: 'test_gclid'
            };

            attributionService.storeAttributionData(testData);
            const retrievedData = attributionService.getAttributionData();

            expect(retrievedData).toEqual(testData);
        });

        it('should return null when no attribution data exists', () => {
            const data = attributionService.getAttributionData();
            expect(data).toBeNull();
        });

        it('should clear all attribution data', () => {
            const testData = {
                timestamp: Date.now(),
                session_id: 'test_session_123',
                source: 'google',
                medium: 'cpc'
            };

            attributionService.storeAttributionData(testData);
            expect(attributionService.getAttributionData()).toBeTruthy();

            attributionService.clearAttributionData();
            expect(attributionService.getAttributionData()).toBeNull();
        });
    });

    describe('attribution chain', () => {
        it('should build attribution chain with different sources', () => {
            const attribution1 = {
                timestamp: Date.now(),
                source: 'google',
                medium: 'organic',
                campaign: null,
                gclid: null,
                landing_page: '/tours'
            };

            const attribution2 = {
                timestamp: Date.now() + 1000,
                source: 'facebook',
                medium: 'social',
                campaign: 'social_campaign',
                gclid: null,
                landing_page: '/tours'
            };

            attributionService.addToAttributionChain(attribution1);
            attributionService.addToAttributionChain(attribution2);

            const chain = attributionService.getAttributionChain();
            expect(chain).toHaveLength(2);
            expect(chain[0].source).toBe('google');
            expect(chain[1].source).toBe('facebook');
        });

        it('should not duplicate same source/medium in chain', () => {
            const attribution = {
                timestamp: Date.now(),
                source: 'google',
                medium: 'cpc',
                campaign: 'test',
                gclid: 'abc123',
                landing_page: '/tours'
            };

            attributionService.addToAttributionChain(attribution);
            attributionService.addToAttributionChain(attribution);

            const chain = attributionService.getAttributionChain();
            expect(chain).toHaveLength(1);
        });
    });
});
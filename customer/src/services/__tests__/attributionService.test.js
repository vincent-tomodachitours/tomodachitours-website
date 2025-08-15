// Tests for Attribution Service
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

// Mock window.location
delete window.location;
window.location = {
    href: 'https://example.com/tours?utm_source=google&utm_medium=cpc&utm_campaign=summer2024&gclid=abc123',
    pathname: '/tours',
    search: '?utm_source=google&utm_medium=cpc&utm_campaign=summer2024&gclid=abc123',
    hostname: 'example.com'
};

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
    value: 'https://google.com/search?q=kyoto+tours',
    writable: true,
    configurable: true
});

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    writable: true
});

// Mock screen and window dimensions
Object.defineProperty(window, 'screen', {
    value: { width: 1920, height: 1080 }
});
Object.defineProperty(window, 'innerWidth', { value: 1200 });
Object.defineProperty(window, 'innerHeight', { value: 800 });

describe('AttributionService', () => {
    beforeEach(() => {
        mockSessionStorage.clear();
        jest.clearAllMocks();
    });

    describe('parseUTMParameters', () => {
        it('should parse UTM parameters from URL', () => {
            const params = attributionService.parseUTMParameters();

            expect(params).toEqual({
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'summer2024',
                utm_term: null,
                utm_content: null,
                gclid: 'abc123',
                fbclid: null,
                msclkid: null
            });
        });

        it('should handle URL without UTM parameters', () => {
            const params = attributionService.parseUTMParameters('https://example.com/tours');

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
    });
    describe('getReferrerData', () => {
        it('should classify Google referrer as organic search', () => {
            document.referrer = 'https://google.com/search?q=kyoto+tours';
            const referrerData = attributionService.getReferrerData();

            expect(referrerData).toEqual({
                referrer: 'https://google.com/search?q=kyoto+tours',
                referrer_domain: 'google.com',
                referrer_type: 'organic_search'
            });
        });

        it('should classify Facebook referrer as social', () => {
            document.referrer = 'https://facebook.com/page';
            const referrerData = attributionService.getReferrerData();

            expect(referrerData).toEqual({
                referrer: 'https://facebook.com/page',
                referrer_domain: 'facebook.com',
                referrer_type: 'social'
            });
        });

        it('should handle direct traffic', () => {
            document.referrer = '';
            const referrerData = attributionService.getReferrerData();

            expect(referrerData).toEqual({
                referrer: '',
                referrer_domain: '',
                referrer_type: 'direct'
            });
        });
    });

    describe('captureAttributionData', () => {
        it('should capture complete attribution data with UTM parameters', () => {
            const attributionData = attributionService.captureAttributionData();

            expect(attributionData).toMatchObject({
                source: 'google',
                medium: 'cpc',
                campaign: 'summer2024',
                gclid: 'abc123',
                landing_page: '/tours?utm_source=google&utm_medium=cpc&utm_campaign=summer2024&gclid=abc123',
                referrer: 'https://google.com/search?q=kyoto+tours'
            });
            expect(attributionData.timestamp).toBeDefined();
            expect(attributionData.session_id).toBeDefined();
        });

        it('should detect Google Ads traffic from gclid without UTM parameters', () => {
            window.location.href = 'https://example.com/tours?gclid=xyz789';
            window.location.search = '?gclid=xyz789';

            const attributionData = attributionService.captureAttributionData();

            expect(attributionData.source).toBe('google');
            expect(attributionData.medium).toBe('cpc');
            expect(attributionData.gclid).toBe('xyz789');
        });
    });

    describe('session management', () => {
        it('should create and maintain session ID', () => {
            const sessionId1 = attributionService.getOrCreateSessionId();
            const sessionId2 = attributionService.getOrCreateSessionId();

            expect(sessionId1).toBe(sessionId2);
            expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
        });

        it('should create new session after timeout', () => {
            const sessionId1 = attributionService.getOrCreateSessionId();

            // Mock expired session
            const expiredTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
            sessionStorage.setItem('attribution_session_time', expiredTime.toString());

            const sessionId2 = attributionService.getOrCreateSessionId();

            expect(sessionId1).not.toBe(sessionId2);
        });
    });

    describe('attribution chain tracking', () => {
        it('should build attribution chain for different sources', () => {
            // First touchpoint - organic search
            document.referrer = 'https://google.com/search';
            window.location.href = 'https://example.com/tours';
            window.location.search = '';

            attributionService.initialize();
            let chain = attributionService.getAttributionChain();
            expect(chain).toHaveLength(1);
            expect(chain[0].source).toBe('google.com');
            expect(chain[0].medium).toBe('organic');

            // Second touchpoint - paid search
            window.location.href = 'https://example.com/tours?utm_source=google&utm_medium=cpc&gclid=abc123';
            window.location.search = '?utm_source=google&utm_medium=cpc&gclid=abc123';

            attributionService.initialize();
            chain = attributionService.getAttributionChain();
            expect(chain).toHaveLength(2);
            expect(chain[1].source).toBe('google');
            expect(chain[1].medium).toBe('cpc');
        });

        it('should not duplicate same source/medium in chain', () => {
            window.location.href = 'https://example.com/tours?utm_source=google&utm_medium=cpc';
            window.location.search = '?utm_source=google&utm_medium=cpc';

            attributionService.initialize();
            attributionService.initialize(); // Initialize twice

            const chain = attributionService.getAttributionChain();
            expect(chain).toHaveLength(1);
        });
    });

    describe('getAttributionForAnalytics', () => {
        it('should format attribution data for analytics', () => {
            attributionService.initialize();
            const analyticsData = attributionService.getAttributionForAnalytics();

            expect(analyticsData).toMatchObject({
                source: 'google',
                medium: 'cpc',
                campaign: 'summer2024',
                gclid: 'abc123',
                first_source: 'google',
                first_medium: 'cpc'
            });
            expect(analyticsData.session_id).toBeDefined();
            expect(analyticsData.touchpoints).toBeDefined();
        });

        it('should return empty object when no attribution data', () => {
            const analyticsData = attributionService.getAttributionForAnalytics();
            expect(analyticsData).toEqual({});
        });
    });

    describe('clearAttributionData', () => {
        it('should clear all attribution data from storage', () => {
            attributionService.initialize();
            expect(attributionService.getAttributionData()).toBeTruthy();

            attributionService.clearAttributionData();
            expect(attributionService.getAttributionData()).toBeNull();
            expect(attributionService.getAttributionChain()).toEqual([]);
        });
    });
});
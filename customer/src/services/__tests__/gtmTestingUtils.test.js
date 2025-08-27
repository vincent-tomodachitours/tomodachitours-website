/**
 * Tests for GTM Testing Utilities
 */

import gtmTestingUtils from '../gtmTestingUtils.js';

// Mock environment variables
const mockEnv = {
    REACT_APP_GTM_CONTAINER_ID: 'GTM-XXXXXXX',
    REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-17482092392',
    REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: JSON.stringify({
        purchase: 'AbC-D_efGhIjKlMnOp',
        begin_checkout: 'XyZ-A_bcDeFgHiJkLm',
        view_item: 'QrS-T_uvWxYzAbCdEf',
        add_payment_info: 'MnO-P_qrStUvWxYzAb'
    }),
    REACT_APP_ENHANCED_CONVERSIONS_ENABLED: 'true'
};

// Mock process.env
Object.defineProperty(process, 'env', {
    value: mockEnv
});

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'createElement', {
    value: jest.fn(() => ({
        src: '',
        async: false
    })),
    writable: true
});

Object.defineProperty(document, 'getElementsByTagName', {
    value: jest.fn(() => [{ parentNode: { insertBefore: jest.fn() } }]),
    writable: true
});

describe('GTMTestingUtils', () => {
    beforeEach(() => {
        // Reset window.dataLayer
        window.dataLayer = [];

        // Clear test history
        gtmTestingUtils.clearTestHistory();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('Preview Mode', () => {
        test('should enable preview mode with existing script', () => {
            const mockScript = { src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX' };
            document.querySelector.mockReturnValue(mockScript);

            const result = gtmTestingUtils.enablePreviewMode('GTM-XXXXXXX', 'preview-token-123');

            expect(result).toBe(true);
            expect(mockScript.src).toContain('gtm_preview=preview-token-123');
            expect(mockScript.src).toContain('gtm_cookies_win=x');
        });

        test('should create new script when no existing script found', () => {
            document.querySelector.mockReturnValue(null);
            const mockScript = { src: '', async: false };
            document.createElement.mockReturnValue(mockScript);

            // Mock getElementsByTagName to return proper structure
            const mockFirstScript = { parentNode: { insertBefore: jest.fn() } };
            document.getElementsByTagName.mockReturnValue([mockFirstScript]);

            const result = gtmTestingUtils.enablePreviewMode('GTM-XXXXXXX', 'preview-token-123');

            expect(result).toBe(true);
            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(mockScript.src).toContain('GTM-XXXXXXX');
            expect(mockScript.src).toContain('gtm_preview=preview-token-123');
            expect(mockScript.async).toBe(true);
            expect(mockFirstScript.parentNode.insertBefore).toHaveBeenCalledWith(mockScript, mockFirstScript);
        });

        test('should fail when container ID or preview token is missing', () => {
            const result1 = gtmTestingUtils.enablePreviewMode('', 'preview-token-123');
            const result2 = gtmTestingUtils.enablePreviewMode('GTM-XXXXXXX', '');

            expect(result1).toBe(false);
            expect(result2).toBe(false);
        });
    });

    describe('Conversion Tag Testing', () => {
        test('should fire test purchase conversion', () => {
            const testData = {
                value: 20000,
                currency: 'JPY',
                tour_id: 'test_tour'
            };

            const testId = gtmTestingUtils.testConversionTagFiring('purchase', testData);

            expect(testId).toBeTruthy();
            expect(window.dataLayer).toHaveLength(2); // google_ads_conversion + purchase events

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent).toBeDefined();
            expect(conversionEvent.event_label).toBe('purchase');
            expect(conversionEvent.value).toBe(20000);
            expect(conversionEvent.tour_id).toBe('test_tour');
        });

        test('should fire test begin_checkout conversion with default data', () => {
            const testId = gtmTestingUtils.testConversionTagFiring('begin_checkout');

            expect(testId).toBeTruthy();
            expect(window.dataLayer).toHaveLength(2);

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent).toBeDefined();
            expect(conversionEvent.event_label).toBe('begin_checkout');
            expect(conversionEvent.value).toBe(15000); // Default value
            expect(conversionEvent.currency).toBe('JPY');
        });

        test('should fire test view_item conversion', () => {
            const testId = gtmTestingUtils.testConversionTagFiring('view_item');

            expect(testId).toBeTruthy();

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent.event_label).toBe('view_item');
            expect(conversionEvent.item_category).toBe('tour');
        });

        test('should fire test add_payment_info conversion', () => {
            const testId = gtmTestingUtils.testConversionTagFiring('add_payment_info');

            expect(testId).toBeTruthy();

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent.event_label).toBe('add_payment_info');
            expect(conversionEvent.payment_provider).toBe('stripe');
        });

        test('should record test events in history', () => {
            gtmTestingUtils.testConversionTagFiring('purchase');
            gtmTestingUtils.testConversionTagFiring('begin_checkout');

            const history = gtmTestingUtils.getTestHistory();
            expect(history).toHaveLength(2);
            expect(history[0].conversionType).toBe('purchase');
            expect(history[1].conversionType).toBe('begin_checkout');
        });
    });

    describe('Test All Conversions', () => {
        test('should test all conversion types', () => {
            const results = gtmTestingUtils.testAllConversions();

            expect(results).toHaveProperty('view_item');
            expect(results).toHaveProperty('begin_checkout');
            expect(results).toHaveProperty('add_payment_info');
            expect(results).toHaveProperty('purchase');

            Object.values(results).forEach(result => {
                expect(result.success).toBe(true);
                expect(result.testId).toBeTruthy();
            });

            // Should have fired 8 events total (2 per conversion type)
            expect(window.dataLayer).toHaveLength(8);
        });
    });

    describe('GTM Container Validation', () => {
        test('should validate GTM loading with all components present', () => {
            // Mock GTM loaded state
            window.google_tag_manager = {
                'GTM-XXXXXXX': { loaded: true }
            };
            document.querySelectorAll.mockReturnValue([{ src: 'gtm.js' }]);

            const validation = gtmTestingUtils.validateGTMLoading('GTM-XXXXXXX');

            expect(validation.containerLoaded).toBe(true);
            expect(validation.dataLayerExists).toBe(true);
            expect(validation.gtmObjectExists).toBe(true);
            expect(validation.scriptsLoaded).toBe(true);
        });

        test('should validate GTM loading with missing components', () => {
            // Reset GTM state
            delete window.google_tag_manager;
            document.querySelectorAll.mockReturnValue([]);

            const validation = gtmTestingUtils.validateGTMLoading('GTM-XXXXXXX');

            expect(validation.containerLoaded).toBe(false);
            expect(validation.dataLayerExists).toBe(true); // dataLayer was initialized
            expect(validation.gtmObjectExists).toBe(false);
            expect(validation.scriptsLoaded).toBe(false);
        });
    });

    describe('DataLayer Monitoring', () => {
        test('should monitor dataLayer events', (done) => {
            const monitoredEvents = gtmTestingUtils.monitorDataLayerEvents(100);

            // Push some test events
            window.dataLayer.push({ event: 'test_event_1' });
            window.dataLayer.push({ event: 'test_event_2' });

            setTimeout(() => {
                expect(monitoredEvents).toHaveLength(2);
                expect(monitoredEvents[0].data[0].event).toBe('test_event_1');
                expect(monitoredEvents[1].data[0].event).toBe('test_event_2');
                done();
            }, 150);
        });
    });

    describe('Diagnostic Report', () => {
        test('should generate comprehensive diagnostic report', () => {
            // Set up test state
            window.google_tag_manager = {
                'GTM-XXXXXXX': { loaded: true }
            };
            document.querySelectorAll.mockReturnValue([{ src: 'gtm.js' }]);

            // Add some test events
            gtmTestingUtils.testConversionTagFiring('purchase');

            const report = gtmTestingUtils.generateDiagnosticReport();

            expect(report).toHaveProperty('timestamp');
            expect(report).toHaveProperty('gtmConfiguration');
            expect(report).toHaveProperty('conversionConfiguration');
            expect(report).toHaveProperty('testEvents');
            expect(report).toHaveProperty('dataLayerStatus');

            expect(report.gtmConfiguration.containerId).toBe('GTM-XXXXXXX');
            expect(report.gtmConfiguration.containerValidation.containerLoaded).toBe(true);

            expect(report.conversionConfiguration.conversionId).toBe('AW-17482092392');
            expect(report.conversionConfiguration.enhancedConversionsEnabled).toBe(true);

            expect(report.testEvents).toHaveLength(1);
            expect(report.dataLayerStatus.exists).toBe(true);
            expect(report.dataLayerStatus.length).toBeGreaterThan(0);
        });
    });

    describe('Test History Management', () => {
        test('should clear test history', () => {
            gtmTestingUtils.testConversionTagFiring('purchase');
            expect(gtmTestingUtils.getTestHistory()).toHaveLength(1);

            gtmTestingUtils.clearTestHistory();
            expect(gtmTestingUtils.getTestHistory()).toHaveLength(0);
        });

        test('should maintain test history across multiple tests', () => {
            gtmTestingUtils.testConversionTagFiring('purchase');
            gtmTestingUtils.testConversionTagFiring('begin_checkout');
            gtmTestingUtils.testConversionTagFiring('view_item');

            const history = gtmTestingUtils.getTestHistory();
            expect(history).toHaveLength(3);

            const conversionTypes = history.map(event => event.conversionType);
            expect(conversionTypes).toContain('purchase');
            expect(conversionTypes).toContain('begin_checkout');
            expect(conversionTypes).toContain('view_item');
        });
    });
});
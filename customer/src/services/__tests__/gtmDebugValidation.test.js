/**
 * GTM Debug Mode and Validation Tests
 * Tests GTM debug functionality and validation scenarios
 * Requirements: 2.3, 10.2 (Task 14)
 */

import gtmService from '../gtmService.js';

describe('GTM Debug Mode and Validation Tests', () => {
    let mockDataLayer;
    let mockGoogleTagManager;
    let mockConsole;
    let originalWindow;
    let originalConsole;

    beforeEach(() => {
        // Store originals
        originalWindow = global.window;
        originalConsole = global.console;

        // Reset mocks
        jest.clearAllMocks();

        // Create fresh mocks
        mockDataLayer = [];
        mockGoogleTagManager = { 'GTM-DEBUG123': { loaded: true } };
        mockConsole = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Mock global objects
        global.window = {
            dataLayer: mockDataLayer,
            google_tag_manager: mockGoogleTagManager,
            location: {
                href: 'https://test.example.com?gtm_debug=1',
                search: '?gtm_debug=1&gtm_auth=test_auth'
            }
        };

        global.console = mockConsole;

        // Mock document
        global.document = {
            querySelector: jest.fn().mockReturnValue(null),
            createElement: jest.fn().mockReturnValue({
                onload: null,
                onerror: null,
                src: '',
                async: false
            }),
            getElementsByTagName: jest.fn().mockReturnValue([{
                parentNode: { insertBefore: jest.fn() }
            }])
        };

        // Reset service state
        gtmService.isInitialized = false;
        gtmService.containerId = null;
        gtmService.fallbackToGtag = false;
        gtmService.debugMode = false;
    });

    afterEach(() => {
        global.window = originalWindow;
        global.console = originalConsole;
    });

    describe('Debug Mode Activation Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-DEBUG123');
        });

        test('should enable debug mode and log activation', () => {
            gtmService.enableDebugMode(true);

            expect(gtmService.debugMode).toBe(true);
            expect(mockConsole.log).toHaveBeenCalledWith('GTM: Debug mode enabled');

            // Should push debug mode event to dataLayer
            const debugEvent = mockDataLayer.find(event =>
                event.event === 'gtm_debug_mode'
            );

            expect(debugEvent).toBeDefined();
            expect(debugEvent.debug_mode).toBe(true);
            expect(debugEvent._timestamp).toBeDefined();
        });

        test('should disable debug mode', () => {
            gtmService.enableDebugMode(true);
            expect(gtmService.debugMode).toBe(true);

            gtmService.enableDebugMode(false);
            expect(gtmService.debugMode).toBe(false);
        });

        test('should add debug information to events when debug mode is enabled', () => {
            gtmService.enableDebugMode(true);

            // Clear debug mode event
            mockDataLayer.length = 0;

            gtmService.pushEvent('debug_test_event', { value: 100 });

            const testEvent = mockDataLayer.find(event =>
                event.event === 'debug_test_event'
            );

            expect(testEvent._debug).toBeDefined();
            expect(testEvent._debug.source).toBe('gtmService');
            expect(testEvent._debug.containerId).toBe('GTM-DEBUG123');
            expect(testEvent._debug.fallbackMode).toBe(false);
        });

        test('should log debug information for conversion tracking', () => {
            gtmService.enableDebugMode(true);
            mockConsole.log.mockClear(); // Clear debug mode activation log

            const conversionData = {
                transaction_id: 'txn_debug_test',
                value: 15000,
                currency: 'JPY'
            };

            gtmService.trackPurchaseConversion(conversionData);

            // Should log debug information
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('GTM: Conversion tracked - purchase:'),
                expect.any(Object)
            );
        });
    });

    describe('Tag Validation Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-DEBUG123');
        });

        test('should validate tag firing with validation event', async () => {
            const tagName = 'google_ads_conversion';
            const result = await gtmService.validateTagFiring(tagName);

            expect(result).toBe(true);

            const validationEvent = mockDataLayer.find(event =>
                event.event === 'tag_validation'
            );

            expect(validationEvent).toBeDefined();
            expect(validationEvent.tag_name).toBe(tagName);
            expect(validationEvent.validation_id).toBeDefined();
            expect(validationEvent.validation_id).toMatch(/^validation_\d+$/);
            expect(validationEvent._timestamp).toBeDefined();
        });

        test('should handle tag validation without tag name', async () => {
            const result = await gtmService.validateTagFiring();

            expect(result).toBe(false);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                'GTM: Tag name is required for validation'
            );
        });

        test('should validate multiple tags sequentially', async () => {
            const tags = ['google_ads_conversion', 'ga4_purchase', 'facebook_pixel'];

            for (const tag of tags) {
                const result = await gtmService.validateTagFiring(tag);
                expect(result).toBe(true);
            }

            const validationEvents = mockDataLayer.filter(event =>
                event.event === 'tag_validation'
            );

            expect(validationEvents.length).toBe(3);

            tags.forEach((tag, index) => {
                expect(validationEvents[index].tag_name).toBe(tag);
            });
        });

        test('should handle tag validation errors gracefully', async () => {
            // Mock dataLayer to throw error
            const originalPush = global.window.dataLayer.push;
            global.window.dataLayer.push = jest.fn(() => {
                throw new Error('Validation error');
            });

            const result = await gtmService.validateTagFiring('error_tag');

            expect(result).toBe(false);
            expect(mockConsole.error).toHaveBeenCalledWith(
                'GTM: Tag validation failed:',
                expect.any(Error)
            );

            // Restore original push
            global.window.dataLayer.push = originalPush;
        });
    });

    describe('Debug Information Validation Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-DEBUG123');
            gtmService.enableDebugMode(true);
        });

        test('should include comprehensive debug information in events', () => {
            const eventData = {
                event_category: 'ecommerce',
                value: 25000,
                currency: 'JPY'
            };

            gtmService.pushEvent('comprehensive_debug_test', eventData);

            const debugEvent = mockDataLayer.find(event =>
                event.event === 'comprehensive_debug_test'
            );

            expect(debugEvent._debug).toEqual({
                source: 'gtmService',
                containerId: 'GTM-DEBUG123',
                fallbackMode: false
            });

            expect(debugEvent._timestamp).toBeDefined();
            expect(debugEvent.event_category).toBe('ecommerce');
            expect(debugEvent.value).toBe(25000);
            expect(debugEvent.currency).toBe('JPY');
        });

        test('should validate debug information in conversion events', () => {
            const conversionData = {
                transaction_id: 'txn_debug_validation',
                value: 18000,
                currency: 'JPY',
                items: [{
                    item_id: 'debug-tour',
                    item_name: 'Debug Test Tour',
                    price: 18000,
                    quantity: 1
                }]
            };

            gtmService.trackPurchaseConversion(conversionData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent._debug).toBeDefined();
            expect(conversionEvent._debug.source).toBe('gtmService');
            expect(conversionEvent._timestamp).toBeDefined();
        });

        test('should validate debug information shows fallback mode', async () => {
            // Force fallback mode
            gtmService.fallbackToGtag = true;

            gtmService.pushEvent('fallback_debug_test', { value: 100 });

            const debugEvent = mockDataLayer.find(event =>
                event.event === 'fallback_debug_test'
            );

            expect(debugEvent._debug.fallbackMode).toBe(true);
        });
    });

    describe('GTM Status and Diagnostic Tests', () => {
        test('should provide comprehensive status information', async () => {
            await gtmService.initialize('GTM-DEBUG123');
            gtmService.enableDebugMode(true);

            // Add some events to dataLayer
            gtmService.pushEvent('status_test_1', { value: 100 });
            gtmService.pushEvent('status_test_2', { value: 200 });

            const status = gtmService.getStatus();

            expect(status).toEqual({
                isInitialized: true,
                containerId: 'GTM-DEBUG123',
                fallbackMode: false,
                debugMode: true,
                dataLayerLength: expect.any(Number),
                conversionConfig: expect.any(Object),
                ga4Config: expect.any(Object)
            });

            expect(status.dataLayerLength).toBeGreaterThan(0);
        });

        test('should show fallback status when GTM fails', async () => {
            // Simulate GTM failure
            gtmService.initializationTimeout = 10;

            const result = await gtmService.initialize('GTM-FAILED');

            expect(result).toBe(false);

            const status = gtmService.getStatus();

            expect(status.isInitialized).toBe(false);
            expect(status.fallbackMode).toBe(true);
            expect(status.containerId).toBe('GTM-FAILED');
        });

        test('should validate dataLayer length tracking', () => {
            const initialStatus = gtmService.getStatus();
            const initialLength = initialStatus.dataLayerLength;

            // Add events
            gtmService.pushEvent('length_test_1', {});
            gtmService.pushEvent('length_test_2', {});

            const updatedStatus = gtmService.getStatus();

            expect(updatedStatus.dataLayerLength).toBe(initialLength + 2);
        });
    });

    describe('Preview Mode and Environment Tests', () => {
        test('should handle GTM preview mode parameters', async () => {
            const mockScript = global.document.createElement();
            mockGoogleTagManager['GTM-PREVIEW123'] = { loaded: true };

            const options = {
                auth: 'preview_auth_token',
                preview: 'preview_env_123'
            };

            await gtmService.initialize('GTM-PREVIEW123', options);

            expect(mockScript.src).toContain('GTM-PREVIEW123');
            expect(mockScript.src).toContain('gtm_auth=preview_auth_token');
            expect(mockScript.src).toContain('gtm_preview=preview_env_123');
        });

        test('should use environment variables for preview mode', async () => {
            process.env.REACT_APP_GTM_AUTH = 'env_auth_token';
            process.env.REACT_APP_GTM_PREVIEW = 'env_preview_123';

            const mockScript = global.document.createElement();
            mockGoogleTagManager['GTM-ENV123'] = { loaded: true };

            await gtmService.initialize('GTM-ENV123');

            expect(mockScript.src).toContain('gtm_auth=env_auth_token');
            expect(mockScript.src).toContain('gtm_preview=env_preview_123');

            // Clean up
            delete process.env.REACT_APP_GTM_AUTH;
            delete process.env.REACT_APP_GTM_PREVIEW;
        });

        test('should validate preview mode with debug information', async () => {
            await gtmService.initialize('GTM-DEBUG123', {
                auth: 'debug_auth',
                preview: 'debug_preview'
            });

            gtmService.enableDebugMode(true);

            // Clear debug mode event
            mockDataLayer.length = 0;

            gtmService.pushEvent('preview_debug_test', { value: 500 });

            const debugEvent = mockDataLayer.find(event =>
                event.event === 'preview_debug_test'
            );

            expect(debugEvent._debug).toBeDefined();
            expect(debugEvent._debug.containerId).toBe('GTM-DEBUG123');
        });
    });

    describe('Error Handling and Edge Cases in Debug Mode', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-DEBUG123');
            gtmService.enableDebugMode(true);
        });

        test('should handle debug mode with dataLayer errors', () => {
            // Mock dataLayer push to throw error
            const originalPush = global.window.dataLayer.push;
            global.window.dataLayer.push = jest.fn(() => {
                throw new Error('Debug dataLayer error');
            });

            gtmService.pushEvent('debug_error_test', { value: 100 });

            expect(mockConsole.error).toHaveBeenCalledWith(
                'GTM: Failed to push event:',
                expect.any(Error)
            );

            // Restore original push
            global.window.dataLayer.push = originalPush;
        });

        test('should validate debug information with missing container', () => {
            gtmService.containerId = null;

            gtmService.pushEvent('no_container_debug', { value: 200 });

            const debugEvent = mockDataLayer.find(event =>
                event.event === 'no_container_debug'
            );

            expect(debugEvent._debug.containerId).toBeNull();
        });

        test('should handle debug mode toggle during active session', () => {
            // Start with debug mode off
            gtmService.enableDebugMode(false);
            gtmService.pushEvent('no_debug_event', { value: 100 });

            let event = mockDataLayer.find(e => e.event === 'no_debug_event');
            expect(event._debug).toBeUndefined();

            // Enable debug mode
            gtmService.enableDebugMode(true);
            mockDataLayer.length = 0; // Clear debug mode event

            gtmService.pushEvent('with_debug_event', { value: 200 });

            event = mockDataLayer.find(e => e.event === 'with_debug_event');
            expect(event._debug).toBeDefined();
        });

        test('should validate debug logging with conversion optimization', () => {
            mockConsole.log.mockClear();

            const conversionData = {
                transaction_id: 'txn_optimization_debug',
                value: 12000,
                currency: 'JPY',
                originalPrice: 15000
            };

            const pricingContext = {
                basePrice: 15000,
                discount: {
                    type: 'percentage',
                    value: 20
                }
            };

            gtmService.trackConversion('purchase', conversionData, null, pricingContext);

            // Should log optimization debug information
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('GTM: Conversion value optimized:'),
                expect.any(Object)
            );
        });
    });

    describe('Performance Monitoring in Debug Mode', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-DEBUG123');
            gtmService.enableDebugMode(true);
        });

        test('should validate debug mode performance impact', () => {
            const startTime = Date.now();

            // Track multiple events with debug mode
            for (let i = 0; i < 20; i++) {
                gtmService.pushEvent(`performance_debug_${i}`, {
                    value: i * 100,
                    index: i
                });
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Debug mode should not significantly impact performance (under 200ms for 20 events)
            expect(duration).toBeLessThan(200);

            // Verify all events have debug information
            const debugEvents = mockDataLayer.filter(event =>
                event.event.startsWith('performance_debug_')
            );

            expect(debugEvents.length).toBe(20);
            debugEvents.forEach(event => {
                expect(event._debug).toBeDefined();
                expect(event._timestamp).toBeDefined();
            });
        });

        test('should validate debug information memory usage', () => {
            const initialMemory = JSON.stringify(mockDataLayer).length;

            // Add debug events
            for (let i = 0; i < 10; i++) {
                gtmService.pushEvent(`memory_debug_${i}`, {
                    value: i * 1000,
                    description: `Test event ${i} for memory validation`
                });
            }

            const finalMemory = JSON.stringify(mockDataLayer).length;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (debug info adds some overhead)
            expect(memoryIncrease).toBeGreaterThan(0);
            expect(memoryIncrease).toBeLessThan(50000); // Less than 50KB for 10 events
        });
    });
});
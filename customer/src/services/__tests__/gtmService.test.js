/**
 * Unit tests for GTM Service
 */

import gtmService from '../gtmService.js';

// Mock environment variables
const mockEnv = {
    REACT_APP_GTM_CONTAINER_ID: 'GTM-TEST123',
    REACT_APP_GA_MEASUREMENT_ID: 'G-TEST123',
    REACT_APP_GTM_AUTH: 'test_auth',
    REACT_APP_GTM_PREVIEW: 'test_preview'
};

describe('GTMService', () => {
    let mockDataLayer;
    let mockGtag;
    let originalWindow;

    beforeEach(() => {
        // Store original window
        originalWindow = global.window;

        // Reset mocks
        jest.clearAllMocks();

        // Mock environment variables
        Object.keys(mockEnv).forEach(key => {
            process.env[key] = mockEnv[key];
        });

        // Create fresh mocks
        mockDataLayer = [];
        mockGtag = jest.fn();

        // Mock DOM elements
        const mockScript = {
            onload: null,
            onerror: null,
            src: '',
            async: false
        };

        const mockFirstScript = {
            parentNode: {
                insertBefore: jest.fn()
            }
        };

        // Mock global objects
        global.window = {
            dataLayer: mockDataLayer,
            gtag: mockGtag,
            google_tag_manager: {},
            document: {
                querySelector: jest.fn().mockReturnValue(null),
                createElement: jest.fn().mockReturnValue(mockScript),
                getElementsByTagName: jest.fn().mockReturnValue([mockFirstScript])
            }
        };

        global.document = global.window.document;

        // Reset service state
        gtmService.isInitialized = false;
        gtmService.containerId = null;
        gtmService.fallbackToGtag = false;
        gtmService.debugMode = false;
    });

    afterEach(() => {
        // Clean up environment variables
        Object.keys(mockEnv).forEach(key => {
            delete process.env[key];
        });

        // Restore original window
        global.window = originalWindow;
    });

    describe('initialization', () => {
        test('should initialize with provided container ID', async () => {
            // Mock successful GTM loading
            global.window.google_tag_manager = { 'GTM-TEST123': { loaded: true } };

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(true);
            expect(gtmService.isInitialized).toBe(true);
            expect(gtmService.containerId).toBe('GTM-TEST123');
        });

        test('should use environment variable for container ID', async () => {
            // Mock successful GTM loading
            global.window.google_tag_manager = { 'GTM-TEST123': { loaded: true } };

            const result = await gtmService.initialize();

            expect(result).toBe(true);
            expect(gtmService.containerId).toBe('GTM-TEST123');
        });

        test('should fallback to gtag when no container ID provided', async () => {
            delete process.env.REACT_APP_GTM_CONTAINER_ID;

            const result = await gtmService.initialize();

            expect(result).toBe(false);
            expect(gtmService.fallbackToGtag).toBe(true);
        });

        test('should handle GTM loading timeout', async () => {
            // Set short timeout for testing
            gtmService.initializationTimeout = 100;

            // Don't mock GTM as loaded to simulate timeout
            global.window.google_tag_manager = {};

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(false);
            expect(gtmService.fallbackToGtag).toBe(true);
        });

        test('should detect already loaded GTM container', async () => {
            global.window.google_tag_manager = { 'GTM-TEST123': { loaded: true } };

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(true);
            expect(gtmService.isInitialized).toBe(true);
        });
    });

    describe('pushEvent', () => {
        beforeEach(() => {
            gtmService.isInitialized = true;
            gtmService.containerId = 'GTM-TEST123';
            // Ensure we're using the fresh mockDataLayer
            global.window.dataLayer = mockDataLayer;
        });

        test('should push event to dataLayer', () => {
            const eventName = 'test_event';
            const eventData = { value: 100, currency: 'JPY' };

            gtmService.pushEvent(eventName, eventData);

            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: eventName,
                ...eventData
            });
            expect(mockDataLayer[0]._timestamp).toBeDefined();
        });

        test('should handle empty event data', () => {
            gtmService.pushEvent('test_event');

            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: 'test_event'
            });
        });

        test('should warn when event name is missing', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            gtmService.pushEvent();

            expect(consoleSpy).toHaveBeenCalledWith('GTM: Event name is required');
            expect(mockDataLayer).toHaveLength(0);

            consoleSpy.mockRestore();
        });

        test('should add debug information when debug mode enabled', () => {
            gtmService.enableDebugMode(true);

            // Clear the debug mode event from dataLayer
            mockDataLayer.length = 0;

            gtmService.pushEvent('test_event', { value: 100 });

            expect(mockDataLayer).toHaveLength(1);
            const testEvent = mockDataLayer[0];
            expect(testEvent._debug).toBeDefined();
            expect(testEvent._debug.source).toBe('gtmService');
        });

        test('should use fallback gtag when GTM failed to load', () => {
            gtmService.fallbackToGtag = true;
            global.window.gtag = mockGtag; // Ensure gtag is available for fallback

            gtmService.pushEvent('test_event', { value: 100 });

            // Should push to dataLayer and also call fallback gtag
            expect(mockDataLayer.length).toBeGreaterThanOrEqual(1);
            expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { value: 100 });
        });
    });

    describe('setUserProperties', () => {
        beforeEach(() => {
            gtmService.isInitialized = true;
            global.window.dataLayer = mockDataLayer;
        });

        test('should set user properties in dataLayer', () => {
            const properties = { user_id: '123', user_type: 'customer' };

            gtmService.setUserProperties(properties);

            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: 'set_user_properties',
                user_properties: properties
            });
        });

        test('should handle empty properties object', () => {
            gtmService.setUserProperties({});

            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0].user_properties).toEqual({});
        });

        test('should warn when properties is not an object', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            gtmService.setUserProperties('invalid');

            expect(consoleSpy).toHaveBeenCalledWith('GTM: User properties must be an object');
            expect(mockDataLayer).toHaveLength(0);

            consoleSpy.mockRestore();
        });

        test('should use fallback gtag when GTM failed to load', () => {
            gtmService.fallbackToGtag = true;
            global.window.gtag = mockGtag; // Ensure gtag is available
            const properties = { user_id: '123' };

            gtmService.setUserProperties(properties);

            expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', properties);
        });
    });

    describe('enableDebugMode', () => {
        beforeEach(() => {
            global.window.dataLayer = mockDataLayer;
        });

        test('should enable debug mode', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            gtmService.enableDebugMode(true);

            expect(gtmService.debugMode).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('GTM: Debug mode enabled');
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: 'gtm_debug_mode',
                debug_mode: true
            });

            consoleSpy.mockRestore();
        });

        test('should disable debug mode', () => {
            gtmService.debugMode = true;

            gtmService.enableDebugMode(false);

            expect(gtmService.debugMode).toBe(false);
        });
    });

    describe('validateTagFiring', () => {
        beforeEach(() => {
            gtmService.isInitialized = true;
            global.window.dataLayer = mockDataLayer;
        });

        test('should validate tag firing', async () => {
            const result = await gtmService.validateTagFiring('test_tag');

            expect(result).toBe(true);
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: 'tag_validation',
                tag_name: 'test_tag'
            });
            expect(mockDataLayer[0].validation_id).toBeDefined();
        });

        test('should warn when tag name is missing', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const result = await gtmService.validateTagFiring();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('GTM: Tag name is required for validation');

            consoleSpy.mockRestore();
        });
    });

    describe('getStatus', () => {
        beforeEach(() => {
            global.window.dataLayer = mockDataLayer;
        });

        test('should return current status', () => {
            gtmService.isInitialized = true;
            gtmService.containerId = 'GTM-TEST123';
            gtmService.fallbackToGtag = false;
            gtmService.debugMode = true;

            const status = gtmService.getStatus();

            expect(status).toEqual({
                isInitialized: true,
                containerId: 'GTM-TEST123',
                fallbackMode: false,
                debugMode: true,
                dataLayerLength: 0
            });
        });
    });

    describe('error handling', () => {
        test('should handle pushEvent errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataLayer to throw error
            global.window.dataLayer = {
                push: jest.fn(() => {
                    throw new Error('DataLayer error');
                })
            };

            gtmService.pushEvent('test_event', { value: 100 });

            expect(consoleSpy).toHaveBeenCalledWith('GTM: Failed to push event:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        test('should handle setUserProperties errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataLayer to throw error
            global.window.dataLayer = {
                push: jest.fn(() => {
                    throw new Error('DataLayer error');
                })
            };

            gtmService.setUserProperties({ user_id: '123' });

            expect(consoleSpy).toHaveBeenCalledWith('GTM: Failed to set user properties:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        test('should handle validateTagFiring errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataLayer to throw error
            global.window.dataLayer = {
                push: jest.fn(() => {
                    throw new Error('DataLayer error');
                })
            };

            const result = await gtmService.validateTagFiring('test_tag');

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('GTM: Tag validation failed:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('fallback functionality', () => {
        test('should initialize fallback gtag when GTM fails', async () => {
            delete global.window.gtag;

            // Simulate GTM initialization failure
            const result = await gtmService.initialize('GTM-INVALID');

            expect(result).toBe(false);
            expect(gtmService.fallbackToGtag).toBe(true);
            expect(global.window.gtag).toBeDefined();
        });

        test('should use existing gtag if available', async () => {
            const existingGtag = jest.fn();
            global.window.gtag = existingGtag;

            // Simulate GTM initialization failure
            await gtmService.initialize('GTM-INVALID');

            expect(global.window.gtag).toBe(existingGtag);
        });
    });
});
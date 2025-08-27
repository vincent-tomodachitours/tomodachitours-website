/**
 * Conversion Monitor Service Tests
 * 
 * Tests for real-time conversion validation, accuracy monitoring, and diagnostic reporting
 */

import conversionMonitor from '../conversionMonitor.js';
import gtmService from '../gtmService.js';
import bookingFlowManager from '../bookingFlowManager.js';
import enhancedConversionService from '../enhancedConversionService.js';

// Mock dependencies
jest.mock('../gtmService.js');
jest.mock('../bookingFlowManager.js');
jest.mock('../enhancedConversionService.js');

describe('ConversionMonitor', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup default mocks
        gtmService.getStatus.mockReturnValue({
            isInitialized: true,
            containerId: 'GTM-TEST123',
            fallbackMode: false,
            debugMode: false
        });

        gtmService.trackConversion.mockReturnValue(true);
        gtmService.validateTagFiring.mockResolvedValue(true);

        bookingFlowManager.getCurrentBookingState.mockReturnValue({
            bookingId: 'test-booking-123',
            currentStep: 'purchase',
            conversionTracking: {
                viewItemTracked: true,
                beginCheckoutTracked: true,
                addPaymentInfoTracked: true,
                purchaseTracked: true
            },
            createdAt: new Date().toISOString(),
            transactionId: 'txn-123',
            paymentData: { amount: 5000 },
            tourData: { tourId: 'tour-123' }
        });

        bookingFlowManager.isConversionTracked.mockReturnValue(true);

        enhancedConversionService.getStatus.mockReturnValue({
            isEnabled: true,
            hasSalt: true,
            isConfigured: true
        });

        enhancedConversionService.prepareEnhancedConversion.mockReturnValue({
            conversion_label: 'test-label',
            value: 5000,
            currency: 'JPY',
            transaction_id: 'txn-123',
            enhanced_conversion_data: {
                email: 'hashed-email',
                phone_number: 'hashed-phone'
            }
        });

        enhancedConversionService.trackEnhancedConversion.mockResolvedValue(true);
        enhancedConversionService.validatePrivacyCompliance.mockReturnValue({
            isCompliant: true,
            hasValidConsent: true,
            hasValidData: true,
            errors: []
        });
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            const status = conversionMonitor.getMonitoringStatus();
            expect(status.isInitialized).toBe(true);
            expect(status.monitoringEnabled).toBe(true);
        });

        test('should set up booking flow listener', () => {
            expect(bookingFlowManager.addListener).toHaveBeenCalled();
        });
    });

    describe('trackConversionAttempt', () => {
        test('should track a valid conversion attempt successfully', async () => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const result = await conversionMonitor.trackConversionAttempt(conversionData);

            expect(result.success).toBe(true);
            expect(result.attemptId).toBeDefined();

            const status = conversionMonitor.getMonitoringStatus();
            expect(status.accuracyMetrics.totalAttempts).toBe(1);
        });

        test('should fail validation for invalid conversion data', async () => {
            const invalidData = {
                event: 'purchase'
                // Missing required fields
            };

            const result = await conversionMonitor.trackConversionAttempt(invalidData);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Transaction ID is required for purchase events');

            const status = conversionMonitor.getMonitoringStatus();
            expect(status.accuracyMetrics.validationErrors).toBe(1);
        });

        test('should handle GTM firing failures with retry', async () => {
            gtmService.trackConversion.mockReturnValue(false);

            const conversionData = {
                event: 'view_item',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const result = await conversionMonitor.trackConversionAttempt(conversionData);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('All retry attempts failed');

            const status = conversionMonitor.getMonitoringStatus();
            expect(status.accuracyMetrics.failedFirings).toBe(1);
        });

        test('should use enhanced conversions for purchase events with customer data', async () => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }],
                user_data: {
                    email: 'test@example.com',
                    phone: '+819012345678'
                }
            };

            const result = await conversionMonitor.trackConversionAttempt(conversionData);

            expect(result.success).toBe(true);
            expect(enhancedConversionService.prepareEnhancedConversion).toHaveBeenCalled();
            expect(enhancedConversionService.trackEnhancedConversion).toHaveBeenCalled();
        });

        test('should throw error for missing event type', async () => {
            const invalidData = {};

            await expect(conversionMonitor.trackConversionAttempt(invalidData))
                .rejects.toThrow('Invalid conversion data: event type is required');
        });
    });

    describe('validateConversionFiring', () => {
        test('should validate successful conversion firing', async () => {
            // First track a conversion
            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const trackResult = await conversionMonitor.trackConversionAttempt(conversionData);

            // Then validate it
            const validationResult = await conversionMonitor.validateConversionFiring(trackResult.attemptId);

            expect(validationResult.isValid).toBe(true);
            expect(validationResult.conversionId).toBe(trackResult.attemptId);
            expect(validationResult.gtmValidation.isValid).toBe(true);
            expect(validationResult.bookingValidation.isValid).toBe(true);
        });

        test('should handle GTM validation failure', async () => {
            gtmService.validateTagFiring.mockResolvedValue(false);

            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const trackResult = await conversionMonitor.trackConversionAttempt(conversionData);
            const validationResult = await conversionMonitor.validateConversionFiring(trackResult.attemptId);

            expect(validationResult.isValid).toBe(false);
            expect(validationResult.gtmValidation.isValid).toBe(false);
            expect(validationResult.overallErrors).toContain('GTM tag firing validation failed');
        });

        test('should handle booking flow validation failure', async () => {
            bookingFlowManager.getCurrentBookingState.mockReturnValue(null);

            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const trackResult = await conversionMonitor.trackConversionAttempt(conversionData);
            const validationResult = await conversionMonitor.validateConversionFiring(trackResult.attemptId);

            expect(validationResult.isValid).toBe(false);
            expect(validationResult.bookingValidation.isValid).toBe(false);
            expect(validationResult.overallErrors).toContain('No active booking state');
        });

        test('should return error for non-existent conversion ID', async () => {
            const result = await conversionMonitor.validateConversionFiring('non-existent-id');

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Conversion attempt not found');
        });

        test('should throw error for missing conversion ID', async () => {
            await expect(conversionMonitor.validateConversionFiring())
                .rejects.toThrow('Conversion ID is required for validation');
        });
    });

    describe('compareActualVsTracked', () => {
        test('should compare tracked conversions with actual bookings', async () => {
            // Track a conversion first
            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const trackResult = await conversionMonitor.trackConversionAttempt(conversionData);
            await conversionMonitor.validateConversionFiring(trackResult.attemptId);

            // Mock the attempt as validated
            const attempt = conversionMonitor.conversionAttempts.get(trackResult.attemptId);
            attempt.status = 'validated';

            const comparisonResult = await conversionMonitor.compareActualVsTracked();

            expect(comparisonResult.trackedCount).toBe(1);
            expect(comparisonResult.actualCount).toBe(1);
            expect(comparisonResult.accuracy).toBe(1.0);
            expect(comparisonResult.matchedConversions).toHaveLength(1);
        });

        test('should detect missing conversions', async () => {
            // Mock actual bookings but no tracked conversions
            const comparisonResult = await conversionMonitor.compareActualVsTracked();

            expect(comparisonResult.trackedCount).toBe(0);
            expect(comparisonResult.actualCount).toBe(1);
            expect(comparisonResult.accuracy).toBe(0);
            expect(comparisonResult.missingConversions).toHaveLength(1);
        });

        test('should trigger accuracy alert when below threshold', async () => {
            const alertCallback = jest.fn();
            conversionMonitor.addAlertCallback(alertCallback);

            // Mock low accuracy scenario
            bookingFlowManager.getCurrentBookingState.mockReturnValue({
                bookingId: 'test-booking-123',
                createdAt: new Date().toISOString(),
                transactionId: 'txn-123',
                paymentData: { amount: 5000 },
                tourData: { tourId: 'tour-123' },
                conversionTracking: { purchaseTracked: true }
            });

            const comparisonResult = await conversionMonitor.compareActualVsTracked();

            expect(comparisonResult.accuracy).toBe(0);
            expect(alertCallback).toHaveBeenCalled();

            const alertCall = alertCallback.mock.calls[0][0];
            expect(alertCall.type).toBe('accuracy_alert');
            expect(alertCall.severity).toBe('critical');
        });
    });

    describe('generateDiagnosticReport', () => {
        test('should generate comprehensive diagnostic report', async () => {
            // Track some conversions first
            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            await conversionMonitor.trackConversionAttempt(conversionData);

            const report = conversionMonitor.generateDiagnosticReport();

            expect(report.generatedAt).toBeDefined();
            expect(report.summary).toBeDefined();
            expect(report.conversionAttempts).toBeDefined();
            expect(report.validationResults).toBeDefined();
            expect(report.accuracyMetrics).toBeDefined();
            expect(report.systemStatus).toBeDefined();
            expect(report.recommendations).toBeDefined();
            expect(report.detailedIssues).toBeDefined();
        });

        test('should include recommendations based on system status', () => {
            gtmService.getStatus.mockReturnValue({
                isInitialized: false,
                containerId: null,
                fallbackMode: true
            });

            const report = conversionMonitor.generateDiagnosticReport();

            expect(report.recommendations).toContainEqual(
                expect.objectContaining({
                    priority: 'critical',
                    category: 'gtm',
                    message: 'GTM is not initialized. Check container ID and loading configuration.'
                })
            );
        });

        test('should identify detailed issues', async () => {
            // Create a conversion attempt with high retry count
            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const trackResult = await conversionMonitor.trackConversionAttempt(conversionData);

            // Mock high retry count
            const attempt = conversionMonitor.conversionAttempts.get(trackResult.attemptId);
            attempt.retryCount = 2;

            const report = conversionMonitor.generateDiagnosticReport();

            expect(report.detailedIssues).toContainEqual(
                expect.objectContaining({
                    type: 'retry_issues',
                    severity: 'warning'
                })
            );
        });
    });

    describe('Alert Management', () => {
        test('should add and remove alert callbacks', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            conversionMonitor.addAlertCallback(callback1);
            conversionMonitor.addAlertCallback(callback2);

            let status = conversionMonitor.getMonitoringStatus();
            expect(status.alertCallbacks).toBe(2);

            conversionMonitor.removeAlertCallback(callback1);

            status = conversionMonitor.getMonitoringStatus();
            expect(status.alertCallbacks).toBe(1);
        });

        test('should not add non-function callbacks', () => {
            const initialStatus = conversionMonitor.getMonitoringStatus();
            const initialLength = initialStatus.alertCallbacks;

            conversionMonitor.addAlertCallback('not a function');
            conversionMonitor.addAlertCallback(null);
            conversionMonitor.addAlertCallback(undefined);

            const finalStatus = conversionMonitor.getMonitoringStatus();
            expect(finalStatus.alertCallbacks).toBe(initialLength);
        });
    });

    describe('Monitoring Status', () => {
        test('should return current monitoring status', () => {
            const status = conversionMonitor.getMonitoringStatus();

            expect(status.isInitialized).toBe(true);
            expect(status.monitoringEnabled).toBe(true);
            expect(status.accuracyMetrics).toBeDefined();
            expect(status.activeAttempts).toBeDefined();
            expect(status.validationResults).toBeDefined();
            expect(status.systemStatus).toBeDefined();
        });
    });

    describe('Booking Flow Event Handling', () => {
        test('should handle booking flow events automatically', () => {
            const trackSpy = jest.spyOn(conversionMonitor, 'trackConversionAttempt');
            trackSpy.mockResolvedValue({ success: true, attemptId: 'test-id' });

            // Simulate booking flow event
            const eventData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            conversionMonitor.handleBookingFlowEvent('purchase_tracked', eventData);

            expect(trackSpy).toHaveBeenCalledWith({
                event: 'purchase',
                ...eventData,
                source: 'booking_flow'
            });

            trackSpy.mockRestore();
        });

        test('should ignore non-conversion events', () => {
            const trackSpy = jest.spyOn(conversionMonitor, 'trackConversionAttempt');

            conversionMonitor.handleBookingFlowEvent('booking_initialized', {});

            expect(trackSpy).not.toHaveBeenCalled();

            trackSpy.mockRestore();
        });
    });

    describe('Validation Methods', () => {
        test('should validate conversion data correctly', () => {
            const validData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const result = conversionMonitor.validateConversionData(validData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should detect invalid event types', () => {
            const invalidData = {
                event: 'invalid_event',
                transaction_id: 'txn-123',
                value: 5000
            };

            const result = conversionMonitor.validateConversionData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid event type: invalid_event');
        });

        test('should validate enhanced conversion data', () => {
            const conversionData = {
                event: 'purchase',
                user_data: {
                    email: 'test@example.com',
                    phone: '+819012345678'
                }
            };

            const result = conversionMonitor.validateEnhancedConversionData(conversionData);

            expect(result.isValid).toBe(true);
            expect(enhancedConversionService.validatePrivacyCompliance).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle GTM service errors gracefully', async () => {
            gtmService.trackConversion.mockImplementation(() => {
                throw new Error('GTM service error');
            });

            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const result = await conversionMonitor.trackConversionAttempt(conversionData);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('GTM service error');
        });

        test('should handle validation errors gracefully', async () => {
            gtmService.validateTagFiring.mockRejectedValue(new Error('Validation error'));

            const conversionData = {
                event: 'purchase',
                transaction_id: 'txn-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            const trackResult = await conversionMonitor.trackConversionAttempt(conversionData);
            const validationResult = await conversionMonitor.validateConversionFiring(trackResult.attemptId);

            expect(validationResult.isValid).toBe(false);
            expect(validationResult.error).toBe('Validation error');
        });
    });
});
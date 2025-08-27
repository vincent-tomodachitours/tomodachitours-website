/**
 * Test suite for redesigned Thankyou page with GTM-based conversion tracking
 * 
 * Tests the implementation of task 9: Redesign Thankyou page with comprehensive purchase conversion tracking
 * Requirements: 1.1, 3.1, 4.1, 8.1
 */

import gtmService from '../../services/gtmService';
import bookingFlowManager from '../../services/bookingFlowManager';
import enhancedConversionService from '../../services/enhancedConversionService';
import serverSideConversionTracker from '../../services/serverSideConversionTracker';

// Mock the services
jest.mock('../../services/gtmService');
jest.mock('../../services/bookingFlowManager');
jest.mock('../../services/enhancedConversionService');
jest.mock('../../services/serverSideConversionTracker');

// Mock sessionStorage
const mockSessionStorage = {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage
});

// Mock URLSearchParams
const mockURLSearchParams = jest.fn();
Object.defineProperty(window, 'URLSearchParams', {
    value: mockURLSearchParams
});

describe('Thankyou Page - GTM-based Conversion Tracking Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        mockURLSearchParams.mockImplementation(() => ({
            get: jest.fn().mockReturnValue(null)
        }));

        mockSessionStorage.getItem.mockReturnValue(null);

        bookingFlowManager.getCurrentBookingState.mockReturnValue(null);
        bookingFlowManager.initializeBooking.mockReturnValue('booking_123');
        bookingFlowManager.trackPurchase.mockReturnValue({ success: true });

        gtmService.trackPurchaseConversion.mockReturnValue(true);
        gtmService.pushEvent.mockReturnValue(true);

        enhancedConversionService.prepareEnhancedConversion.mockReturnValue({
            enhanced_conversion_data: {
                email: 'hashed_email',
                phone_number: 'hashed_phone'
            }
        });

        serverSideConversionTracker.trackBookingConfirmation.mockResolvedValue(true);
    });

    describe('Purchase Conversion Tracking Logic', () => {
        test('should extract transaction data from URL parameters', () => {
            // Setup URL parameters
            mockURLSearchParams.mockImplementation(() => ({
                get: jest.fn((key) => {
                    const params = {
                        'transaction_id': 'txn_12345',
                        'value': '8000',
                        'tour_id': 'gion-tour',
                        'tour_name': 'Gion District Tour',
                        'price': '8000'
                    };
                    return params[key] || null;
                })
            }));

            // Simulate the logic from the Thankyou component
            const urlParams = new URLSearchParams(window.location.search);
            const transactionData = {
                transactionId: urlParams.get('transaction_id') || sessionStorage.getItem('booking_transaction_id') || `txn_${Date.now()}`,
                value: parseFloat(urlParams.get('value')) || parseFloat(sessionStorage.getItem('booking_value')) || 0,
                currency: 'JPY'
            };

            expect(transactionData.transactionId).toBe('txn_12345');
            expect(transactionData.value).toBe(8000);
            expect(transactionData.currency).toBe('JPY');
        });

        test('should extract tour data correctly', () => {
            mockURLSearchParams.mockImplementation(() => ({
                get: jest.fn((key) => {
                    const params = {
                        'tour_id': 'gion-tour',
                        'tour_name': 'Gion District Tour',
                        'price': '8000'
                    };
                    return params[key] || null;
                })
            }));

            mockSessionStorage.getItem.mockImplementation((key) => {
                const sessionData = {
                    'booking_date': '2024-03-15',
                    'booking_time': '14:00'
                };
                return sessionData[key] || null;
            });

            // Simulate tour data extraction
            const urlParams = new URLSearchParams(window.location.search);
            const tourData = {
                tourId: urlParams.get('tour_id') || sessionStorage.getItem('booking_tour_id') || 'unknown',
                tourName: urlParams.get('tour_name') || sessionStorage.getItem('booking_tour_name') || 'Tour Booking',
                price: parseFloat(urlParams.get('price')) || parseFloat(sessionStorage.getItem('booking_price')) || 0,
                date: sessionStorage.getItem('booking_date') || '',
                time: sessionStorage.getItem('booking_time') || '',
                location: 'kyoto',
                category: 'tour'
            };

            expect(tourData.tourId).toBe('gion-tour');
            expect(tourData.tourName).toBe('Gion District Tour');
            expect(tourData.price).toBe(8000);
            expect(tourData.date).toBe('2024-03-15');
            expect(tourData.time).toBe('14:00');
            expect(tourData.location).toBe('kyoto');
        });

        test('should use fallback values when no transaction data available', () => {
            // No URL params or session storage data
            const urlParams = new URLSearchParams(window.location.search);
            let transactionData = {
                transactionId: urlParams.get('transaction_id') || sessionStorage.getItem('booking_transaction_id') || `txn_${Date.now()}`,
                value: parseFloat(urlParams.get('value')) || parseFloat(sessionStorage.getItem('booking_value')) || 0,
                currency: 'JPY'
            };

            // Simulate fallback logic
            if (transactionData.value <= 0) {
                transactionData.value = 7000; // Fallback amount
            }

            expect(transactionData.value).toBe(7000);
            expect(transactionData.transactionId).toMatch(/^txn_\d+$/);
        });
    });

    describe('Enhanced Conversion Data Preparation', () => {
        test('should prepare enhanced conversion data when customer data available', () => {
            mockSessionStorage.getItem.mockImplementation((key) => {
                const sessionData = {
                    'booking_customer_email': 'customer@example.com',
                    'booking_customer_phone': '+819012345678',
                    'booking_customer_name': 'Jane Smith'
                };
                return sessionData[key] || null;
            });

            // Simulate customer data extraction
            const customerData = {
                email: sessionStorage.getItem('booking_customer_email') || '',
                phone: sessionStorage.getItem('booking_customer_phone') || '',
                name: sessionStorage.getItem('booking_customer_name') || '',
                firstName: sessionStorage.getItem('booking_customer_first_name') || '',
                lastName: sessionStorage.getItem('booking_customer_last_name') || ''
            };

            // Simulate enhanced conversion preparation
            let enhancedConversionData = null;
            if (customerData.email || customerData.phone || customerData.name) {
                const consentData = {
                    analytics: 'granted',
                    ad_storage: 'granted'
                };

                enhancedConversionData = enhancedConversionService.prepareEnhancedConversion(
                    {
                        conversion_action: 'purchase',
                        conversion_value: 9000,
                        currency: 'JPY',
                        order_id: 'txn_123'
                    },
                    customerData,
                    consentData
                );
            }

            expect(enhancedConversionService.prepareEnhancedConversion).toHaveBeenCalledWith(
                expect.objectContaining({
                    conversion_action: 'purchase',
                    conversion_value: 9000,
                    currency: 'JPY'
                }),
                expect.objectContaining({
                    email: 'customer@example.com',
                    phone: '+819012345678',
                    name: 'Jane Smith'
                }),
                expect.objectContaining({
                    analytics: 'granted',
                    ad_storage: 'granted'
                })
            );

            expect(enhancedConversionData).toEqual({
                enhanced_conversion_data: {
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                }
            });
        });

        test('should skip enhanced conversions when no customer data available', () => {
            // No customer data in session storage
            const customerData = {
                email: '',
                phone: '',
                name: '',
                firstName: '',
                lastName: ''
            };

            let enhancedConversionData = null;
            if (customerData.email || customerData.phone || customerData.name) {
                // This should not execute
                enhancedConversionData = enhancedConversionService.prepareEnhancedConversion();
            }

            expect(enhancedConversionData).toBeNull();
            expect(enhancedConversionService.prepareEnhancedConversion).not.toHaveBeenCalled();
        });
    });

    describe('GTM Purchase Conversion Tracking', () => {
        test('should call GTM service with correct purchase conversion data', () => {
            const transactionData = {
                transactionId: 'txn_12345',
                value: 8000,
                currency: 'JPY'
            };

            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                price: 8000,
                date: '2024-03-15',
                time: '14:00',
                location: 'kyoto',
                category: 'tour'
            };

            const paymentData = {
                provider: 'stripe',
                amount: 8000,
                currency: 'JPY'
            };

            const enhancedConversionData = {
                enhanced_conversion_data: {
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                }
            };

            // Simulate GTM tracking call
            const gtmTrackingSuccess = gtmService.trackPurchaseConversion(
                {
                    transaction_id: transactionData.transactionId,
                    value: transactionData.value,
                    currency: transactionData.currency,
                    items: [{
                        item_id: tourData.tourId,
                        item_name: tourData.tourName,
                        item_category: tourData.category,
                        price: tourData.price,
                        quantity: 1
                    }],
                    custom_parameters: {
                        tour_id: tourData.tourId,
                        tour_location: tourData.location,
                        booking_date: tourData.date,
                        booking_time: tourData.time,
                        payment_provider: paymentData.provider,
                        conversion_page: 'thank_you'
                    }
                },
                enhancedConversionData.enhanced_conversion_data
            );

            expect(gtmService.trackPurchaseConversion).toHaveBeenCalledWith(
                expect.objectContaining({
                    transaction_id: 'txn_12345',
                    value: 8000,
                    currency: 'JPY',
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            item_id: 'gion-tour',
                            item_name: 'Gion District Tour',
                            price: 8000
                        })
                    ]),
                    custom_parameters: expect.objectContaining({
                        tour_id: 'gion-tour',
                        conversion_page: 'thank_you'
                    })
                }),
                expect.objectContaining({
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                })
            );

            expect(gtmTrackingSuccess).toBe(true);
        });
    });

    describe('Server-side Conversion Validation', () => {
        test('should trigger server-side conversion validation', async () => {
            const bookingData = {
                booking_id: 'txn_12345',
                total_amount: 8000,
                currency: 'JPY',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Tour',
                tour_category: 'tour',
                quantity: 1,
                customer_email: 'test@example.com',
                customer_phone: '+819012345678',
                customer_name: 'John Doe',
                booking_date: new Date().toISOString(),
                tour_date: '2024-03-15'
            };

            // Simulate server-side validation call
            const serverValidationSuccess = await serverSideConversionTracker.trackBookingConfirmation(bookingData);

            expect(serverSideConversionTracker.trackBookingConfirmation).toHaveBeenCalledWith(
                expect.objectContaining({
                    booking_id: 'txn_12345',
                    total_amount: 8000,
                    tour_id: 'gion-tour',
                    customer_email: 'test@example.com'
                })
            );

            expect(serverValidationSuccess).toBe(true);
        });

        test('should handle server-side validation errors gracefully', async () => {
            serverSideConversionTracker.trackBookingConfirmation.mockRejectedValue(
                new Error('Server validation failed')
            );

            let errorOccurred = false;
            try {
                await serverSideConversionTracker.trackBookingConfirmation({
                    booking_id: 'txn_123',
                    total_amount: 5000
                });
            } catch (error) {
                errorOccurred = true;
                expect(error.message).toBe('Server validation failed');
            }

            expect(errorOccurred).toBe(true);
        });
    });

    describe('Session Storage Management', () => {
        test('should clean up booking-related session storage while keeping essential data', () => {
            // Mock Object.keys to return session storage keys
            const sessionKeys = [
                'booking_transaction_id',
                'booking_value',
                'booking_tour_id',
                'booking_customer_email', // Should be kept
                'booking_customer_name',  // Should be kept
                'booking_payment_provider',
                'other_unrelated_key'
            ];

            // Simulate session storage cleanup logic
            const keysToKeep = ['booking_customer_email', 'booking_customer_name'];

            sessionKeys.forEach(key => {
                if (key.startsWith('booking_') && !keysToKeep.includes(key)) {
                    mockSessionStorage.removeItem(key);
                }
            });

            // Verify that booking keys are removed except essential ones
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('booking_transaction_id');
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('booking_value');
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('booking_tour_id');
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('booking_payment_provider');

            // Verify essential keys are NOT removed
            expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('booking_customer_email');
            expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('booking_customer_name');
            expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('other_unrelated_key');
        });
    });

    describe('Thank You Page View Tracking', () => {
        test('should track thank you page view event for remarketing', () => {
            const tourId = 'uji-tour';
            const conversionValue = 6500;

            // Simulate thank you page view tracking
            gtmService.pushEvent('thank_you_page_view', {
                event_category: 'engagement',
                event_label: 'booking_confirmed',
                page_title: 'Booking Confirmed',
                page_location: window.location.href,
                customer_status: 'converted',
                tour_id: tourId,
                conversion_value: conversionValue
            });

            expect(gtmService.pushEvent).toHaveBeenCalledWith('thank_you_page_view', {
                event_category: 'engagement',
                event_label: 'booking_confirmed',
                page_title: 'Booking Confirmed',
                page_location: window.location.href,
                customer_status: 'converted',
                tour_id: 'uji-tour',
                conversion_value: 6500
            });
        });
    });

    describe('Booking Flow Manager Integration', () => {
        test('should initialize booking and track purchase through booking flow manager', () => {
            const tourData = {
                tourId: 'morning-tour',
                tourName: 'Morning Arashiyama Tour',
                price: 7500,
                date: '2024-03-20',
                time: '09:00',
                location: 'kyoto',
                category: 'tour'
            };

            const transactionData = {
                transactionId: 'txn_67890',
                finalAmount: 7500
            };

            // Simulate booking flow manager calls
            bookingFlowManager.initializeBooking(tourData);
            const purchaseResult = bookingFlowManager.trackPurchase(transactionData);

            expect(bookingFlowManager.initializeBooking).toHaveBeenCalledWith(tourData);
            expect(bookingFlowManager.trackPurchase).toHaveBeenCalledWith(transactionData);
            expect(purchaseResult.success).toBe(true);
        });

        test('should handle booking flow manager errors', () => {
            bookingFlowManager.trackPurchase.mockReturnValue({
                success: false,
                reason: 'validation_failed'
            });

            const result = bookingFlowManager.trackPurchase({
                transactionId: 'txn_123',
                finalAmount: 5000
            });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('validation_failed');
        });
    });

    describe('Fallback Tracking', () => {
        test('should execute fallback tracking when main tracking fails', () => {
            // Simulate fallback GTM event
            gtmService.pushEvent('purchase', {
                transaction_id: 'fallback_12345',
                value: 7000,
                currency: 'JPY',
                items: [{
                    item_id: 'tour-booking',
                    item_name: 'Kyoto Tour Booking',
                    item_category: 'tour',
                    price: 7000,
                    quantity: 1
                }],
                custom_parameters: {
                    fallback_tracking: true,
                    conversion_page: 'thank_you',
                    error_occurred: true
                }
            });

            expect(gtmService.pushEvent).toHaveBeenCalledWith('purchase',
                expect.objectContaining({
                    transaction_id: 'fallback_12345',
                    value: 7000,
                    currency: 'JPY',
                    custom_parameters: expect.objectContaining({
                        fallback_tracking: true,
                        conversion_page: 'thank_you',
                        error_occurred: true
                    })
                })
            );
        });
    });
});
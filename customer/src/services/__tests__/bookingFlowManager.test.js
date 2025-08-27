/**
 * Unit tests for BookingFlowManager
 */

import bookingFlowManager from '../bookingFlowManager';

describe('BookingFlowManager', () => {
    beforeEach(() => {
        // Reset booking state before each test
        bookingFlowManager.resetBookingState();
    });

    describe('initializeBooking', () => {
        it('should initialize booking with valid tour data', () => {
            const tourData = {
                tourId: 'tour-123',
                tourName: 'Kyoto Morning Tour',
                price: 5000,
                date: '2024-03-15',
                time: '09:00',
                location: 'Kyoto',
                category: 'cultural'
            };

            const bookingId = bookingFlowManager.initializeBooking(tourData);

            expect(bookingId).toBeDefined();
            expect(bookingId).toMatch(/^booking_\d+_[a-z0-9]+$/);

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.bookingId).toBe(bookingId);
            expect(state.currentStep).toBe('view_item');
            expect(state.tourData).toEqual(tourData);
            expect(state.customerData).toBeNull();
            expect(state.paymentData).toBeNull();
            expect(state.conversionTracking.viewItemTracked).toBe(false);
        });

        it('should throw error when tour data is missing', () => {
            expect(() => {
                bookingFlowManager.initializeBooking();
            }).toThrow('Tour data with tourId is required to initialize booking');
        });

        it('should throw error when tourId is missing', () => {
            expect(() => {
                bookingFlowManager.initializeBooking({ tourName: 'Test Tour' });
            }).toThrow('Tour data with tourId is required to initialize booking');
        });

        it('should handle minimal tour data', () => {
            const tourData = { tourId: 'tour-123' };
            const bookingId = bookingFlowManager.initializeBooking(tourData);

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.tourData.tourId).toBe('tour-123');
            expect(state.tourData.tourName).toBe('');
            expect(state.tourData.price).toBe(0);
        });
    });

    describe('trackViewItem', () => {
        beforeEach(() => {
            bookingFlowManager.initializeBooking({
                tourId: 'tour-123',
                tourName: 'Test Tour',
                price: 5000
            });
        });

        it('should track view item successfully', () => {
            const result = bookingFlowManager.trackViewItem();

            expect(result.success).toBe(true);
            expect(result.data.event).toBe('view_item');
            expect(result.data.booking_id).toBeDefined();
            expect(result.data.items[0].item_id).toBe('tour-123');

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.conversionTracking.viewItemTracked).toBe(true);
        });

        it('should merge additional item data', () => {
            const additionalData = { location: 'Kyoto', category: 'cultural' };
            const result = bookingFlowManager.trackViewItem(additionalData);

            expect(result.success).toBe(true);
            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.tourData.location).toBe('Kyoto');
            expect(state.tourData.category).toBe('cultural');
        });

        it('should prevent duplicate tracking', () => {
            bookingFlowManager.trackViewItem();
            const result = bookingFlowManager.trackViewItem();

            expect(result.success).toBe(false);
            expect(result.reason).toBe('already_tracked');
        });

        it('should throw error when booking not initialized', () => {
            bookingFlowManager.resetBookingState();

            expect(() => {
                bookingFlowManager.trackViewItem();
            }).toThrow('Booking must be initialized before tracking view item');
        });
    });

    describe('trackBeginCheckout', () => {
        beforeEach(() => {
            bookingFlowManager.initializeBooking({
                tourId: 'tour-123',
                tourName: 'Test Tour',
                price: 5000
            });
        });

        it('should track begin checkout successfully', () => {
            const checkoutData = {
                customerData: {
                    email: 'test@example.com',
                    phone: '+81-90-1234-5678',
                    name: 'John Doe',
                    firstName: 'John',
                    lastName: 'Doe'
                }
            };

            const result = bookingFlowManager.trackBeginCheckout(checkoutData);

            expect(result.success).toBe(true);
            expect(result.data.event).toBe('begin_checkout');
            expect(result.data.user_data.email).toBe('test@example.com');

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.currentStep).toBe('begin_checkout');
            expect(state.customerData.email).toBe('test@example.com');
            expect(state.conversionTracking.beginCheckoutTracked).toBe(true);
        });

        it('should throw error when customer data is missing', () => {
            expect(() => {
                bookingFlowManager.trackBeginCheckout({});
            }).toThrow('Begin checkout validation failed: Customer data with email is required');
        });

        it('should prevent duplicate tracking', () => {
            const checkoutData = {
                customerData: { email: 'test@example.com' }
            };

            bookingFlowManager.trackBeginCheckout(checkoutData);
            const result = bookingFlowManager.trackBeginCheckout(checkoutData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('already_tracked');
        });
    });

    describe('trackAddPaymentInfo', () => {
        beforeEach(() => {
            bookingFlowManager.initializeBooking({
                tourId: 'tour-123',
                tourName: 'Test Tour',
                price: 5000
            });
            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'test@example.com' }
            });
        });

        it('should track add payment info successfully', () => {
            const paymentData = {
                provider: 'stripe',
                amount: 5000,
                currency: 'JPY',
                paymentMethod: 'card'
            };

            const result = bookingFlowManager.trackAddPaymentInfo(paymentData);

            expect(result.success).toBe(true);
            expect(result.data.event).toBe('add_payment_info');
            expect(result.data.custom_parameters.payment_provider).toBe('stripe');

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.currentStep).toBe('add_payment_info');
            expect(state.paymentData.provider).toBe('stripe');
            expect(state.conversionTracking.addPaymentInfoTracked).toBe(true);
        });

        it('should use tour price as default amount', () => {
            const paymentData = { provider: 'stripe' };
            const result = bookingFlowManager.trackAddPaymentInfo(paymentData);

            expect(result.success).toBe(true);
            expect(result.data.value).toBe(5000);
        });

        it('should prevent duplicate tracking', () => {
            const paymentData = { provider: 'stripe' };

            bookingFlowManager.trackAddPaymentInfo(paymentData);
            const result = bookingFlowManager.trackAddPaymentInfo(paymentData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('already_tracked');
        });
    });

    describe('trackPurchase', () => {
        beforeEach(() => {
            bookingFlowManager.initializeBooking({
                tourId: 'tour-123',
                tourName: 'Test Tour',
                price: 5000
            });
            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'test@example.com' }
            });
            bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 5000
            });
        });

        it('should track purchase successfully', () => {
            const transactionData = {
                transactionId: 'txn-123',
                finalAmount: 4500
            };

            const result = bookingFlowManager.trackPurchase(transactionData);

            expect(result.success).toBe(true);
            expect(result.data.event).toBe('purchase');
            expect(result.data.transaction_id).toBe('txn-123');
            expect(result.data.value).toBe(4500);

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.currentStep).toBe('purchase');
            expect(state.transactionId).toBe('txn-123');
            expect(state.conversionTracking.purchaseTracked).toBe(true);
        });

        it('should generate transaction ID if not provided', () => {
            const result = bookingFlowManager.trackPurchase({});

            expect(result.success).toBe(true);
            expect(result.data.transaction_id).toMatch(/^txn_\d+_[a-z0-9]+$/);
        });

        it('should prevent duplicate tracking', () => {
            bookingFlowManager.trackPurchase({ transactionId: 'txn-123' });
            const result = bookingFlowManager.trackPurchase({ transactionId: 'txn-456' });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('already_tracked');
        });
    });

    describe('validateConversion', () => {
        it('should return invalid when no booking state', () => {
            const result = bookingFlowManager.validateConversion('conv-123');

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('No active booking state');
        });

        it('should validate current step', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'tour-123',
                tourName: 'Test Tour',
                price: 5000
            });

            const result = bookingFlowManager.validateConversion('conv-123');

            expect(result.isValid).toBe(true);
            expect(result.step).toBe('view_item');
            expect(result.conversionId).toBe('conv-123');
        });
    });

    describe('state management', () => {
        it('should return null when no booking state', () => {
            expect(bookingFlowManager.getCurrentBookingState()).toBeNull();
            expect(bookingFlowManager.getCurrentStep()).toBeNull();
        });

        it('should check conversion tracking status', () => {
            bookingFlowManager.initializeBooking({ tourId: 'tour-123' });

            expect(bookingFlowManager.isConversionTracked('view_item')).toBe(false);

            bookingFlowManager.trackViewItem();
            expect(bookingFlowManager.isConversionTracked('view_item')).toBe(true);
        });

        it('should reset booking state', () => {
            bookingFlowManager.initializeBooking({ tourId: 'tour-123' });
            expect(bookingFlowManager.getCurrentBookingState()).not.toBeNull();

            bookingFlowManager.resetBookingState();
            expect(bookingFlowManager.getCurrentBookingState()).toBeNull();
        });
    });

    describe('event listeners', () => {
        it('should add and notify listeners', () => {
            const listener = jest.fn();
            bookingFlowManager.addListener(listener);

            bookingFlowManager.initializeBooking({ tourId: 'tour-123' });

            expect(listener).toHaveBeenCalledWith('booking_initialized', expect.any(Object));
        });

        it('should remove listeners', () => {
            const listener = jest.fn();
            bookingFlowManager.addListener(listener);
            bookingFlowManager.removeListener(listener);

            bookingFlowManager.initializeBooking({ tourId: 'tour-123' });

            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const goodListener = jest.fn();

            bookingFlowManager.addListener(errorListener);
            bookingFlowManager.addListener(goodListener);

            // Should not throw error
            expect(() => {
                bookingFlowManager.initializeBooking({ tourId: 'tour-123' });
            }).not.toThrow();

            expect(goodListener).toHaveBeenCalled();
        });
    });

    describe('data validation', () => {
        it('should validate step requirements correctly', () => {
            bookingFlowManager.initializeBooking({ tourId: 'tour-123' });

            // Test view_item validation (should pass)
            const viewItemResult = bookingFlowManager.validateConversion('test');
            expect(viewItemResult.isValid).toBe(true);

            // Test validation by attempting begin_checkout without customer data
            expect(() => {
                bookingFlowManager.trackBeginCheckout({});
            }).toThrow('Customer data with email is required');

            // Test validation by attempting add_payment_info without payment data
            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'test@example.com' }
            });

            expect(() => {
                bookingFlowManager.trackAddPaymentInfo({});
            }).toThrow('Payment data with provider is required');
        });

        it('should build correct tracking data structure', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'tour-123',
                tourName: 'Test Tour',
                price: 5000,
                location: 'Kyoto'
            });

            const result = bookingFlowManager.trackViewItem();
            const trackingData = result.data;

            expect(trackingData).toHaveProperty('event', 'view_item');
            expect(trackingData).toHaveProperty('event_category', 'ecommerce');
            expect(trackingData).toHaveProperty('booking_id');
            expect(trackingData).toHaveProperty('currency', 'JPY');
            expect(trackingData).toHaveProperty('items');
            expect(trackingData.items[0]).toHaveProperty('item_id', 'tour-123');
            expect(trackingData).toHaveProperty('custom_parameters');
            expect(trackingData.custom_parameters).toHaveProperty('tour_location', 'Kyoto');
        });
    });

    describe('error handling', () => {
        it('should handle missing booking state gracefully', () => {
            expect(() => {
                bookingFlowManager.trackViewItem();
            }).toThrow('Booking must be initialized before tracking view item');

            expect(() => {
                bookingFlowManager.trackBeginCheckout({});
            }).toThrow('Booking must be initialized before tracking begin checkout');

            expect(() => {
                bookingFlowManager.trackAddPaymentInfo({});
            }).toThrow('Booking must be initialized before tracking add payment info');

            expect(() => {
                bookingFlowManager.trackPurchase({});
            }).toThrow('Booking must be initialized before tracking purchase');
        });

        it('should validate required data at each step', () => {
            bookingFlowManager.initializeBooking({ tourId: 'tour-123' });

            // Should fail without customer data
            expect(() => {
                bookingFlowManager.trackBeginCheckout({});
            }).toThrow('Customer data with email is required');

            // Should fail without payment data
            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'test@example.com' }
            });

            expect(() => {
                bookingFlowManager.trackAddPaymentInfo({});
            }).toThrow('Payment data with provider is required');
        });
    });
});
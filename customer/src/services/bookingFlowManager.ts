/**
 * Booking Flow Manager
 * 
 * Centralized booking state management for simplified conversion tracking.
 * Manages clear booking progression steps and conversion point tracking.
 * Integrates with conversion value optimizer for dynamic pricing.
 */

import conversionValueOptimizer from './conversionValueOptimizer';

// Type definitions
export interface TourData {
    tourId: string;
    tourName: string;
    price: number;
    date: string;
    time: string;
    location: string;
    category: string;
}

export interface CustomerData {
    email: string;
    phone: string;
    name: string;
    firstName: string;
    lastName: string;
}

export interface PaymentData {
    provider: string;
    amount: number;
    currency: string;
    paymentMethod: string;
}

export interface ConversionTracking {
    viewItemTracked: boolean;
    beginCheckoutTracked: boolean;
    addPaymentInfoTracked: boolean;
    purchaseTracked: boolean;
    [key: string]: boolean;
}

export interface PricingOptimization {
    originalTotal: number;
    discountAmount: number;
    discountPercentage: number;
    validationPassed: boolean;
    finalPrice: number;
}

export interface BookingState {
    bookingId: string;
    currentStep: 'view_item' | 'begin_checkout' | 'add_payment_info' | 'purchase';
    tourData: TourData;
    customerData: CustomerData | null;
    paymentData: PaymentData | null;
    transactionId: string | null;
    conversionTracking: ConversionTracking;
    pricingOptimization?: PricingOptimization;
    createdAt: string;
    updatedAt: string;
}

export interface TrackingData {
    event: string;
    event_category: string;
    event_label: string;
    booking_id: string;
    currency: string;
    value?: number;
    transaction_id?: string;
    items: Array<{
        item_id: string;
        item_name: string;
        item_category: string;
        price: number;
        quantity: number;
    }>;
    custom_parameters: {
        tour_id: string;
        tour_location: string;
        booking_date: string;
        booking_time: string;
        payment_provider?: string;
        payment_method?: string;
    };
    user_data?: {
        email: string;
        phone: string;
    };
    pricing_optimization?: {
        original_value: number;
        discount_amount: number;
        discount_percentage: number;
        validation_passed: boolean;
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface TrackingResult {
    success: boolean;
    reason?: string;
    data?: TrackingData;
    pricingOptimization?: PricingOptimization;
}

export interface ConversionValidationResult {
    isValid: boolean;
    error?: string;
    conversionId?: string;
    step?: string;
    bookingId?: string;
    errors?: string[];
    timestamp?: string;
}

export interface CheckoutData {
    customerData?: Partial<CustomerData>;
}

export interface TransactionData {
    transactionId?: string;
    finalAmount?: number;
    originalAmount?: number;
    discount?: any;
    paymentProvider?: string;
    pricingRules?: any[];
}

type BookingFlowListener = (eventType: string, data: any) => void;

class BookingFlowManager {
    private bookingState: BookingState | null;
    private listeners: BookingFlowListener[];
    private validationRules: Record<string, string[]>;

    constructor() {
        this.bookingState = null;
        this.listeners = [];
        this.validationRules = {
            view_item: ['tourData'],
            begin_checkout: ['tourData', 'customerData'],
            add_payment_info: ['tourData', 'customerData', 'paymentData'],
            purchase: ['tourData', 'customerData', 'paymentData', 'transactionId']
        };
    }

    /**
     * Initialize a new booking session
     * @param tourData - Tour information
     * @returns bookingId
     */
    initializeBooking(tourData: Partial<TourData>): string {
        if (!tourData || !tourData.tourId) {
            throw new Error('Tour data with tourId is required to initialize booking');
        }

        const bookingId = this.generateBookingId();

        this.bookingState = {
            bookingId,
            currentStep: 'view_item',
            tourData: {
                tourId: tourData.tourId,
                tourName: tourData.tourName || '',
                price: tourData.price || 0,
                date: tourData.date || '',
                time: tourData.time || '',
                location: tourData.location || '',
                category: tourData.category || 'tour'
            },
            customerData: null,
            paymentData: null,
            transactionId: null,
            conversionTracking: {
                viewItemTracked: false,
                beginCheckoutTracked: false,
                addPaymentInfoTracked: false,
                purchaseTracked: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notifyListeners('booking_initialized', this.bookingState);
        return bookingId;
    }

    /**
     * Track view item conversion point
     * @param itemData - Additional item data
     * @returns tracking result
     */
    trackViewItem(itemData: Partial<TourData> = {}): TrackingResult {
        if (!this.bookingState) {
            throw new Error('Booking must be initialized before tracking view item');
        }

        if (this.bookingState.conversionTracking.viewItemTracked) {
            console.warn('View item already tracked for this booking');
            return { success: false, reason: 'already_tracked' };
        }

        // Validate required data
        const validationResult = this.validateStep('view_item');
        if (!validationResult.isValid) {
            throw new Error(`View item validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Update tracking state
        this.bookingState.conversionTracking.viewItemTracked = true;
        this.bookingState.updatedAt = new Date().toISOString();

        // Merge additional item data
        if (itemData) {
            this.bookingState.tourData = { ...this.bookingState.tourData, ...itemData };
        }

        const trackingData = this.buildTrackingData('view_item');
        this.notifyListeners('view_item_tracked', trackingData);

        return { success: true, data: trackingData };
    }

    /**
     * Track begin checkout conversion point
     * @param checkoutData - Checkout information including customer data
     * @returns tracking result
     */
    trackBeginCheckout(checkoutData: CheckoutData): TrackingResult {
        if (!this.bookingState) {
            throw new Error('Booking must be initialized before tracking begin checkout');
        }

        if (this.bookingState.conversionTracking.beginCheckoutTracked) {
            console.warn('Begin checkout already tracked for this booking');
            return { success: false, reason: 'already_tracked' };
        }

        // Update customer data
        if (checkoutData.customerData) {
            this.bookingState.customerData = {
                email: checkoutData.customerData.email || '',
                phone: checkoutData.customerData.phone || '',
                name: checkoutData.customerData.name || '',
                firstName: checkoutData.customerData.firstName || '',
                lastName: checkoutData.customerData.lastName || ''
            };
        }

        // Update current step
        this.bookingState.currentStep = 'begin_checkout';

        // Validate required data
        const validationResult = this.validateStep('begin_checkout');
        if (!validationResult.isValid) {
            throw new Error(`Begin checkout validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Update tracking state
        this.bookingState.conversionTracking.beginCheckoutTracked = true;
        this.bookingState.updatedAt = new Date().toISOString();

        const trackingData = this.buildTrackingData('begin_checkout');
        this.notifyListeners('begin_checkout_tracked', trackingData);

        return { success: true, data: trackingData };
    }

    /**
     * Track add payment info conversion point
     * @param paymentData - Payment information
     * @returns tracking result
     */
    trackAddPaymentInfo(paymentData: Partial<PaymentData>): TrackingResult {
        if (!this.bookingState) {
            throw new Error('Booking must be initialized before tracking add payment info');
        }

        if (this.bookingState.conversionTracking.addPaymentInfoTracked) {
            console.warn('Add payment info already tracked for this booking');
            return { success: false, reason: 'already_tracked' };
        }

        // Update payment data
        this.bookingState.paymentData = {
            provider: paymentData.provider || '',
            amount: paymentData.amount || this.bookingState.tourData.price,
            currency: paymentData.currency || 'JPY',
            paymentMethod: paymentData.paymentMethod || ''
        };

        // Update current step
        this.bookingState.currentStep = 'add_payment_info';

        // Validate required data
        const validationResult = this.validateStep('add_payment_info');
        if (!validationResult.isValid) {
            throw new Error(`Add payment info validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Update tracking state
        this.bookingState.conversionTracking.addPaymentInfoTracked = true;
        this.bookingState.updatedAt = new Date().toISOString();

        const trackingData = this.buildTrackingData('add_payment_info');
        this.notifyListeners('add_payment_info_tracked', trackingData);

        return { success: true, data: trackingData };
    }

    /**
     * Track purchase conversion point with dynamic pricing optimization
     * @param transactionData - Transaction information
     * @returns tracking result
     */
    trackPurchase(transactionData: TransactionData): TrackingResult {
        if (!this.bookingState) {
            throw new Error('Booking must be initialized before tracking purchase');
        }

        if (this.bookingState.conversionTracking.purchaseTracked) {
            console.warn('Purchase already tracked for this booking');
            return { success: false, reason: 'already_tracked' };
        }

        // Update transaction data
        this.bookingState.transactionId = transactionData.transactionId || this.generateTransactionId();

        // Handle dynamic pricing with discounts
        let finalAmount = transactionData.finalAmount || this.bookingState.paymentData?.amount || this.bookingState.tourData.price;
        let pricingOptimization = null;

        if (transactionData.discount || transactionData.originalAmount) {
            const priceData = {
                basePrice: this.bookingState.tourData.price,
                quantity: 1,
                currency: this.bookingState.paymentData?.currency || 'JPY'
            };

            const discountData = transactionData.discount;

            const optimizationResult = conversionValueOptimizer.calculateDynamicPrice(
                priceData,
                discountData,
                {
                    pricingRules: transactionData.pricingRules || []
                }
            ) as any;

            if (optimizationResult.success) {
                finalAmount = optimizationResult.pricing.finalPrice;
                pricingOptimization = optimizationResult.pricing;

                // Store pricing optimization data in booking state
                this.bookingState.pricingOptimization = pricingOptimization;

                console.log('Booking Flow: Applied dynamic pricing optimization:', {
                    original: priceData.basePrice,
                    final: finalAmount,
                    discount: pricingOptimization.discountAmount
                });
            } else {
                console.warn('Booking Flow: Pricing optimization failed:', optimizationResult.error);
            }
        }

        // Update payment data with final amount
        if (this.bookingState.paymentData) {
            this.bookingState.paymentData.amount = finalAmount;
        } else {
            this.bookingState.paymentData = {
                amount: finalAmount,
                currency: 'JPY',
                provider: transactionData.paymentProvider || 'unknown',
                paymentMethod: 'card'
            };
        }

        // Update current step
        this.bookingState.currentStep = 'purchase';

        // Validate required data
        const validationResult = this.validateStep('purchase');
        if (!validationResult.isValid) {
            throw new Error(`Purchase validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Update tracking state
        this.bookingState.conversionTracking.purchaseTracked = true;
        this.bookingState.updatedAt = new Date().toISOString();

        const trackingData = this.buildTrackingData('purchase');

        // Add pricing optimization data to tracking
        if (pricingOptimization) {
            trackingData.pricing_optimization = {
                original_value: pricingOptimization.originalTotal,
                discount_amount: pricingOptimization.discountAmount,
                discount_percentage: pricingOptimization.discountPercentage,
                validation_passed: pricingOptimization.validationPassed
            };
        }

        this.notifyListeners('purchase_tracked', trackingData);

        return { success: true, data: trackingData, pricingOptimization };
    }

    /**
     * Validate conversion for a specific conversion ID
     * @param conversionId - Conversion identifier
     * @returns validation result
     */
    validateConversion(conversionId: string): ConversionValidationResult {
        if (!this.bookingState) {
            return { isValid: false, error: 'No active booking state' };
        }

        const step = this.getCurrentStep();
        if (!step) {
            return { isValid: false, error: 'No current step available' };
        }
        const validationResult = this.validateStep(step);

        return {
            isValid: validationResult.isValid,
            conversionId,
            step,
            bookingId: this.bookingState.bookingId,
            errors: validationResult.errors,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get current booking state
     * @returns current booking state
     */
    getCurrentBookingState(): BookingState | null {
        return this.bookingState ? { ...this.bookingState } : null;
    }

    /**
     * Get current step
     * @returns current step
     */
    getCurrentStep(): string | null {
        return this.bookingState ? this.bookingState.currentStep : null;
    }

    /**
     * Check if a specific conversion point has been tracked
     * @param conversionPoint - Conversion point to check
     * @returns whether conversion point has been tracked
     */
    isConversionTracked(conversionPoint: string): boolean {
        if (!this.bookingState) return false;

        // Map conversion points to tracking keys
        const trackingKeyMap: { [key: string]: string } = {
            'view_item': 'viewItemTracked',
            'begin_checkout': 'beginCheckoutTracked',
            'add_payment_info': 'addPaymentInfoTracked',
            'purchase': 'purchaseTracked'
        };

        const trackingKey = trackingKeyMap[conversionPoint];
        return trackingKey ? this.bookingState.conversionTracking[trackingKey] || false : false;
    }

    /**
     * Reset booking state (for new booking)
     */
    resetBookingState(): void {
        const oldBookingId = this.bookingState ? this.bookingState.bookingId : null;
        this.bookingState = null;
        this.notifyListeners('booking_reset', { oldBookingId });
    }

    /**
     * Add event listener for booking state changes
     * @param listener - Event listener function
     */
    addListener(listener: BookingFlowListener): void {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
        }
    }

    /**
     * Remove event listener
     * @param listener - Event listener function to remove
     */
    removeListener(listener: BookingFlowListener): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    // Private methods

    /**
     * Generate unique booking ID
     * @returns booking ID
     */
    private generateBookingId(): string {
        return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique transaction ID
     * @returns transaction ID
     */
    private generateTransactionId(): string {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate booking state for a specific step
     * @param step - Step to validate
     * @returns validation result
     */
    private validateStep(step: string): ValidationResult {
        if (!this.bookingState) {
            return { isValid: false, errors: ['No booking state available'] };
        }

        const requiredFields = this.validationRules[step] || [];
        const errors = [];

        for (const field of requiredFields) {
            if (field === 'tourData' && (!this.bookingState.tourData || !this.bookingState.tourData.tourId)) {
                errors.push('Tour data with tourId is required');
            } else if (field === 'customerData' && (!this.bookingState.customerData || !this.bookingState.customerData.email)) {
                errors.push('Customer data with email is required');
            } else if (field === 'paymentData' && (!this.bookingState.paymentData || !this.bookingState.paymentData.provider)) {
                errors.push('Payment data with provider is required');
            } else if (field === 'transactionId' && !this.bookingState.transactionId) {
                errors.push('Transaction ID is required');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Build tracking data for GTM dataLayer
     * @param eventType - Type of event
     * @returns tracking data
     */
    private buildTrackingData(eventType: string): TrackingData {
        if (!this.bookingState || !this.bookingState.tourData) {
            throw new Error('Booking state or tour data not available for tracking');
        }

        const baseData: any = {
            event: eventType,
            event_category: 'ecommerce',
            event_label: this.bookingState.tourData.tourName,
            booking_id: this.bookingState.bookingId,
            currency: this.bookingState.paymentData?.currency || 'JPY',
            items: [{
                item_id: this.bookingState.tourData.tourId,
                item_name: this.bookingState.tourData.tourName,
                item_category: this.bookingState.tourData.category,
                price: this.bookingState.tourData.price,
                quantity: 1
            }],
            custom_parameters: {
                tour_id: this.bookingState.tourData.tourId,
                tour_location: this.bookingState.tourData.location,
                booking_date: this.bookingState.tourData.date,
                booking_time: this.bookingState.tourData.time
            }
        };

        // Add event-specific data
        switch (eventType) {
            case 'view_item':
                baseData.value = this.bookingState.tourData.price;
                break;

            case 'begin_checkout':
                baseData.value = this.bookingState.tourData.price;
                if (this.bookingState.customerData) {
                    baseData.user_data = {
                        email: this.bookingState.customerData.email,
                        phone: this.bookingState.customerData.phone
                    };
                }
                break;

            case 'add_payment_info':
                if (this.bookingState.paymentData) {
                    baseData.value = this.bookingState.paymentData.amount;
                    baseData.custom_parameters.payment_provider = this.bookingState.paymentData.provider;
                    baseData.custom_parameters.payment_method = this.bookingState.paymentData.paymentMethod;
                }
                break;

            case 'purchase':
                if (this.bookingState.paymentData) {
                    baseData.value = this.bookingState.paymentData.amount;
                    baseData.custom_parameters.payment_provider = this.bookingState.paymentData.provider;
                }
                baseData.transaction_id = this.bookingState.transactionId;
                if (this.bookingState.customerData) {
                    baseData.user_data = {
                        email: this.bookingState.customerData.email,
                        phone: this.bookingState.customerData.phone
                    };
                }
                break;

            default:
                // No additional data for unknown event types
                break;
        }

        return baseData;
    }

    /**
     * Notify all listeners of state changes
     * @param eventType - Type of event
     * @param data - Event data
     */
    private notifyListeners(eventType: string, data: any): void {
        this.listeners.forEach(listener => {
            try {
                listener(eventType, data);
            } catch (error) {
                console.error('Error in booking flow listener:', error);
            }
        });
    }
}

// Create singleton instance
const bookingFlowManager = new BookingFlowManager();

export default bookingFlowManager;
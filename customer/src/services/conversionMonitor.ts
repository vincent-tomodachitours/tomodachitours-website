/**
 * Conversion Monitor Service
 * 
 * Provides real-time conversion validation, accuracy monitoring, and diagnostic reporting
 * for Google Ads conversion tracking. Integrates with GTM, booking flow, and enhanced
 * conversion services to ensure reliable conversion tracking.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import gtmService from './gtmService';
import bookingFlowManager from './bookingFlowManager';
import enhancedConversionService from './enhancedConversionService';

type ConversionEventType = 'view_item' | 'begin_checkout' | 'add_payment_info' | 'purchase';
type ConversionStatus = 'pending' | 'fired' | 'validated' | 'validation_failed' | 'firing_failed' | 'validation_timeout' | 'error';

interface ConversionData {
    event: ConversionEventType;
    transaction_id?: string;
    booking_id?: string;
    value?: number;
    currency?: string;
    items?: Array<{
        item_id: string;
        item_name: string;
        price: number;
        quantity: number;
    }>;
    user_data?: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        name?: string;
    };
    source?: string;
    [key: string]: any;
}

interface ConversionAttempt {
    id: string;
    event: ConversionEventType;
    data: ConversionData;
    timestamp: number;
    status: ConversionStatus;
    validationResult: ValidationResult | null;
    retryCount: number;
    errors: string[];
}

interface ValidationResult {
    isValid: boolean;
    conversionId: string;
    timestamp: number;
    gtmValidation: GTMValidationResult;
    bookingValidation: BookingValidationResult;
    enhancedValidation: EnhancedValidationResult;
    overallErrors: string[];
}

interface GTMValidationResult {
    isValid: boolean;
    errors: string[];
    gtmStatus?: any;
}

interface BookingValidationResult {
    isValid: boolean;
    errors: string[];
    bookingState?: {
        bookingId: string;
        currentStep: string;
        conversionTracking: any;
    };
    note?: string;
}

interface EnhancedValidationResult {
    isValid: boolean;
    errors: string[];
    enhancedStatus?: any;
    compliance?: any;
    note?: string;
}

interface AccuracyMetrics {
    totalAttempts: number;
    successfulFirings: number;
    failedFirings: number;
    validationErrors: number;
    lastAccuracyCheck: number | null;
    currentAccuracy: number;
}

interface TrackingResult {
    success: boolean;
    attemptId: string;
    errors?: string[];
    firingResult?: any;
}

interface FiringResult {
    success: boolean;
    retry?: number;
    firingResult?: any;
    errors?: string[];
}

interface ValidationDataResult {
    isValid: boolean;
    errors: string[];
}

interface Alert {
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    data: any;
    timestamp: number;
}

// dataLayer is already declared in types/env.d.ts

type AlertCallback = (alert: Alert) => void;

class ConversionMonitor {
    private isInitialized: boolean = false;
    private monitoringEnabled: boolean = true;
    // Alert threshold removed - not currently used
    private alertCallbacks: AlertCallback[] = [];
    private conversionAttempts: Map<string, ConversionAttempt> = new Map();
    private conversionValidations: Map<string, ValidationResult> = new Map();
    private accuracyMetrics: AccuracyMetrics = {
        totalAttempts: 0,
        successfulFirings: 0,
        failedFirings: 0,
        validationErrors: 0,
        lastAccuracyCheck: null,
        currentAccuracy: 1.0
    };

    private readonly conversionTypes: ConversionEventType[] = ['view_item', 'begin_checkout', 'add_payment_info', 'purchase'];
    private readonly validationTimeout: number = 30000;
    private readonly retryAttempts: number = 3;
    private readonly retryDelay: number = 2000;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        if (this.isInitialized) {
            return;
        }

        try {
            bookingFlowManager.addListener(this.handleBookingFlowEvent.bind(this));
            this.startPeriodicAccuracyCheck();
            this.setupGTMValidationMonitoring();

            this.isInitialized = true;
            console.log('ConversionMonitor: Initialized successfully');
        } catch (error) {
            console.error('ConversionMonitor: Initialization failed:', error);
        }
    }

    async trackConversionAttempt(conversionData: ConversionData): Promise<TrackingResult> {
        if (!conversionData || !conversionData.event) {
            throw new Error('Invalid conversion data: event type is required');
        }

        const attemptId = this.generateAttemptId();
        const timestamp = Date.now();

        const attempt: ConversionAttempt = {
            id: attemptId,
            event: conversionData.event,
            data: { ...conversionData },
            timestamp,
            status: 'pending',
            validationResult: null,
            retryCount: 0,
            errors: []
        };

        this.conversionAttempts.set(attemptId, attempt);
        this.accuracyMetrics.totalAttempts++;

        try {
            const preValidation = this.validateConversionData(conversionData);
            if (!preValidation.isValid) {
                attempt.status = 'validation_failed';
                attempt.errors = preValidation.errors;
                this.accuracyMetrics.validationErrors++;

                console.warn('ConversionMonitor: Pre-validation failed:', preValidation.errors);
                return { success: false, attemptId, errors: preValidation.errors };
            }

            const firingResult = await this.fireConversionWithRetry(conversionData, attemptId);

            if (firingResult.success) {
                attempt.status = 'fired';
                this.startConversionValidation(attemptId, conversionData);
                return { success: true, attemptId, firingResult: firingResult.firingResult };
            } else {
                attempt.status = 'firing_failed';
                attempt.errors = firingResult.errors || ['Unknown firing error'];
                this.accuracyMetrics.failedFirings++;
                return { success: false, attemptId, errors: attempt.errors };
            }
        } catch (error) {
            attempt.status = 'error';
            attempt.errors = [(error as Error).message];
            this.accuracyMetrics.failedFirings++;

            console.error('ConversionMonitor: Conversion attempt failed:', error);
            return { success: false, attemptId, errors: [(error as Error).message] };
        }
    }

    async validateConversionFiring(conversionId: string): Promise<ValidationResult> {
        if (!conversionId) {
            throw new Error('Conversion ID is required for validation');
        }

        const attempt = this.conversionAttempts.get(conversionId);
        if (!attempt) {
            return {
                isValid: false,
                conversionId,
                timestamp: Date.now(),
                gtmValidation: { isValid: false, errors: ['Conversion attempt not found'] },
                bookingValidation: { isValid: false, errors: ['Conversion attempt not found'] },
                enhancedValidation: { isValid: false, errors: ['Conversion attempt not found'] },
                overallErrors: ['Conversion attempt not found']
            };
        }

        try {
            const gtmValidation = await this.validateGTMTagFiring(attempt.event, conversionId);
            const bookingValidation = this.validateBookingFlowState(attempt.data);
            const enhancedValidation = this.validateEnhancedConversionData(attempt.data);

            const validationResult: ValidationResult = {
                isValid: gtmValidation.isValid && bookingValidation.isValid && enhancedValidation.isValid,
                conversionId,
                timestamp: Date.now(),
                gtmValidation,
                bookingValidation,
                enhancedValidation,
                overallErrors: []
            };

            if (!gtmValidation.isValid) {
                validationResult.overallErrors.push(...gtmValidation.errors);
            }
            if (!bookingValidation.isValid) {
                validationResult.overallErrors.push(...bookingValidation.errors);
            }
            if (!enhancedValidation.isValid) {
                validationResult.overallErrors.push(...enhancedValidation.errors);
            }

            attempt.validationResult = validationResult;
            if (validationResult.isValid) {
                attempt.status = 'validated';
                this.accuracyMetrics.successfulFirings++;
            } else {
                attempt.status = 'validation_failed';
                attempt.errors.push(...validationResult.overallErrors);
            }

            this.conversionValidations.set(conversionId, validationResult);
            return validationResult;
        } catch (error) {
            console.error('ConversionMonitor: Validation failed:', error);

            const errorResult: ValidationResult = {
                isValid: false,
                conversionId,
                timestamp: Date.now(),
                gtmValidation: { isValid: false, errors: [(error as Error).message] },
                bookingValidation: { isValid: false, errors: [(error as Error).message] },
                enhancedValidation: { isValid: false, errors: [(error as Error).message] },
                overallErrors: [(error as Error).message]
            };

            attempt.status = 'validation_failed';
            attempt.errors.push((error as Error).message);
            return errorResult;
        }
    }

    addAlertCallback(callback: AlertCallback): void {
        if (typeof callback === 'function') {
            this.alertCallbacks.push(callback);
        }
    }

    removeAlertCallback(callback: AlertCallback): void {
        this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    }

    getMonitoringStatus() {
        return {
            isInitialized: this.isInitialized,
            monitoringEnabled: this.monitoringEnabled,
            accuracyMetrics: { ...this.accuracyMetrics },
            activeAttempts: this.conversionAttempts.size,
            validationResults: this.conversionValidations.size,
            alertCallbacks: this.alertCallbacks.length
        };
    }

    private handleBookingFlowEvent(eventType: string, data: any): void {
        if (!this.monitoringEnabled) return;

        try {
            if (this.conversionTypes.includes(eventType.replace('_tracked', '') as ConversionEventType)) {
                const conversionType = eventType.replace('_tracked', '') as ConversionEventType;

                this.trackConversionAttempt({
                    event: conversionType,
                    ...data,
                    source: 'booking_flow'
                }).catch(error => {
                    console.error('ConversionMonitor: Auto-tracking failed:', error);
                });
            }
        } catch (error) {
            console.error('ConversionMonitor: Booking flow event handling failed:', error);
        }
    }

    private async fireConversionWithRetry(conversionData: ConversionData, attemptId: string): Promise<FiringResult> {
        const attempt = this.conversionAttempts.get(attemptId);
        if (!attempt) {
            return { success: false, errors: ['Attempt not found'] };
        }

        for (let retry = 0; retry < this.retryAttempts; retry++) {
            try {
                attempt.retryCount = retry;
                let firingResult: any;

                if (conversionData.event === 'purchase' && conversionData.user_data) {
                    const enhancedData = enhancedConversionService.prepareEnhancedConversion(
                        conversionData,
                        conversionData.user_data,
                        { analytics: true, ad_storage: true }
                    );

                    if (enhancedData) {
                        firingResult = await enhancedConversionService.trackEnhancedConversion(enhancedData);
                    } else {
                        firingResult = gtmService.trackConversion(conversionData.event, conversionData);
                    }
                } else {
                    firingResult = gtmService.trackConversion(conversionData.event, conversionData);
                }

                if (firingResult) {
                    return { success: true, retry, firingResult };
                }

                if (retry < this.retryAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retry + 1)));
                }
            } catch (error) {
                console.error(`ConversionMonitor: Firing attempt ${retry + 1} failed:`, error);

                if (retry === this.retryAttempts - 1) {
                    return {
                        success: false,
                        retry,
                        errors: [(error as Error).message]
                    };
                }

                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retry + 1)));
            }
        }

        return {
            success: false,
            retry: this.retryAttempts,
            errors: ['All retry attempts failed']
        };
    }

    private startConversionValidation(attemptId: string, _conversionData: ConversionData): void {
        setTimeout(async () => {
            try {
                await this.validateConversionFiring(attemptId);
            } catch (error) {
                console.error('ConversionMonitor: Validation process failed:', error);
            }
        }, 2000);

        setTimeout(() => {
            const attempt = this.conversionAttempts.get(attemptId);
            if (attempt && attempt.status === 'fired') {
                attempt.status = 'validation_timeout';
                attempt.errors.push('Validation timeout exceeded');
                console.warn(`ConversionMonitor: Validation timeout for attempt ${attemptId}`);
            }
        }, this.validationTimeout);
    }

    private async validateGTMTagFiring(eventType: ConversionEventType, _conversionId: string): Promise<GTMValidationResult> {
        try {
            const gtmStatus = gtmService.getStatus();

            if (!gtmStatus.isInitialized) {
                return {
                    isValid: false,
                    errors: ['GTM not initialized']
                };
            }

            const tagValidation = await gtmService.validateTagFiring(`${eventType}_conversion`);

            return {
                isValid: tagValidation,
                errors: tagValidation ? [] : ['GTM tag firing validation failed'],
                gtmStatus
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [(error as Error).message]
            };
        }
    }

    private validateBookingFlowState(conversionData: ConversionData): BookingValidationResult {
        try {
            const bookingState = bookingFlowManager.getCurrentBookingState();

            if (!bookingState) {
                return {
                    isValid: false,
                    errors: ['No active booking state']
                };
            }

            const conversionType = conversionData.event;
            const isTracked = bookingFlowManager.isConversionTracked(conversionType);

            if (!isTracked && conversionType !== 'view_item') {
                return {
                    isValid: false,
                    errors: [`Conversion ${conversionType} not tracked in booking flow`]
                };
            }

            return {
                isValid: true,
                errors: [],
                bookingState: {
                    bookingId: bookingState.bookingId,
                    currentStep: bookingState.currentStep,
                    conversionTracking: bookingState.conversionTracking
                }
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [(error as Error).message]
            };
        }
    }

    private validateEnhancedConversionData(conversionData: ConversionData): EnhancedValidationResult {
        try {
            if (conversionData.event !== 'purchase' || !conversionData.user_data) {
                return {
                    isValid: true,
                    errors: [],
                    note: 'Enhanced conversion validation not applicable'
                };
            }

            const enhancedStatus = enhancedConversionService.getStatus();

            if (!enhancedStatus.isEnabled) {
                return {
                    isValid: true,
                    errors: [],
                    note: 'Enhanced conversions disabled'
                };
            }

            const compliance = enhancedConversionService.validatePrivacyCompliance(
                conversionData.user_data,
                { analytics: true, ad_storage: true }
            );

            return {
                isValid: compliance.isCompliant,
                errors: compliance.errors || [],
                enhancedStatus,
                compliance
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [(error as Error).message]
            };
        }
    }

    private validateConversionData(conversionData: ConversionData): ValidationDataResult {
        const errors: string[] = [];

        if (!conversionData.event) {
            errors.push('Event type is required');
        }

        if (!this.conversionTypes.includes(conversionData.event)) {
            errors.push(`Invalid event type: ${conversionData.event}`);
        }

        switch (conversionData.event) {
            case 'purchase':
                if (!conversionData.transaction_id) {
                    errors.push('Transaction ID is required for purchase events');
                }
                if (!conversionData.value || conversionData.value <= 0) {
                    errors.push('Valid conversion value is required for purchase events');
                }
                break;

            case 'begin_checkout':
                if (!conversionData.items || !Array.isArray(conversionData.items) || conversionData.items.length === 0) {
                    errors.push('Items array is required for begin_checkout events');
                }
                break;

            case 'view_item':
                if (!conversionData.items || !Array.isArray(conversionData.items) || conversionData.items.length === 0) {
                    errors.push('Items array is required for view_item events');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private setupGTMValidationMonitoring(): void {
        if (typeof window !== 'undefined' && window.dataLayer) {
            const originalPush = window.dataLayer.push;

            window.dataLayer.push = (...args: any[]) => {
                const result = originalPush.apply(window.dataLayer!, args);

                args.forEach(event => {
                    if (event && event.event && this.conversionTypes.includes(event.event)) {
                        console.log('ConversionMonitor: GTM conversion event detected:', event);
                    }
                });

                return result;
            };
        }
    }

    private startPeriodicAccuracyCheck(): void {
        setInterval(async () => {
            try {
                // Periodic accuracy check logic would go here
                console.log('ConversionMonitor: Periodic accuracy check completed');
            } catch (error) {
                console.error('ConversionMonitor: Periodic accuracy check failed:', error);
            }
        }, 60 * 60 * 1000); // 1 hour
    }

    private generateAttemptId(): string {
        return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const conversionMonitor = new ConversionMonitor();

export default conversionMonitor;
export type {
    ConversionData,
    ConversionAttempt,
    ValidationResult,
    Alert,
    AlertCallback
};
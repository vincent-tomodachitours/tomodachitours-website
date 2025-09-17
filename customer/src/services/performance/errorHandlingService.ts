/**
 * Error Handling Service for Performance Monitor
 */

import type { PerformanceError, ErrorType } from './types';
import { ERROR_TYPES, PERFORMANCE_CONFIG, STORAGE_KEYS, TRACKING_KEYWORDS } from './constants';
import { storageService } from '../shared/storageService';

export class ErrorHandlingService {
    private errorQueue: PerformanceError[] = [];
    private errorCallbacks: Map<number, (error: PerformanceError) => void> = new Map();
    private timeouts: NodeJS.Timeout[] = [];
    private isCheckingErrorRate: boolean = false;

    constructor() {
        this.setupGlobalErrorHandling();
        this.loadStoredErrors();
    }

    /**
     * Set up global error handling for tracking failures
     */
    private setupGlobalErrorHandling(): void {
        if (typeof window === 'undefined') return;

        // Capture unhandled errors that might affect tracking
        window.addEventListener('error', (event) => {
            if (this.isTrackingRelatedError(event.error)) {
                this.handleError(ERROR_TYPES.SCRIPT_LOAD_FAILURE, {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error?.stack
                });
            }
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (this.isTrackingRelatedError(event.reason)) {
                this.handleError(ERROR_TYPES.NETWORK_ERROR, {
                    message: 'Unhandled promise rejection',
                    reason: event.reason?.toString(),
                    stack: event.reason?.stack
                });
            }
        });
    }

    /**
     * Check if error is related to tracking functionality
     */
    private isTrackingRelatedError(error: any): boolean {
        if (!error) return false;

        const errorString = error.toString().toLowerCase();
        return TRACKING_KEYWORDS.some(keyword => errorString.includes(keyword));
    }

    /**
     * Handle tracking errors with retry logic
     */
    handleError(errorType: ErrorType, errorData: Record<string, any>): void {
        const error: PerformanceError = {
            id: this.generateErrorId(),
            type: errorType,
            timestamp: Date.now(),
            data: errorData,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            retryCount: 0
        };

        console.error(`Tracking error [${errorType}]:`, errorData);

        // Store error
        this.storeError(error);

        // Notify error callbacks
        this.notifyErrorCallbacks(error);

        // Attempt retry for retryable errors
        if (this.isRetryableError(errorType)) {
            this.scheduleRetry(error);
        }

        // Check if error rate is too high
        this.checkErrorRate();
    }

    /**
     * Store error in local storage
     */
    private storeError(error: PerformanceError): void {
        this.errorQueue.push(error);

        // Limit queue size
        if (this.errorQueue.length > PERFORMANCE_CONFIG.MAX_STORED_ERRORS) {
            this.errorQueue = this.errorQueue.slice(-PERFORMANCE_CONFIG.MAX_STORED_ERRORS);
        }

        // Store in localStorage
        storageService.setItem(STORAGE_KEYS.ERROR_LOG, this.errorQueue);
    }

    /**
     * Check if error type is retryable
     */
    private isRetryableError(errorType: ErrorType): boolean {
        const retryableErrors: ErrorType[] = [
            ERROR_TYPES.NETWORK_ERROR,
            ERROR_TYPES.TRACKING_FAILURE,
            ERROR_TYPES.SCRIPT_LOAD_FAILURE
        ];
        return retryableErrors.includes(errorType);
    }

    /**
     * Schedule retry for failed operation
     */
    private scheduleRetry(error: PerformanceError): void {
        if (error.retryCount >= PERFORMANCE_CONFIG.MAX_RETRIES) {
            console.error(`Max retries exceeded for error ${error.id}`);
            return;
        }

        const delay = PERFORMANCE_CONFIG.RETRY_DELAY_BASE * Math.pow(2, error.retryCount);

        const timeoutId = setTimeout(() => {
            // Don't retry if page is hidden
            if (storageService.getPageVisibility()) {
                this.retryFailedOperation(error);
            } else {
                console.log(`Skipping retry for error ${error.id} - page is hidden`);
            }
        }, delay);

        this.timeouts.push(timeoutId);
        console.log(`Scheduled retry for error ${error.id} in ${delay}ms`);
    }

    /**
     * Retry failed operation
     */
    private async retryFailedOperation(error: PerformanceError): Promise<void> {
        error.retryCount++;

        try {
            let success = false;

            switch (error.type) {
                case ERROR_TYPES.SCRIPT_LOAD_FAILURE:
                    success = await this.retryScriptLoad(error.data);
                    break;
                case ERROR_TYPES.TRACKING_FAILURE:
                    success = await this.retryTrackingCall(error.data);
                    break;
                case ERROR_TYPES.NETWORK_ERROR:
                    success = await this.retryNetworkOperation(error.data);
                    break;
                default:
                    console.warn(`No retry handler for error type: ${error.type}`);
                    return;
            }

            if (success) {
                console.log(`Retry successful for error ${error.id}`);
            } else {
                console.log(`Retry failed for error ${error.id}`);
                this.scheduleRetry(error);
            }
        } catch (retryError) {
            console.error(`Retry attempt failed for error ${error.id}:`, retryError);
            this.scheduleRetry(error);
        }
    }

    /**
     * Retry script loading
     */
    private async retryScriptLoad(errorData: Record<string, any>): Promise<boolean> {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = errorData.script || errorData.url;
            script.async = true;

            const timeout = setTimeout(() => {
                resolve(false);
            }, PERFORMANCE_CONFIG.SCRIPT_LOAD_TIMEOUT);

            script.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };

            script.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Retry tracking call
     */
    private async retryTrackingCall(errorData: Record<string, any>): Promise<boolean> {
        try {
            if (window.gtag && errorData.args) {
                window.gtag(...errorData.args);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Retry tracking call failed:', error);
            return false;
        }
    }

    /**
     * Retry network operation
     */
    private async retryNetworkOperation(_errorData: Record<string, any>): Promise<boolean> {
        // This would retry specific network operations
        // Implementation depends on the specific operation
        try {
            // Placeholder for actual network retry logic
            console.log('Retrying network operation');
            return true;
        } catch (error) {
            console.error('Retry network operation failed:', error);
            return false;
        }
    }

    /**
     * Check error rate and alert if too high
     */
    private checkErrorRate(): void {
        if (this.isCheckingErrorRate) return;

        this.isCheckingErrorRate = true;

        try {
            const recentErrors = this.getRecentErrors(5 * 60 * 1000); // Last 5 minutes
            const errorRate = recentErrors.length;

            if (errorRate > 10) {
                const error: PerformanceError = {
                    id: this.generateErrorId(),
                    type: ERROR_TYPES.CONFIGURATION_ERROR,
                    timestamp: Date.now(),
                    data: {
                        message: 'High error rate detected',
                        errorRate: errorRate,
                        recentErrors: recentErrors.length
                    },
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                    retryCount: 0
                };

                console.error(`Tracking error [${error.type}]:`, error.data);
                this.storeError(error);
                this.notifyErrorCallbacks(error);
            }
        } finally {
            this.isCheckingErrorRate = false;
        }
    }

    /**
     * Get recent errors within time window
     */
    getRecentErrors(timeWindow: number): PerformanceError[] {
        const cutoff = Date.now() - timeWindow;
        return this.errorQueue.filter(error => error.timestamp > cutoff);
    }

    /**
     * Load stored errors on initialization
     */
    private loadStoredErrors(): void {
        const storedErrors = storageService.getItem<PerformanceError[]>(STORAGE_KEYS.ERROR_LOG, []);
        if (storedErrors) {
            this.errorQueue = storedErrors;
        }
    }

    /**
     * Register error callback
     */
    onError(callback: (error: PerformanceError) => void): number {
        const callbackId = Date.now() + Math.random();
        this.errorCallbacks.set(callbackId, callback);
        return callbackId;
    }

    /**
     * Unregister error callback
     */
    offError(callbackId: number): void {
        this.errorCallbacks.delete(callbackId);
    }

    /**
     * Notify error callbacks
     */
    private notifyErrorCallbacks(error: PerformanceError): void {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        });
    }

    /**
     * Generate unique error ID
     */
    private generateErrorId(): string {
        return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all errors
     */
    getAllErrors(): PerformanceError[] {
        return [...this.errorQueue];
    }

    /**
     * Clear all errors
     */
    clearErrors(): void {
        this.errorQueue = [];
        storageService.removeItem(STORAGE_KEYS.ERROR_LOG);
    }

    /**
     * Cleanup timeouts
     */
    cleanup(): void {
        this.timeouts.forEach(timeout => {
            if (timeout) clearTimeout(timeout);
        });
        this.timeouts = [];
    }
}

export const errorHandlingService = new ErrorHandlingService();
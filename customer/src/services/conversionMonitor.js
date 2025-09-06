/**
 * Conversion Monitor Service
 * 
 * Provides real-time conversion validation, accuracy monitoring, and diagnostic reporting
 * for Google Ads conversion tracking. Integrates with GTM, booking flow, and enhanced
 * conversion services to ensure reliable conversion tracking.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import gtmService from './gtmService.js';
import bookingFlowManager from './bookingFlowManager.js';
import enhancedConversionService from './enhancedConversionService.js';

class ConversionMonitor {
    constructor() {
        this.isInitialized = false;
        this.monitoringEnabled = true;
        this.alertThreshold = 0.95; // 95% accuracy threshold
        this.alertCallbacks = [];
        this.conversionAttempts = new Map();
        this.conversionValidations = new Map();
        this.accuracyMetrics = {
            totalAttempts: 0,
            successfulFirings: 0,
            failedFirings: 0,
            validationErrors: 0,
            lastAccuracyCheck: null,
            currentAccuracy: 1.0
        };
        
        // Conversion tracking configuration
        this.conversionTypes = ['view_item', 'begin_checkout', 'add_payment_info', 'purchase'];
        this.validationTimeout = 30000; // 30 seconds timeout for validation
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds between retries

        // Initialize monitoring
        this.initialize();
    }

    /**
     * Initialize conversion monitoring system
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Set up booking flow listener for conversion tracking
            bookingFlowManager.addListener(this.handleBookingFlowEvent.bind(this));

            // Set up periodic accuracy checks
            this.startPeriodicAccuracyCheck();

            // Set up GTM validation monitoring
            this.setupGTMValidationMonitoring();

            this.isInitialized = true;
            console.log('ConversionMonitor: Initialized successfully');

        } catch (error) {
            console.error('ConversionMonitor: Initialization failed:', error);
        }
    }    /
**
     * Track a conversion attempt with validation
     * @param {Object} conversionData - Conversion data to track
     * @returns {Promise<Object>} - Tracking result with validation
     */
    async trackConversionAttempt(conversionData) {
        if (!conversionData || !conversionData.event) {
            throw new Error('Invalid conversion data: event type is required');
        }

        const attemptId = this.generateAttemptId();
        const timestamp = Date.now();

        // Record the attempt
        const attempt = {
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
            // Validate conversion data before firing
            const preValidation = this.validateConversionData(conversionData);
            if (!preValidation.isValid) {
                attempt.status = 'validation_failed';
                attempt.errors = preValidation.errors;
                this.accuracyMetrics.validationErrors++;
                
                console.warn('ConversionMonitor: Pre-validation failed:', preValidation.errors);
                return { success: false, attemptId, errors: preValidation.errors };
            }

            // Fire the conversion through GTM
            const firingResult = await this.fireConversionWithRetry(conversionData, attemptId);
            
            if (firingResult.success) {
                attempt.status = 'fired';
                
                // Start validation process
                this.startConversionValidation(attemptId, conversionData);
                
                return { success: true, attemptId, firingResult };
            } else {
                attempt.status = 'firing_failed';
                attempt.errors = firingResult.errors || ['Unknown firing error'];
                this.accuracyMetrics.failedFirings++;
                
                return { success: false, attemptId, errors: attempt.errors };
            }

        } catch (error) {
            attempt.status = 'error';
            attempt.errors = [error.message];
            this.accuracyMetrics.failedFirings++;
            
            console.error('ConversionMonitor: Conversion attempt failed:', error);
            return { success: false, attemptId, errors: [error.message] };
        }
    }

    /**
     * Validate if a conversion event fired successfully
     * @param {string} conversionId - Conversion identifier (attempt ID)
     * @returns {Promise<Object>} - Validation result
     */
    async validateConversionFiring(conversionId) {
        if (!conversionId) {
            throw new Error('Conversion ID is required for validation');
        }

        const attempt = this.conversionAttempts.get(conversionId);
        if (!attempt) {
            return {
                isValid: false,
                error: 'Conversion attempt not found',
                conversionId
            };
        }

        try {
            // Check GTM tag firing validation
            const gtmValidation = await this.validateGTMTagFiring(attempt.event, conversionId);
            
            // Check booking flow validation if applicable
            const bookingValidation = this.validateBookingFlowState(attempt.data);
            
            // Check enhanced conversion validation if applicable
            const enhancedValidation = this.validateEnhancedConversionData(attempt.data);

            const validationResult = {
                isValid: gtmValidation.isValid && bookingValidation.isValid && enhancedValidation.isValid,
                conversionId,
                timestamp: Date.now(),
                gtmValidation,
                bookingValidation,
                enhancedValidation,
                overallErrors: []
            };

            // Collect all errors
            if (!gtmValidation.isValid) {
                validationResult.overallErrors.push(...gtmValidation.errors);
            }
            if (!bookingValidation.isValid) {
                validationResult.overallErrors.push(...bookingValidation.errors);
            }
            if (!enhancedValidation.isValid) {
                validationResult.overallErrors.push(...enhancedValidation.errors);
            }

            // Update attempt status
            attempt.validationResult = validationResult;
            if (validationResult.isValid) {
                attempt.status = 'validated';
                this.accuracyMetrics.successfulFirings++;
            } else {
                attempt.status = 'validation_failed';
                attempt.errors.push(...validationResult.overallErrors);
            }

            // Store validation result
            this.conversionValidations.set(conversionId, validationResult);

            return validationResult;

        } catch (error) {
            console.error('ConversionMonitor: Validation failed:', error);
            
            const errorResult = {
                isValid: false,
                error: error.message,
                conversionId,
                timestamp: Date.now()
            };

            attempt.status = 'validation_error';
            attempt.errors.push(error.message);

            return errorResult;
        }
    }  
  /**
     * Compare tracked conversions vs actual bookings for accuracy analysis
     * @param {Object} dateRange - Date range for comparison
     * @returns {Promise<Object>} - Accuracy comparison report
     */
    async compareActualVsTracked(dateRange = {}) {
        const startDate = dateRange.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        const endDate = dateRange.endDate || new Date();

        try {
            // Get tracked conversions from our monitoring data
            const trackedConversions = this.getTrackedConversionsInRange(startDate, endDate);
            
            // Get actual bookings from booking system (this would typically query a database)
            const actualBookings = await this.getActualBookingsInRange(startDate, endDate);

            // Perform comparison analysis
            const comparisonResult = {
                dateRange: { startDate, endDate },
                trackedCount: trackedConversions.length,
                actualCount: actualBookings.length,
                accuracy: 0,
                discrepancies: [],
                missingConversions: [],
                extraConversions: [],
                matchedConversions: [],
                analysis: {}
            };

            // Match conversions with bookings
            const { matched, missing, extra } = this.matchConversionsWithBookings(
                trackedConversions, 
                actualBookings
            );

            comparisonResult.matchedConversions = matched;
            comparisonResult.missingConversions = missing;
            comparisonResult.extraConversions = extra;

            // Calculate accuracy
            if (actualBookings.length > 0) {
                comparisonResult.accuracy = matched.length / actualBookings.length;
            } else {
                comparisonResult.accuracy = trackedConversions.length === 0 ? 1.0 : 0;
            }

            // Generate analysis
            comparisonResult.analysis = this.generateAccuracyAnalysis(comparisonResult);

            // Update accuracy metrics
            this.accuracyMetrics.currentAccuracy = comparisonResult.accuracy;
            this.accuracyMetrics.lastAccuracyCheck = Date.now();

            // Check if accuracy is below threshold
            if (comparisonResult.accuracy < this.alertThreshold) {
                this.triggerAccuracyAlert(comparisonResult);
            }

            return comparisonResult;

        } catch (error) {
            console.error('ConversionMonitor: Accuracy comparison failed:', error);
            throw error;
        }
    }

    /**
     * Generate comprehensive diagnostic report for conversion tracking issues
     * @param {Object} options - Report options
     * @returns {Object} - Diagnostic report
     */
    generateDiagnosticReport(options = {}) {
        const reportPeriod = options.period || 24; // hours
        const startTime = Date.now() - (reportPeriod * 60 * 60 * 1000);

        const report = {
            generatedAt: new Date().toISOString(),
            reportPeriod: `${reportPeriod} hours`,
            summary: {},
            conversionAttempts: {},
            validationResults: {},
            accuracyMetrics: { ...this.accuracyMetrics },
            systemStatus: {},
            recommendations: [],
            detailedIssues: []
        };

        try {
            // Generate summary statistics
            report.summary = this.generateSummaryStatistics(startTime);

            // Analyze conversion attempts
            report.conversionAttempts = this.analyzeConversionAttempts(startTime);

            // Analyze validation results
            report.validationResults = this.analyzeValidationResults(startTime);

            // Check system status
            report.systemStatus = this.checkSystemStatus();

            // Generate recommendations
            report.recommendations = this.generateRecommendations(report);

            // Identify detailed issues
            report.detailedIssues = this.identifyDetailedIssues(startTime);

            console.log('ConversionMonitor: Diagnostic report generated');
            return report;

        } catch (error) {
            console.error('ConversionMonitor: Failed to generate diagnostic report:', error);
            report.error = error.message;
            return report;
        }
    }

    /**
     * Add alert callback for conversion tracking issues
     * @param {Function} callback - Alert callback function
     */
    addAlertCallback(callback) {
        if (typeof callback === 'function') {
            this.alertCallbacks.push(callback);
        }
    }

    /**
     * Remove alert callback
     * @param {Function} callback - Alert callback to remove
     */
    removeAlertCallback(callback) {
        this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    }

    /**
     * Get current monitoring status
     * @returns {Object} - Monitoring status
     */
    getMonitoringStatus() {
        return {
            isInitialized: this.isInitialized,
            monitoringEnabled: this.monitoringEnabled,
            accuracyMetrics: { ...this.accuracyMetrics },
            activeAttempts: this.conversionAttempts.size,
            validationResults: this.conversionValidations.size,
            alertCallbacks: this.alertCallbacks.length,
            systemStatus: this.checkSystemStatus()
        };
    } 
   // Private methods

    /**
     * Handle booking flow events for conversion monitoring
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    handleBookingFlowEvent(eventType, data) {
        if (!this.monitoringEnabled) return;

        try {
            // Track conversion events from booking flow
            if (this.conversionTypes.includes(eventType.replace('_tracked', ''))) {
                const conversionType = eventType.replace('_tracked', '');
                
                // Automatically track and validate the conversion
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

    /**
     * Fire conversion with retry logic
     * @param {Object} conversionData - Conversion data
     * @param {string} attemptId - Attempt ID
     * @returns {Promise<Object>} - Firing result
     */
    async fireConversionWithRetry(conversionData, attemptId) {
        const attempt = this.conversionAttempts.get(attemptId);
        
        for (let retry = 0; retry < this.retryAttempts; retry++) {
            try {
                attempt.retryCount = retry;

                // Fire conversion through GTM
                let firingResult;
                
                if (conversionData.event === 'purchase' && conversionData.user_data) {
                    // Use enhanced conversion for purchase events with customer data
                    const enhancedData = enhancedConversionService.prepareEnhancedConversion(
                        conversionData,
                        conversionData.user_data,
                        { analytics: true, ad_storage: true } // Assume consent for monitoring
                    );
                    
                    if (enhancedData) {
                        firingResult = await enhancedConversionService.trackEnhancedConversion(enhancedData);
                    } else {
                        // Fall back to standard GTM tracking
                        firingResult = gtmService.trackConversion(conversionData.event, conversionData);
                    }
                } else {
                    // Use standard GTM tracking
                    firingResult = gtmService.trackConversion(conversionData.event, conversionData);
                }

                if (firingResult) {
                    return { success: true, retry, firingResult };
                }

                // If not the last retry, wait before retrying
                if (retry < this.retryAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retry + 1)));
                }

            } catch (error) {
                console.error(`ConversionMonitor: Firing attempt ${retry + 1} failed:`, error);
                
                // If last retry, return failure
                if (retry === this.retryAttempts - 1) {
                    return { 
                        success: false, 
                        retry, 
                        errors: [error.message] 
                    };
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retry + 1)));
            }
        }

        return { 
            success: false, 
            retry: this.retryAttempts, 
            errors: ['All retry attempts failed'] 
        };
    }

    /**
     * Start conversion validation process
     * @param {string} attemptId - Attempt ID
     * @param {Object} conversionData - Conversion data
     */
    startConversionValidation(attemptId, conversionData) {
        // Start validation after a short delay to allow for tag firing
        setTimeout(async () => {
            try {
                await this.validateConversionFiring(attemptId);
            } catch (error) {
                console.error('ConversionMonitor: Validation process failed:', error);
            }
        }, 2000); // 2 second delay

        // Set timeout for validation
        setTimeout(() => {
            const attempt = this.conversionAttempts.get(attemptId);
            if (attempt && attempt.status === 'fired') {
                attempt.status = 'validation_timeout';
                attempt.errors.push('Validation timeout exceeded');
                console.warn(`ConversionMonitor: Validation timeout for attempt ${attemptId}`);
            }
        }, this.validationTimeout);
    }    
/**
     * Validate GTM tag firing
     * @param {string} eventType - Event type
     * @param {string} conversionId - Conversion ID
     * @returns {Promise<Object>} - Validation result
     */
    async validateGTMTagFiring(eventType, conversionId) {
        try {
            // Check GTM status
            const gtmStatus = gtmService.getStatus();
            
            if (!gtmStatus.isInitialized) {
                return {
                    isValid: false,
                    errors: ['GTM not initialized']
                };
            }

            // Validate tag firing through GTM service
            const tagValidation = await gtmService.validateTagFiring(`${eventType}_conversion`);
            
            return {
                isValid: tagValidation,
                errors: tagValidation ? [] : ['GTM tag firing validation failed'],
                gtmStatus
            };

        } catch (error) {
            return {
                isValid: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Validate booking flow state
     * @param {Object} conversionData - Conversion data
     * @returns {Object} - Validation result
     */
    validateBookingFlowState(conversionData) {
        try {
            const bookingState = bookingFlowManager.getCurrentBookingState();
            
            if (!bookingState) {
                return {
                    isValid: false,
                    errors: ['No active booking state']
                };
            }

            // Validate conversion tracking state
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
                errors: [error.message]
            };
        }
    }

    /**
     * Validate enhanced conversion data
     * @param {Object} conversionData - Conversion data
     * @returns {Object} - Validation result
     */
    validateEnhancedConversionData(conversionData) {
        try {
            // Only validate for purchase events with customer data
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

            // Validate customer data
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
                errors: [error.message]
            };
        }
    }

    /**
     * Validate conversion data before firing
     * @param {Object} conversionData - Conversion data to validate
     * @returns {Object} - Validation result
     */
    validateConversionData(conversionData) {
        const errors = [];

        // Check required fields
        if (!conversionData.event) {
            errors.push('Event type is required');
        }

        if (!this.conversionTypes.includes(conversionData.event)) {
            errors.push(`Invalid event type: ${conversionData.event}`);
        }

        // Validate event-specific requirements
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
    }    /**
  
   * Get tracked conversions in date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array} - Tracked conversions
     */
    getTrackedConversionsInRange(startDate, endDate) {
        const conversions = [];
        
        for (const [attemptId, attempt] of this.conversionAttempts) {
            if (attempt.timestamp >= startDate.getTime() && 
                attempt.timestamp <= endDate.getTime() &&
                attempt.status === 'validated') {
                conversions.push({
                    id: attemptId,
                    event: attempt.event,
                    timestamp: attempt.timestamp,
                    data: attempt.data
                });
            }
        }

        return conversions;
    }

    /**
     * Get actual bookings in date range (mock implementation)
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} - Actual bookings
     */
    async getActualBookingsInRange(startDate, endDate) {
        // This would typically query a database or API
        // For now, return mock data based on booking flow manager
        
        try {
            const bookingState = bookingFlowManager.getCurrentBookingState();
            
            if (bookingState && 
                bookingState.createdAt &&
                new Date(bookingState.createdAt) >= startDate &&
                new Date(bookingState.createdAt) <= endDate &&
                bookingState.conversionTracking.purchaseTracked) {
                
                return [{
                    id: bookingState.bookingId,
                    transactionId: bookingState.transactionId,
                    timestamp: new Date(bookingState.createdAt).getTime(),
                    value: bookingState.paymentData?.amount || 0,
                    tourId: bookingState.tourData?.tourId
                }];
            }

            return [];

        } catch (error) {
            console.error('ConversionMonitor: Failed to get actual bookings:', error);
            return [];
        }
    }

    /**
     * Match conversions with bookings for accuracy analysis
     * @param {Array} conversions - Tracked conversions
     * @param {Array} bookings - Actual bookings
     * @returns {Object} - Matching result
     */
    matchConversionsWithBookings(conversions, bookings) {
        const matched = [];
        const missing = [];
        const extra = [];

        // Create maps for efficient matching
        const conversionMap = new Map();
        conversions.forEach(conv => {
            const key = conv.data.transaction_id || conv.data.booking_id || conv.id;
            conversionMap.set(key, conv);
        });

        const bookingMap = new Map();
        bookings.forEach(booking => {
            const key = booking.transactionId || booking.id;
            bookingMap.set(key, booking);
        });

        // Find matches
        for (const [key, booking] of bookingMap) {
            if (conversionMap.has(key)) {
                matched.push({
                    booking,
                    conversion: conversionMap.get(key)
                });
                conversionMap.delete(key);
            } else {
                missing.push(booking);
            }
        }

        // Remaining conversions are extra
        for (const [key, conversion] of conversionMap) {
            extra.push(conversion);
        }

        return { matched, missing, extra };
    }

    /**
     * Generate accuracy analysis
     * @param {Object} comparisonResult - Comparison result
     * @returns {Object} - Analysis
     */
    generateAccuracyAnalysis(comparisonResult) {
        const analysis = {
            accuracyLevel: 'good',
            issues: [],
            recommendations: []
        };

        if (comparisonResult.accuracy < 0.8) {
            analysis.accuracyLevel = 'critical';
            analysis.issues.push('Conversion accuracy is critically low');
            analysis.recommendations.push('Immediate investigation required');
        } else if (comparisonResult.accuracy < 0.9) {
            analysis.accuracyLevel = 'warning';
            analysis.issues.push('Conversion accuracy is below optimal level');
            analysis.recommendations.push('Review conversion tracking implementation');
        }

        if (comparisonResult.missingConversions.length > 0) {
            analysis.issues.push(`${comparisonResult.missingConversions.length} conversions not tracked`);
            analysis.recommendations.push('Check GTM tag firing and validation');
        }

        if (comparisonResult.extraConversions.length > 0) {
            analysis.issues.push(`${comparisonResult.extraConversions.length} extra conversions tracked`);
            analysis.recommendations.push('Review conversion deduplication logic');
        }

        return analysis;
    }

    /**
     * Trigger accuracy alert
     * @param {Object} comparisonResult - Comparison result
     */
    triggerAccuracyAlert(comparisonResult) {
        const alert = {
            type: 'accuracy_alert',
            severity: comparisonResult.accuracy < 0.8 ? 'critical' : 'warning',
            message: `Conversion accuracy dropped to ${(comparisonResult.accuracy * 100).toFixed(1)}%`,
            data: comparisonResult,
            timestamp: Date.now()
        };

        // Notify all alert callbacks
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('ConversionMonitor: Alert callback failed:', error);
            }
        });

        console.warn('ConversionMonitor: Accuracy alert triggered:', alert);
    }    /**
 
    * Setup GTM validation monitoring
     */
    setupGTMValidationMonitoring() {
        // Monitor GTM dataLayer for conversion events
        if (typeof window !== 'undefined' && window.dataLayer) {
            const originalPush = window.dataLayer.push;
            
            window.dataLayer.push = (...args) => {
                // Call original push
                const result = originalPush.apply(window.dataLayer, args);
                
                // Monitor conversion events
                args.forEach(event => {
                    if (event && event.event && this.conversionTypes.includes(event.event)) {
                        console.log('ConversionMonitor: GTM conversion event detected:', event);
                    }
                });
                
                return result;
            };
        }
    }

    /**
     * Start periodic accuracy check
     */
    startPeriodicAccuracyCheck() {
        // Check accuracy every hour
        setInterval(async () => {
            try {
                await this.compareActualVsTracked({
                    startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                    endDate: new Date()
                });
            } catch (error) {
                console.error('ConversionMonitor: Periodic accuracy check failed:', error);
            }
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Generate attempt ID
     * @returns {string} - Unique attempt ID
     */
    generateAttemptId() {
        return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate summary statistics
     * @param {number} startTime - Start time for analysis
     * @returns {Object} - Summary statistics
     */
    generateSummaryStatistics(startTime) {
        let totalAttempts = 0;
        let successfulAttempts = 0;
        let failedAttempts = 0;
        let validationErrors = 0;

        for (const [id, attempt] of this.conversionAttempts) {
            if (attempt.timestamp >= startTime) {
                totalAttempts++;
                
                if (attempt.status === 'validated') {
                    successfulAttempts++;
                } else if (attempt.status === 'validation_failed' || attempt.status === 'firing_failed') {
                    failedAttempts++;
                }
                
                if (attempt.status === 'validation_failed') {
                    validationErrors++;
                }
            }
        }

        return {
            totalAttempts,
            successfulAttempts,
            failedAttempts,
            validationErrors,
            successRate: totalAttempts > 0 ? successfulAttempts / totalAttempts : 0
        };
    }

    /**
     * Analyze conversion attempts
     * @param {number} startTime - Start time for analysis
     * @returns {Object} - Conversion attempts analysis
     */
    analyzeConversionAttempts(startTime) {
        const analysis = {
            byEventType: {},
            byStatus: {},
            retryAnalysis: {},
            errorPatterns: []
        };

        for (const [id, attempt] of this.conversionAttempts) {
            if (attempt.timestamp >= startTime) {
                // By event type
                if (!analysis.byEventType[attempt.event]) {
                    analysis.byEventType[attempt.event] = { count: 0, successful: 0 };
                }
                analysis.byEventType[attempt.event].count++;
                if (attempt.status === 'validated') {
                    analysis.byEventType[attempt.event].successful++;
                }

                // By status
                if (!analysis.byStatus[attempt.status]) {
                    analysis.byStatus[attempt.status] = 0;
                }
                analysis.byStatus[attempt.status]++;

                // Retry analysis
                if (attempt.retryCount > 0) {
                    if (!analysis.retryAnalysis[attempt.retryCount]) {
                        analysis.retryAnalysis[attempt.retryCount] = 0;
                    }
                    analysis.retryAnalysis[attempt.retryCount]++;
                }

                // Error patterns
                if (attempt.errors && attempt.errors.length > 0) {
                    attempt.errors.forEach(error => {
                        const existingPattern = analysis.errorPatterns.find(p => p.error === error);
                        if (existingPattern) {
                            existingPattern.count++;
                        } else {
                            analysis.errorPatterns.push({ error, count: 1 });
                        }
                    });
                }
            }
        }

        return analysis;
    } 
   /**
     * Analyze validation results
     * @param {number} startTime - Start time for analysis
     * @returns {Object} - Validation results analysis
     */
    analyzeValidationResults(startTime) {
        const analysis = {
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            validationTypes: {
                gtm: { total: 0, successful: 0 },
                bookingFlow: { total: 0, successful: 0 },
                enhancedConversion: { total: 0, successful: 0 }
            }
        };

        for (const [id, validation] of this.conversionValidations) {
            if (validation.timestamp >= startTime) {
                analysis.totalValidations++;
                
                if (validation.isValid) {
                    analysis.successfulValidations++;
                } else {
                    analysis.failedValidations++;
                }

                // Analyze validation types
                if (validation.gtmValidation) {
                    analysis.validationTypes.gtm.total++;
                    if (validation.gtmValidation.isValid) {
                        analysis.validationTypes.gtm.successful++;
                    }
                }

                if (validation.bookingValidation) {
                    analysis.validationTypes.bookingFlow.total++;
                    if (validation.bookingValidation.isValid) {
                        analysis.validationTypes.bookingFlow.successful++;
                    }
                }

                if (validation.enhancedValidation) {
                    analysis.validationTypes.enhancedConversion.total++;
                    if (validation.enhancedValidation.isValid) {
                        analysis.validationTypes.enhancedConversion.successful++;
                    }
                }
            }
        }

        return analysis;
    }

    /**
     * Check system status
     * @returns {Object} - System status
     */
    checkSystemStatus() {
        return {
            gtm: gtmService.getStatus(),
            bookingFlow: {
                hasActiveBooking: !!bookingFlowManager.getCurrentBookingState(),
                currentStep: bookingFlowManager.getCurrentStep()
            },
            enhancedConversion: enhancedConversionService.getStatus(),
            monitor: {
                isInitialized: this.isInitialized,
                monitoringEnabled: this.monitoringEnabled,
                activeAttempts: this.conversionAttempts.size,
                validationResults: this.conversionValidations.size
            }
        };
    }

    /**
     * Generate recommendations based on report data
     * @param {Object} report - Diagnostic report
     * @returns {Array} - Recommendations
     */
    generateRecommendations(report) {
        const recommendations = [];

        // Check success rate
        if (report.summary.successRate < 0.9) {
            recommendations.push({
                priority: 'high',
                category: 'accuracy',
                message: 'Conversion success rate is below 90%. Review GTM configuration and validation logic.'
            });
        }

        // Check GTM status
        if (!report.systemStatus.gtm.isInitialized) {
            recommendations.push({
                priority: 'critical',
                category: 'gtm',
                message: 'GTM is not initialized. Check container ID and loading configuration.'
            });
        }

        // Check enhanced conversions
        if (!report.systemStatus.enhancedConversion.isEnabled) {
            recommendations.push({
                priority: 'medium',
                category: 'enhanced_conversion',
                message: 'Enhanced conversions are disabled. Enable for better attribution accuracy.'
            });
        }

        // Check validation errors
        if (report.summary.validationErrors > 0) {
            recommendations.push({
                priority: 'high',
                category: 'validation',
                message: 'Validation errors detected. Review conversion data structure and requirements.'
            });
        }

        return recommendations;
    }

    /**
     * Identify detailed issues
     * @param {number} startTime - Start time for analysis
     * @returns {Array} - Detailed issues
     */
    identifyDetailedIssues(startTime) {
        const issues = [];

        // Check for frequent retry attempts
        let highRetryCount = 0;
        for (const [id, attempt] of this.conversionAttempts) {
            if (attempt.timestamp >= startTime && attempt.retryCount > 1) {
                highRetryCount++;
            }
        }

        if (highRetryCount > 0) {
            issues.push({
                type: 'retry_issues',
                severity: 'warning',
                message: `${highRetryCount} conversion attempts required multiple retries`,
                recommendation: 'Investigate network issues or GTM configuration problems'
            });
        }

        // Check for validation timeouts
        let timeoutCount = 0;
        for (const [id, attempt] of this.conversionAttempts) {
            if (attempt.timestamp >= startTime && attempt.status === 'validation_timeout') {
                timeoutCount++;
            }
        }

        if (timeoutCount > 0) {
            issues.push({
                type: 'validation_timeouts',
                severity: 'high',
                message: `${timeoutCount} conversion validations timed out`,
                recommendation: 'Increase validation timeout or optimize validation logic'
            });
        }

        return issues;
    }
}

// Create singleton instance
const conversionMonitor = new ConversionMonitor();

export default conversionMonitor;
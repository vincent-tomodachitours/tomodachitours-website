/**
 * Product Feed Automation Service
 * Handles automatic product feed updates and error handling
 * Manages feed scheduling, validation, and submission to Google Merchant Center
 */

import productFeedService from './productFeedService.js';
import { fetchTours, refreshAvailabilityForDate } from '../toursService.js';

class FeedAutomationService {
    constructor() {
        this.feedUpdateInterval = 6 * 60 * 60 * 1000; // 6 hours
        this.availabilityUpdateInterval = 30 * 60 * 1000; // 30 minutes
        this.maxRetries = 3;
        this.retryDelay = 5 * 60 * 1000; // 5 minutes

        // Feed submission endpoints
        this.merchantCenterEndpoint = process.env.REACT_APP_MERCHANT_CENTER_ENDPOINT;
        this.feedSubmissionUrl = process.env.REACT_APP_FEED_SUBMISSION_URL;

        // Automation state
        this.isRunning = false;
        this.lastUpdateTime = null;
        this.lastError = null;
        this.updateCount = 0;
        this.errorCount = 0;

        // Scheduled update timers
        this.feedUpdateTimer = null;
        this.availabilityUpdateTimer = null;

        // Error tracking
        this.errorLog = [];
        this.maxErrorLogSize = 100;

        // Performance metrics
        this.metrics = {
            totalUpdates: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            averageUpdateTime: 0,
            lastUpdateDuration: 0
        };
    }

    /**
     * Start automated feed updates
     * @param {Object} options - Automation options
     */
    start(options = {}) {
        if (this.isRunning) {
            console.log('Feed Automation: Already running');
            return;
        }

        this.isRunning = true;
        console.log('Feed Automation: Starting automated feed updates');

        // Set custom intervals if provided
        if (options.feedUpdateInterval) {
            this.feedUpdateInterval = options.feedUpdateInterval;
        }
        if (options.availabilityUpdateInterval) {
            this.availabilityUpdateInterval = options.availabilityUpdateInterval;
        }

        // Start immediate update
        this._performFeedUpdate();

        // Schedule regular feed updates
        this.feedUpdateTimer = setInterval(() => {
            this._performFeedUpdate();
        }, this.feedUpdateInterval);

        // Schedule availability updates (more frequent)
        this.availabilityUpdateTimer = setInterval(() => {
            this._performAvailabilityUpdate();
        }, this.availabilityUpdateInterval);

        console.log(`Feed Automation: Scheduled updates every ${this.feedUpdateInterval / 1000 / 60} minutes`);
    }

    /**
     * Stop automated feed updates
     */
    stop() {
        if (!this.isRunning) {
            console.log('Feed Automation: Not running');
            return;
        }

        this.isRunning = false;

        // Clear timers
        if (this.feedUpdateTimer) {
            clearInterval(this.feedUpdateTimer);
            this.feedUpdateTimer = null;
        }

        if (this.availabilityUpdateTimer) {
            clearInterval(this.availabilityUpdateTimer);
            this.availabilityUpdateTimer = null;
        }

        console.log('Feed Automation: Stopped automated feed updates');
    }

    /**
     * Manually trigger feed update
     * @param {Object} options - Update options
     */
    async triggerUpdate(options = {}) {
        console.log('Feed Automation: Manual feed update triggered');
        return await this._performFeedUpdate(options);
    }

    /**
     * Update product feed with error handling and retries
     * @param {Object} options - Update options
     */
    async updateProductFeed(options = {}) {
        const startTime = Date.now();
        let attempt = 0;
        let lastError = null;

        while (attempt < this.maxRetries) {
            try {
                attempt++;
                console.log(`Feed Automation: Update attempt ${attempt}/${this.maxRetries}`);

                // Generate product feed
                const feedData = await this._generateFeedWithValidation(options);

                // Submit feed to Google Merchant Center
                const submissionResult = await this._submitFeedToMerchantCenter(feedData, options);

                // Update metrics
                const duration = Date.now() - startTime;
                this._updateSuccessMetrics(duration);

                console.log('Feed Automation: Product feed updated successfully');
                return {
                    success: true,
                    attempt,
                    duration,
                    productCount: feedData.products?.length || 0,
                    submissionResult
                };

            } catch (error) {
                lastError = error;
                console.error(`Feed Automation: Update attempt ${attempt} failed:`, error);

                // Log error
                this._logError(error, { attempt, options });

                // Wait before retry (except on last attempt)
                if (attempt < this.maxRetries) {
                    console.log(`Feed Automation: Retrying in ${this.retryDelay / 1000} seconds...`);
                    await this._delay(this.retryDelay);
                }
            }
        }

        // All attempts failed
        const duration = Date.now() - startTime;
        this._updateFailureMetrics(duration);

        return {
            success: false,
            attempts: attempt,
            duration,
            error: lastError.message,
            lastError
        };
    }

    /**
     * Validate and submit feed to external systems
     * @param {Object} feedData - Feed data to submit
     * @param {Object} options - Submission options
     */
    async submitFeedToExternalSystems(feedData, options = {}) {
        const results = [];

        try {
            // Submit to Google Merchant Center (if configured)
            if (this.merchantCenterEndpoint) {
                const merchantResult = await this._submitToMerchantCenter(feedData, options);
                results.push({
                    system: 'Google Merchant Center',
                    success: merchantResult.success,
                    response: merchantResult
                });
            }

            // Submit to custom feed endpoint (if configured)
            if (this.feedSubmissionUrl) {
                const customResult = await this._submitToCustomEndpoint(feedData, options);
                results.push({
                    system: 'Custom Feed Endpoint',
                    success: customResult.success,
                    response: customResult
                });
            }

            // Save feed to local storage/file system
            const localResult = await this._saveFeedLocally(feedData, options);
            results.push({
                system: 'Local Storage',
                success: localResult.success,
                response: localResult
            });

            return {
                success: results.every(r => r.success),
                results
            };

        } catch (error) {
            console.error('Feed Automation: Error submitting to external systems:', error);
            return {
                success: false,
                error: error.message,
                results
            };
        }
    }

    /**
     * Monitor feed health and performance
     */
    async monitorFeedHealth() {
        try {
            const healthCheck = {
                timestamp: new Date().toISOString(),
                isRunning: this.isRunning,
                lastUpdateTime: this.lastUpdateTime,
                lastError: this.lastError,
                metrics: { ...this.metrics },
                errorRate: this.errorCount / Math.max(this.updateCount, 1),
                recentErrors: this.errorLog.slice(-5)
            };

            // Check tour data availability
            const tours = await fetchTours();
            healthCheck.tourDataAvailable = Object.keys(tours).length > 0;
            healthCheck.tourCount = Object.keys(tours).length;

            // Check feed generation capability
            try {
                const testFeed = await productFeedService.generateJSONFeed({
                    includeAvailability: false,
                    daysAhead: 1
                });
                healthCheck.feedGenerationWorking = true;
                healthCheck.testProductCount = testFeed.products?.length || 0;
            } catch (error) {
                healthCheck.feedGenerationWorking = false;
                healthCheck.feedGenerationError = error.message;
            }

            // Determine overall health status
            healthCheck.status = this._determineHealthStatus(healthCheck);

            return healthCheck;

        } catch (error) {
            console.error('Feed Automation: Error monitoring feed health:', error);
            return {
                timestamp: new Date().toISOString(),
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Get automation statistics
     */
    getStatistics() {
        return {
            isRunning: this.isRunning,
            lastUpdateTime: this.lastUpdateTime,
            updateCount: this.updateCount,
            errorCount: this.errorCount,
            metrics: { ...this.metrics },
            errorRate: this.errorCount / Math.max(this.updateCount, 1),
            intervals: {
                feedUpdate: this.feedUpdateInterval,
                availabilityUpdate: this.availabilityUpdateInterval
            },
            configuration: {
                maxRetries: this.maxRetries,
                retryDelay: this.retryDelay,
                merchantCenterConfigured: !!this.merchantCenterEndpoint,
                customEndpointConfigured: !!this.feedSubmissionUrl
            }
        };
    }

    /**
     * Perform scheduled feed update
     * @private
     */
    async _performFeedUpdate(options = {}) {
        if (!this.isRunning) {
            return;
        }

        try {
            console.log('Feed Automation: Performing scheduled feed update');

            const result = await this.updateProductFeed({
                includeAvailability: true,
                daysAhead: 30,
                ...options
            });

            this.lastUpdateTime = new Date().toISOString();
            this.updateCount++;

            if (!result.success) {
                this.errorCount++;
                this.lastError = result.error;
            } else {
                this.lastError = null;
            }

            return result;

        } catch (error) {
            console.error('Feed Automation: Error in scheduled update:', error);
            this.errorCount++;
            this.lastError = error.message;
            this._logError(error, { type: 'scheduled_update' });
        }
    }

    /**
     * Perform availability update (more frequent, lighter operation)
     * @private
     */
    async _performAvailabilityUpdate() {
        if (!this.isRunning) {
            return;
        }

        try {
            // Refresh availability for next few days
            const today = new Date();
            const promises = [];

            for (let i = 0; i < 7; i++) { // Next 7 days
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dateString = date.toISOString().split('T')[0];
                promises.push(refreshAvailabilityForDate(dateString));
            }

            await Promise.all(promises);
            console.log('Feed Automation: Availability data refreshed');

        } catch (error) {
            console.error('Feed Automation: Error refreshing availability:', error);
            this._logError(error, { type: 'availability_update' });
        }
    }

    /**
     * Generate feed with validation
     * @private
     */
    async _generateFeedWithValidation(options = {}) {
        // Generate feed
        const feedData = await productFeedService.generateJSONFeed(options);

        // Validate feed
        const validation = productFeedService.validateFeed(feedData.products);

        if (!validation.valid) {
            throw new Error(`Feed validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
            console.warn('Feed Automation: Feed validation warnings:', validation.warnings);
        }

        return feedData;
    }

    /**
     * Submit feed to Google Merchant Center
     * @private
     */
    async _submitFeedToMerchantCenter(feedData, options = {}) {
        // This would integrate with Google Merchant Center API
        // For now, return success simulation
        console.log('Feed Automation: Simulating Merchant Center submission');

        return {
            success: true,
            submissionId: `feed_${Date.now()}`,
            productCount: feedData.products?.length || 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Submit to Merchant Center API
     * @private
     */
    async _submitToMerchantCenter(feedData, options = {}) {
        if (!this.merchantCenterEndpoint) {
            throw new Error('Merchant Center endpoint not configured');
        }

        // Convert to XML format for Merchant Center
        const xmlFeed = await productFeedService.generateXMLFeed(options);

        // Submit to Merchant Center (placeholder implementation)
        return {
            success: true,
            endpoint: this.merchantCenterEndpoint,
            format: 'xml',
            size: xmlFeed ? xmlFeed.length : 0
        };
    }

    /**
     * Submit to custom endpoint
     * @private
     */
    async _submitToCustomEndpoint(feedData, options = {}) {
        if (!this.feedSubmissionUrl) {
            throw new Error('Custom feed endpoint not configured');
        }

        try {
            const response = await fetch(this.feedSubmissionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_FEED_API_TOKEN || ''}`
                },
                body: JSON.stringify(feedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                response: result,
                status: response.status
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Save feed locally
     * @private
     */
    async _saveFeedLocally(feedData, options = {}) {
        try {
            // Save to localStorage (in a real app, this might be a file system or database)
            const feedKey = `product_feed_${new Date().toISOString().split('T')[0]}`;
            const feedString = JSON.stringify(feedData, null, 2);

            localStorage.setItem(feedKey, feedString);
            localStorage.setItem('latest_product_feed', feedString);

            return {
                success: true,
                key: feedKey,
                size: feedString.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update success metrics
     * @private
     */
    _updateSuccessMetrics(duration) {
        this.metrics.totalUpdates++;
        this.metrics.successfulUpdates++;
        this.metrics.lastUpdateDuration = duration;

        // Update average duration
        this.metrics.averageUpdateTime =
            (this.metrics.averageUpdateTime * (this.metrics.totalUpdates - 1) + duration) /
            this.metrics.totalUpdates;
    }

    /**
     * Update failure metrics
     * @private
     */
    _updateFailureMetrics(duration) {
        this.metrics.totalUpdates++;
        this.metrics.failedUpdates++;
        this.metrics.lastUpdateDuration = duration;
    }

    /**
     * Log error with context
     * @private
     */
    _logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            context
        };

        this.errorLog.push(errorEntry);

        // Limit error log size
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
        }
    }

    /**
     * Determine health status
     * @private
     */
    _determineHealthStatus(healthCheck) {
        if (!healthCheck.tourDataAvailable) {
            return 'critical';
        }

        if (!healthCheck.feedGenerationWorking) {
            return 'critical';
        }

        if (healthCheck.errorRate > 0.5) {
            return 'warning';
        }

        if (!healthCheck.isRunning) {
            return 'stopped';
        }

        return 'healthy';
    }

    /**
     * Delay utility
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
const feedAutomationService = new FeedAutomationService();

export default feedAutomationService;
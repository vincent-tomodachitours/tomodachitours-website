/**
 * Data Validator Service
 * Validates all conversion and event tracking data before sending to analytics services
 * Requirements: 1.1, 2.2, 4.3
 */

import performanceMonitor, { ERROR_TYPES } from './performanceMonitor.js';

// Validation rules for different data types
const VALIDATION_RULES = {
    // Transaction/Purchase data validation
    transaction: {
        required: ['transactionId', 'value'],
        optional: ['currency', 'tourId', 'tourName', 'quantity', 'attribution'],
        types: {
            transactionId: 'string',
            value: 'number',
            currency: 'string',
            tourId: 'string',
            tourName: 'string',
            quantity: 'number',
            attribution: 'object'
        },
        constraints: {
            value: { min: 0, max: 1000000 },
            quantity: { min: 1, max: 50 },
            currency: { pattern: /^[A-Z]{3}$/ },
            transactionId: { minLength: 1, maxLength: 100 }
        }
    },

    // Tour data validation
    tour: {
        required: ['tourId'],
        optional: ['tourName', 'price', 'tour_category', 'tour_location', 'tour_duration', 'attribution'],
        types: {
            tourId: 'string',
            tourName: 'string',
            price: 'number',
            tour_category: 'string',
            tour_location: 'string',
            tour_duration: 'string',
            attribution: 'object'
        },
        constraints: {
            price: { min: 0, max: 1000000 },
            tourId: { pattern: /^[a-z-]+$/ },
            tour_category: { enum: ['Cultural', 'Nature', 'Adventure', 'Food', 'Tour'] },
            tour_location: { enum: ['Gion', 'Arashiyama', 'Fushimi', 'Uji', 'Kyoto'] }
        }
    },

    // Attribution data validation
    attribution: {
        required: [],
        optional: ['source', 'medium', 'campaign', 'term', 'content', 'gclid', 'session_id', 'attribution_chain'],
        types: {
            source: 'string',
            medium: 'string',
            campaign: 'string',
            term: 'string',
            content: 'string',
            gclid: 'string',
            session_id: 'string',
            attribution_chain: 'array'
        },
        constraints: {
            source: { maxLength: 100 },
            medium: { maxLength: 100 },
            campaign: { maxLength: 100 },
            gclid: { pattern: /^[A-Za-z0-9_-]+$/ },
            session_id: { pattern: /^session_[0-9]+_[a-z0-9]+$/ }
        }
    },

    // Google Ads conversion data validation
    googleAdsConversion: {
        required: ['send_to'],
        optional: ['value', 'currency', 'transaction_id', 'tour_id', 'tour_name', 'attribution_source', 'gclid'],
        types: {
            send_to: 'string',
            value: 'number',
            currency: 'string',
            transaction_id: 'string',
            tour_id: 'string',
            tour_name: 'string',
            attribution_source: 'string',
            gclid: 'string'
        },
        constraints: {
            send_to: { pattern: /^AW-[0-9]+\/[A-Za-z0-9_-]+$/ },
            value: { min: 0, max: 1000000 },
            currency: { pattern: /^[A-Z]{3}$/ },
            transaction_id: { minLength: 1, maxLength: 100 }
        }
    },

    // Enhanced conversion data validation
    enhancedConversion: {
        required: [],
        optional: ['email', 'phone_number', 'first_name', 'last_name', 'street', 'city', 'region', 'postal_code', 'country'],
        types: {
            email: 'string',
            phone_number: 'string',
            first_name: 'string',
            last_name: 'string',
            street: 'string',
            city: 'string',
            region: 'string',
            postal_code: 'string',
            country: 'string'
        },
        constraints: {
            email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
            phone_number: { pattern: /^\+?[1-9]\d{1,14}$/ },
            country: { pattern: /^[A-Z]{2}$/ },
            postal_code: { maxLength: 20 }
        }
    },

    // Event data validation (for GA4 events)
    event: {
        required: ['event_name'],
        optional: ['event_parameters', 'user_properties', 'custom_parameters'],
        types: {
            event_name: 'string',
            event_parameters: 'object',
            user_properties: 'object',
            custom_parameters: 'object'
        },
        constraints: {
            event_name: {
                pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                maxLength: 40,
                reserved: ['ad_click', 'ad_exposure', 'ad_impression', 'ad_query', 'adunit_exposure']
            }
        }
    }
};

// Sanitization rules
const SANITIZATION_RULES = {
    // Remove potentially harmful characters
    removeHarmfulChars: /[<>"'&]/g,
    // Normalize whitespace
    normalizeWhitespace: /\s+/g,
    // Remove control characters
    // eslint-disable-next-line no-control-regex
    removeControlChars: /[\x00-\x1F\x7F]/g
};

class DataValidator {
    constructor() {
        this.validationCache = new Map();
        this.validationStats = {
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            sanitizedFields: 0
        };
    }

    /**
     * Validate transaction data
     * @param {Object} transactionData - Transaction data to validate
     * @returns {Object} Validation result with sanitized data
     */
    validateTransaction(transactionData) {
        const startTime = performance.now();

        try {
            const result = this.validateData(transactionData, 'transaction');
            this.recordValidationTime('transaction', performance.now() - startTime);
            return result;
        } catch (error) {
            this.handleValidationError('transaction', error, transactionData);
            throw error;
        }
    }

    /**
     * Validate tour data
     * @param {Object} tourData - Tour data to validate
     * @returns {Object} Validation result with sanitized data
     */
    validateTour(tourData) {
        const startTime = performance.now();

        try {
            const result = this.validateData(tourData, 'tour');
            this.recordValidationTime('tour', performance.now() - startTime);
            return result;
        } catch (error) {
            this.handleValidationError('tour', error, tourData);
            throw error;
        }
    }

    /**
     * Validate attribution data
     * @param {Object} attributionData - Attribution data to validate
     * @returns {Object} Validation result with sanitized data
     */
    validateAttribution(attributionData) {
        const startTime = performance.now();

        try {
            const result = this.validateData(attributionData, 'attribution');
            this.recordValidationTime('attribution', performance.now() - startTime);
            return result;
        } catch (error) {
            this.handleValidationError('attribution', error, attributionData);
            throw error;
        }
    }

    /**
     * Validate Google Ads conversion data
     * @param {Object} conversionData - Google Ads conversion data to validate
     * @returns {Object} Validation result with sanitized data
     */
    validateGoogleAdsConversion(conversionData) {
        const startTime = performance.now();

        try {
            const result = this.validateData(conversionData, 'googleAdsConversion');
            this.recordValidationTime('googleAdsConversion', performance.now() - startTime);
            return result;
        } catch (error) {
            this.handleValidationError('googleAdsConversion', error, conversionData);
            throw error;
        }
    }

    /**
     * Validate enhanced conversion data
     * @param {Object} enhancedData - Enhanced conversion data to validate
     * @returns {Object} Validation result with sanitized data
     */
    validateEnhancedConversion(enhancedData) {
        const startTime = performance.now();

        try {
            const result = this.validateData(enhancedData, 'enhancedConversion');
            this.recordValidationTime('enhancedConversion', performance.now() - startTime);
            return result;
        } catch (error) {
            this.handleValidationError('enhancedConversion', error, enhancedData);
            throw error;
        }
    }

    /**
     * Validate event data
     * @param {Object} eventData - Event data to validate
     * @returns {Object} Validation result with sanitized data
     */
    validateEvent(eventData) {
        const startTime = performance.now();

        try {
            const result = this.validateData(eventData, 'event');
            this.recordValidationTime('event', performance.now() - startTime);
            return result;
        } catch (error) {
            this.handleValidationError('event', error, eventData);
            throw error;
        }
    }

    /**
     * Generic data validation method
     * @param {Object} data - Data to validate
     * @param {string} dataType - Type of data (must match VALIDATION_RULES key)
     * @returns {Object} Validation result
     */
    validateData(data, dataType) {
        this.validationStats.totalValidations++;

        if (!data || typeof data !== 'object') {
            throw new ValidationError(`Invalid data: expected object, got ${typeof data}`);
        }

        const rules = VALIDATION_RULES[dataType];
        if (!rules) {
            throw new ValidationError(`Unknown data type: ${dataType}`);
        }

        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitizedData: {},
            originalData: { ...data }
        };

        // Check required fields
        for (const field of rules.required) {
            if (!(field in data) || data[field] === null || data[field] === undefined) {
                result.errors.push(`Required field missing: ${field}`);
                result.isValid = false;
            }
        }

        // Validate and sanitize each field
        const allFields = [...rules.required, ...rules.optional];
        for (const field of allFields) {
            if (field in data) {
                try {
                    const validatedValue = this.validateField(field, data[field], rules, dataType);
                    result.sanitizedData[field] = validatedValue;
                } catch (error) {
                    result.errors.push(`Field '${field}': ${error.message}`);
                    result.isValid = false;
                }
            }
        }

        // Check for unexpected fields
        for (const field in data) {
            if (!allFields.includes(field)) {
                result.warnings.push(`Unexpected field: ${field}`);
                // Include unexpected fields in sanitized data but mark as warning
                result.sanitizedData[field] = this.sanitizeValue(data[field]);
            }
        }

        if (result.isValid) {
            this.validationStats.successfulValidations++;
        } else {
            this.validationStats.failedValidations++;
        }

        return result;
    }

    /**
     * Validate individual field
     * @param {string} fieldName - Name of the field
     * @param {*} value - Value to validate
     * @param {Object} rules - Validation rules
     * @param {string} dataType - Data type being validated
     * @returns {*} Sanitized value
     */
    validateField(fieldName, value, rules, dataType) {
        // Type validation
        if (rules.types && rules.types[fieldName]) {
            const expectedType = rules.types[fieldName];
            if (!this.isValidType(value, expectedType)) {
                throw new ValidationError(`Expected ${expectedType}, got ${typeof value}`);
            }
        }

        // Sanitize value
        const sanitizedValue = this.sanitizeValue(value);

        // Constraint validation
        if (rules.constraints && rules.constraints[fieldName]) {
            this.validateConstraints(fieldName, sanitizedValue, rules.constraints[fieldName]);
        }

        return sanitizedValue;
    }

    /**
     * Check if value matches expected type
     * @param {*} value - Value to check
     * @param {string} expectedType - Expected type
     * @returns {boolean} True if type matches
     */
    isValidType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array':
                return Array.isArray(value);
            default:
                return false;
        }
    }

    /**
     * Validate field constraints
     * @param {string} fieldName - Field name
     * @param {*} value - Value to validate
     * @param {Object} constraints - Constraints to apply
     */
    validateConstraints(fieldName, value, constraints) {
        // Numeric constraints
        if (typeof value === 'number') {
            if (constraints.min !== undefined && value < constraints.min) {
                throw new ValidationError(`Value ${value} is below minimum ${constraints.min}`);
            }
            if (constraints.max !== undefined && value > constraints.max) {
                throw new ValidationError(`Value ${value} is above maximum ${constraints.max}`);
            }
        }

        // String constraints
        if (typeof value === 'string') {
            if (constraints.minLength !== undefined && value.length < constraints.minLength) {
                throw new ValidationError(`String length ${value.length} is below minimum ${constraints.minLength}`);
            }
            if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
                throw new ValidationError(`String length ${value.length} is above maximum ${constraints.maxLength}`);
            }
            if (constraints.pattern && !constraints.pattern.test(value)) {
                throw new ValidationError(`Value does not match required pattern`);
            }
            if (constraints.enum && !constraints.enum.includes(value)) {
                throw new ValidationError(`Value '${value}' is not in allowed values: ${constraints.enum.join(', ')}`);
            }
            if (constraints.reserved && constraints.reserved.includes(value)) {
                throw new ValidationError(`Value '${value}' is reserved and cannot be used`);
            }
        }

        // Array constraints
        if (Array.isArray(value)) {
            if (constraints.maxItems !== undefined && value.length > constraints.maxItems) {
                throw new ValidationError(`Array length ${value.length} exceeds maximum ${constraints.maxItems}`);
            }
            if (constraints.minItems !== undefined && value.length < constraints.minItems) {
                throw new ValidationError(`Array length ${value.length} is below minimum ${constraints.minItems}`);
            }
        }
    }

    /**
     * Sanitize value to remove harmful content
     * @param {*} value - Value to sanitize
     * @returns {*} Sanitized value
     */
    sanitizeValue(value) {
        if (typeof value === 'string') {
            this.validationStats.sanitizedFields++;

            // Remove harmful characters
            let sanitized = value.replace(SANITIZATION_RULES.removeHarmfulChars, '');

            // Remove control characters
            sanitized = sanitized.replace(SANITIZATION_RULES.removeControlChars, '');

            // Normalize whitespace
            sanitized = sanitized.replace(SANITIZATION_RULES.normalizeWhitespace, ' ').trim();

            return sanitized;
        }

        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeValue(item));
        }

        if (typeof value === 'object' && value !== null) {
            const sanitized = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[this.sanitizeValue(key)] = this.sanitizeValue(val);
            }
            return sanitized;
        }

        return value;
    }

    /**
     * Handle validation errors
     * @param {string} dataType - Type of data that failed validation
     * @param {Error} error - Validation error
     * @param {Object} originalData - Original data that failed validation
     */
    handleValidationError(dataType, error, originalData) {
        performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
            dataType: dataType,
            error: error.message,
            originalData: originalData,
            validationStats: this.validationStats
        });
    }

    /**
     * Record validation performance time
     * @param {string} dataType - Type of data validated
     * @param {number} validationTime - Time taken for validation
     */
    recordValidationTime(dataType, validationTime) {
        performanceMonitor.recordMetric('validation_time', {
            dataType: dataType,
            validationTime: validationTime,
            timestamp: Date.now()
        });

        // Alert on slow validations
        if (validationTime > 100) {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                dataType: dataType,
                validationTime: validationTime,
                message: 'Slow validation detected'
            });
        }
    }

    /**
     * Validate multiple data objects in batch
     * @param {Array} dataArray - Array of data objects to validate
     * @param {string} dataType - Type of data
     * @returns {Array} Array of validation results
     */
    validateBatch(dataArray, dataType) {
        if (!Array.isArray(dataArray)) {
            throw new ValidationError('Expected array for batch validation');
        }

        const results = [];
        const startTime = performance.now();

        for (let i = 0; i < dataArray.length; i++) {
            try {
                const result = this.validateData(dataArray[i], dataType);
                result.index = i;
                results.push(result);
            } catch (error) {
                results.push({
                    index: i,
                    isValid: false,
                    errors: [error.message],
                    warnings: [],
                    sanitizedData: null,
                    originalData: dataArray[i]
                });
            }
        }

        const totalTime = performance.now() - startTime;
        this.recordValidationTime(`${dataType}_batch`, totalTime);

        return results;
    }

    /**
     * Get validation statistics
     * @returns {Object} Validation statistics
     */
    getValidationStats() {
        return {
            ...this.validationStats,
            successRate: this.validationStats.totalValidations > 0
                ? this.validationStats.successfulValidations / this.validationStats.totalValidations
                : 0,
            errorRate: this.validationStats.totalValidations > 0
                ? this.validationStats.failedValidations / this.validationStats.totalValidations
                : 0
        };
    }

    /**
     * Reset validation statistics
     */
    resetStats() {
        this.validationStats = {
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            sanitizedFields: 0
        };
    }

    /**
     * Add custom validation rule
     * @param {string} dataType - Data type to add rule for
     * @param {Object} rule - Validation rule to add
     */
    addValidationRule(dataType, rule) {
        if (!VALIDATION_RULES[dataType]) {
            VALIDATION_RULES[dataType] = {
                required: [],
                optional: [],
                types: {},
                constraints: {}
            };
        }

        // Merge the new rule with existing rules
        const existingRule = VALIDATION_RULES[dataType];
        VALIDATION_RULES[dataType] = {
            required: [...existingRule.required, ...(rule.required || [])],
            optional: [...existingRule.optional, ...(rule.optional || [])],
            types: { ...existingRule.types, ...(rule.types || {}) },
            constraints: { ...existingRule.constraints, ...(rule.constraints || {}) }
        };

        console.log(`Added validation rule for data type: ${dataType}`);
    }

    /**
     * Clear validation cache
     */
    clearCache() {
        this.validationCache.clear();
        console.log('Validation cache cleared');
    }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Create singleton instance
const dataValidator = new DataValidator();

export default dataValidator;
export { ValidationError };
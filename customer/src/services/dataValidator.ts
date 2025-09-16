/**
 * Data Validator Service
 * Validates all conversion and event tracking data before sending to analytics services
 * Requirements: 1.1, 2.2, 4.3
 */

import performanceMonitor, { ERROR_TYPES } from './performanceMonitor';

// Type definitions
interface ValidationRule {
    required: string[];
    optional: string[];
    types: Record<string, string>;
    constraints: Record<string, any>;
}

interface ValidationConstraint {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
    reserved?: string[];
    maxItems?: number;
    minItems?: number;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedData: any;
    originalData: any;
}

interface ValidationStats {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    sanitizedFields: number;
}

interface BatchValidationResult extends ValidationResult {
    index: number;
}

// Validation rules for different data types
const VALIDATION_RULES: Record<string, ValidationRule> = {
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
    private validationCache: Map<string, any>;
    private validationStats: ValidationStats;

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
     */
    validateTransaction(transactionData: any): ValidationResult {
        const startTime = performance.now();

        try {
            const result = this.validateData(transactionData, 'transaction');
            this.recordValidationTime('transaction', performance.now() - startTime);
            return result;
        } catch (error: any) {
            this.handleValidationError('transaction', error, transactionData);
            throw error;
        }
    }

    /**
     * Validate tour data
     */
    validateTour(tourData: any): ValidationResult {
        const startTime = performance.now();

        try {
            const result = this.validateData(tourData, 'tour');
            this.recordValidationTime('tour', performance.now() - startTime);
            return result;
        } catch (error: any) {
            this.handleValidationError('tour', error, tourData);
            throw error;
        }
    }

    /**
     * Validate attribution data
     */
    validateAttribution(attributionData: any): ValidationResult {
        const startTime = performance.now();

        try {
            const result = this.validateData(attributionData, 'attribution');
            this.recordValidationTime('attribution', performance.now() - startTime);
            return result;
        } catch (error: any) {
            this.handleValidationError('attribution', error, attributionData);
            throw error;
        }
    }

    /**
     * Validate Google Ads conversion data
     */
    validateGoogleAdsConversion(conversionData: any): ValidationResult {
        const startTime = performance.now();

        try {
            const result = this.validateData(conversionData, 'googleAdsConversion');
            this.recordValidationTime('googleAdsConversion', performance.now() - startTime);
            return result;
        } catch (error: any) {
            this.handleValidationError('googleAdsConversion', error, conversionData);
            throw error;
        }
    }

    /**
     * Validate enhanced conversion data
     */
    validateEnhancedConversion(enhancedData: any): ValidationResult {
        const startTime = performance.now();

        try {
            const result = this.validateData(enhancedData, 'enhancedConversion');
            this.recordValidationTime('enhancedConversion', performance.now() - startTime);
            return result;
        } catch (error: any) {
            this.handleValidationError('enhancedConversion', error, enhancedData);
            throw error;
        }
    }

    /**
     * Validate event data
     */
    validateEvent(eventData: any): ValidationResult {
        const startTime = performance.now();

        try {
            const result = this.validateData(eventData, 'event');
            this.recordValidationTime('event', performance.now() - startTime);
            return result;
        } catch (error: any) {
            this.handleValidationError('event', error, eventData);
            throw error;
        }
    }

    /**
     * Generic data validation method
     */
    validateData(data: any, dataType: string): ValidationResult {
        this.validationStats.totalValidations++;

        if (!data || typeof data !== 'object') {
            throw new ValidationError(`Invalid data: expected object, got ${typeof data}`);
        }

        const rules = VALIDATION_RULES[dataType];
        if (!rules) {
            throw new ValidationError(`Unknown data type: ${dataType}`);
        }

        const result: ValidationResult = {
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
                } catch (error: any) {
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
     */
    validateField(fieldName: string, value: any, rules: ValidationRule, _dataType: string): any {
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
     */
    isValidType(value: any, expectedType: string): boolean {
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
     */
    validateConstraints(_fieldName: string, value: any, constraints: ValidationConstraint): void {
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
     */
    sanitizeValue(value: any): any {
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
            const sanitized: any = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[this.sanitizeValue(key)] = this.sanitizeValue(val);
            }
            return sanitized;
        }

        return value;
    }

    /**
     * Handle validation errors
     */
    handleValidationError(dataType: string, error: Error, originalData: any): void {
        performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
            dataType: dataType,
            error: error.message,
            originalData: originalData,
            validationStats: this.validationStats
        });
    }

    /**
     * Record validation performance time
     */
    recordValidationTime(dataType: string, validationTime: number): void {
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
     */
    validateBatch(dataArray: any[], dataType: string): BatchValidationResult[] {
        if (!Array.isArray(dataArray)) {
            throw new ValidationError('Expected array for batch validation');
        }

        const results: BatchValidationResult[] = [];
        const startTime = performance.now();

        for (let i = 0; i < dataArray.length; i++) {
            try {
                const result = this.validateData(dataArray[i], dataType);
                results.push({
                    ...result,
                    index: i
                });
            } catch (error: any) {
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
     */
    getValidationStats(): ValidationStats & { successRate: number; errorRate: number } {
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
    resetStats(): void {
        this.validationStats = {
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            sanitizedFields: 0
        };
    }

    /**
     * Add custom validation rule
     */
    addValidationRule(dataType: string, rule: Partial<ValidationRule>): void {
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
    clearCache(): void {
        this.validationCache.clear();
        console.log('Validation cache cleared');
    }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Create singleton instance
const dataValidator = new DataValidator();

export default dataValidator;
export { ValidationError };
export type { ValidationResult, ValidationStats, BatchValidationResult };
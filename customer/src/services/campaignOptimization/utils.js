// Campaign Optimization Utilities
// Shared utility functions for campaign optimization

/**
 * Calculate standard deviation of an array of values
 * @param {Array} values - Array of numeric values
 * @returns {number} Standard deviation
 */
export function calculateStandardDeviation(values) {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate confidence score based on data quality
 * @param {Object} data - Campaign data
 * @returns {number} Confidence score (0-1)
 */
export function calculateConfidenceScore(data) {
    const thresholds = {
        minConversions: 10,
        minImpressions: 1000
    };

    let score = 0;

    // Data volume score (40%)
    const conversions = data.conversions || 0;
    const impressions = data.impressions || 0;

    if (conversions >= thresholds.minConversions) score += 0.2;
    if (conversions >= thresholds.minConversions * 2) score += 0.1;
    if (impressions >= thresholds.minImpressions) score += 0.1;

    // Data recency score (30%)
    const dataAge = data.lastUpdated ?
        (Date.now() - new Date(data.lastUpdated).getTime()) / (1000 * 60 * 60 * 24) : 30;

    if (dataAge <= 7) score += 0.3;
    else if (dataAge <= 14) score += 0.2;
    else if (dataAge <= 30) score += 0.1;

    // Data completeness score (30%)
    const requiredFields = ['impressions', 'clicks', 'conversions', 'cost', 'conversionValue'];
    const presentFields = requiredFields.filter(field => data[field] !== undefined).length;
    score += (presentFields / requiredFields.length) * 0.3;

    return Math.min(score, 1);
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Original value
 * @param {number} newValue - New value
 * @returns {number} Percentage change
 */
export function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format currency value for display
 * @param {number} value - Numeric value
 * @param {string} currency - Currency code (default: JPY)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'JPY') {
    if (currency === 'JPY') {
        return `¥${value.toLocaleString()}`;
    }
    return `${value.toLocaleString()} ${currency}`;
}

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate ROAS (Return on Ad Spend)
 * @param {number} revenue - Revenue generated
 * @param {number} cost - Cost of advertising
 * @returns {number} ROAS ratio
 */
export function calculateROAS(revenue, cost) {
    if (cost === 0) return 0;
    return revenue / cost;
}

/**
 * Calculate ROI (Return on Investment)
 * @param {number} revenue - Revenue generated
 * @param {number} cost - Cost of advertising
 * @returns {number} ROI percentage
 */
export function calculateROI(revenue, cost) {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
}

/**
 * Calculate conversion rate
 * @param {number} conversions - Number of conversions
 * @param {number} clicks - Number of clicks
 * @returns {number} Conversion rate percentage
 */
export function calculateConversionRate(conversions, clicks) {
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
}

/**
 * Calculate cost per conversion
 * @param {number} cost - Total cost
 * @param {number} conversions - Number of conversions
 * @returns {number} Cost per conversion
 */
export function calculateCostPerConversion(cost, conversions) {
    if (conversions === 0) return 0;
    return cost / conversions;
}

/**
 * Calculate click-through rate
 * @param {number} clicks - Number of clicks
 * @param {number} impressions - Number of impressions
 * @returns {number} CTR percentage
 */
export function calculateCTR(clicks, impressions) {
    if (impressions === 0) return 0;
    return (clicks / impressions) * 100;
}

/**
 * Determine priority level based on impact and urgency
 * @param {number} impact - Impact score (0-100)
 * @param {number} urgency - Urgency score (0-100)
 * @returns {string} Priority level
 */
export function determinePriority(impact, urgency) {
    const score = (impact + urgency) / 2;

    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

/**
 * Validate campaign data completeness
 * @param {Object} data - Campaign data
 * @returns {Object} Validation result
 */
export function validateCampaignData(data) {
    const requiredFields = ['campaignId', 'impressions', 'clicks', 'cost'];
    const optionalFields = ['conversions', 'conversionValue', 'keywords', 'audienceData'];

    const validation = {
        isValid: true,
        missingRequired: [],
        missingOptional: [],
        completeness: 0
    };

    // Check required fields
    requiredFields.forEach(field => {
        if (!data[field] && data[field] !== 0) {
            validation.missingRequired.push(field);
            validation.isValid = false;
        }
    });

    // Check optional fields
    optionalFields.forEach(field => {
        if (!data[field] && data[field] !== 0) {
            validation.missingOptional.push(field);
        }
    });

    // Calculate completeness
    const totalFields = requiredFields.length + optionalFields.length;
    const presentFields = totalFields - validation.missingRequired.length - validation.missingOptional.length;
    validation.completeness = (presentFields / totalFields) * 100;

    return validation;
}

/**
 * Generate unique optimization ID
 * @param {string} campaignId - Campaign ID
 * @param {string} type - Optimization type
 * @returns {string} Unique optimization ID
 */
export function generateOptimizationId(campaignId, type) {
    const timestamp = Date.now();
    return `${campaignId}_${type}_${timestamp}`;
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));

    const cloned = {};
    Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
    });

    return cloned;
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;

    return function (...args) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
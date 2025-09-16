// Campaign Optimization Utilities
// Shared utility functions for campaign optimization

export interface CampaignData {
    campaignId?: string;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    conversionValue?: number;
    keywords?: any[];
    audienceData?: any;
    lastUpdated?: string;
}

export interface ValidationResult {
    isValid: boolean;
    missingRequired: string[];
    missingOptional: string[];
    completeness: number;
}

/**
 * Calculate standard deviation of an array of values
 */
export function calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate confidence score based on data quality
 */
export function calculateConfidenceScore(data: CampaignData): number {
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
    const requiredFields: (keyof CampaignData)[] = ['impressions', 'clicks', 'conversions', 'cost', 'conversionValue'];
    const presentFields = requiredFields.filter(field => data[field] !== undefined).length;
    score += (presentFields / requiredFields.length) * 0.3;

    return Math.min(score, 1);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number, currency: string = 'JPY'): string {
    if (currency === 'JPY') {
        return `¥${value.toLocaleString()}`;
    }
    return `${value.toLocaleString()} ${currency}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate ROAS (Return on Ad Spend)
 */
export function calculateROAS(revenue: number, cost: number): number {
    if (cost === 0) return 0;
    return revenue / cost;
}

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(revenue: number, cost: number): number {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(conversions: number, clicks: number): number {
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
}

/**
 * Calculate cost per conversion
 */
export function calculateCostPerConversion(cost: number, conversions: number): number {
    if (conversions === 0) return 0;
    return cost / conversions;
}

/**
 * Calculate click-through rate
 */
export function calculateCTR(clicks: number, impressions: number): number {
    if (impressions === 0) return 0;
    return (clicks / impressions) * 100;
}

/**
 * Determine priority level based on impact and urgency
 */
export function determinePriority(impact: number, urgency: number): 'critical' | 'high' | 'medium' | 'low' {
    const score = (impact + urgency) / 2;

    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

/**
 * Validate campaign data completeness
 */
export function validateCampaignData(data: CampaignData): ValidationResult {
    const requiredFields: (keyof CampaignData)[] = ['campaignId', 'impressions', 'clicks', 'cost'];
    const optionalFields: (keyof CampaignData)[] = ['conversions', 'conversionValue', 'keywords', 'audienceData'];

    const validation: ValidationResult = {
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
 */
export function generateOptimizationId(campaignId: string, type: string): string {
    const timestamp = Date.now();
    return `${campaignId}_${type}_${timestamp}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;

    const cloned = {} as T;
    Object.keys(obj as any).forEach(key => {
        (cloned as any)[key] = deepClone((obj as any)[key]);
    });

    return cloned;
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | undefined;
    let lastExecTime = 0;

    return ((...args: Parameters<T>) => {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
            func.apply(null, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(null, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    }) as T;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | undefined;

    return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
}
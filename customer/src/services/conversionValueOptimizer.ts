/**
 * Conversion Value Optimizer Service
 * 
 * Handles dynamic pricing with discounts for accurate conversion value tracking.
 * Ensures proper value attribution for Target ROAS campaigns and revenue reporting.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

interface PriceData {
    basePrice: number;
    quantity?: number;
    currency?: string;
}

interface DiscountData {
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscountAmount?: number;
}

interface PricingOptions {
    pricingRules?: PricingRule[];
}

interface PricingRule {
    type: 'minimum' | 'maximum' | 'round';
    value: number;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    correctedValue: number;
}

interface PricingBreakdown {
    basePrice: number;
    quantity: number;
    originalTotal: number;
    discountAmount: number;
    discountPercentage: number;
    finalPrice: number;
    currency: string;
    pricingId: string;
    calculatedAt: string;
    validationPassed: boolean;
    roasValue: number;
    roasCategory: string;
    profitMargin: number;
}

interface PricingResult {
    success: boolean;
    pricing: PricingBreakdown | null;
    validation: ValidationResult;
    error?: string;
}

interface ConversionData {
    conversionId?: string;
    campaign?: string;
    adGroup?: string;
    keyword?: string;
    gclid?: string;
    productId?: string;
    productName?: string;
    productCategory?: string;
    isRepeatCustomer?: boolean;
    conversionValue?: number;
    targetROAS?: {
        minValue?: number;
    };
}

interface AttributionRecord {
    conversionId: string;
    timestamp: string;
    revenue: number;
    originalRevenue: number;
    discountAmount: number;
    campaign: string;
    adGroup: string;
    keyword: string;
    gclid: string;
    productId: string;
    productName: string;
    productCategory: string;
    customerSegment: string;
    profitMargin: number;
    roasValue: number;
}

interface AttributionResult {
    success: boolean;
    attributionId?: string;
    record?: AttributionRecord;
    error?: string;
    reason?: string;
}

interface ReportFilters {
    dateFrom?: string;
    dateTo?: string;
    campaign?: string;
    productCategory?: string;
}

interface ReportSummary {
    totalRevenue: number;
    totalConversions: number;
    averageOrderValue: number;
    totalDiscountAmount: number;
    averageDiscountPercentage: number;
}

interface CampaignData {
    campaign: string;
    revenue: number;
    conversions: number;
    averageOrderValue: number;
    roas: number;
}

interface KeywordData {
    campaign: string;
    keyword: string;
    revenue: number;
    conversions: number;
    averageOrderValue: number;
}

interface ProductData {
    productId: string;
    productName: string;
    productCategory: string;
    revenue: number;
    conversions: number;
    averageOrderValue: number;
}

interface ReportData {
    generatedAt: string;
    filters: ReportFilters;
    summary: ReportSummary;
    byCampaign: CampaignData[];
    byKeyword: KeywordData[];
    byProduct: ProductData[];
    trends: any[];
}

interface ValueReport {
    success: boolean;
    report?: ReportData;
    error?: string;
}

interface ROASData {
    conversionValue: number;
    currency: string;
    roasCategory: string;
    profitMargin: number;
    customerLifetimeValue: number;
    optimizationRecommendations: string[];
}

class ConversionValueOptimizer {
    private priceValidationEnabled: boolean;
    private valueTrackingEnabled: boolean;
    private roasOptimizationEnabled: boolean;
    private revenueAttributionEnabled: boolean;
    private minPrice: number;
    private maxPrice: number;
    private maxDiscountPercentage: number;
    private attributionData: Map<string, AttributionRecord>;

    constructor() {
        this.priceValidationEnabled = true;
        this.valueTrackingEnabled = true;
        this.roasOptimizationEnabled = process.env.REACT_APP_TARGET_ROAS_ENABLED === 'true';
        this.revenueAttributionEnabled = process.env.REACT_APP_REVENUE_ATTRIBUTION_ENABLED === 'true';

        // Price validation thresholds
        this.minPrice = 1000; // Minimum price in JPY
        this.maxPrice = 100000; // Maximum price in JPY
        this.maxDiscountPercentage = 90; // Maximum discount percentage allowed

        // Revenue attribution tracking
        this.attributionData = new Map();

        // Bind methods
        this.calculateDynamicPrice = this.calculateDynamicPrice.bind(this);
        this.validateConversionValue = this.validateConversionValue.bind(this);
        this.trackRevenueAttribution = this.trackRevenueAttribution.bind(this);
        this.generateValueReport = this.generateValueReport.bind(this);
    }

    /**
     * Calculate dynamic price with discounts applied
     */
    calculateDynamicPrice(priceData: PriceData, discountData: DiscountData | null = null, options: PricingOptions = {}): PricingResult {
        try {
            // Validate input data
            if (!priceData || typeof priceData.basePrice !== 'number') {
                throw new Error('Invalid base price data provided');
            }

            const basePrice = priceData.basePrice;
            const quantity = priceData.quantity || 1;
            const originalTotal = basePrice * quantity;

            let finalPrice = originalTotal;
            let discountAmount = 0;
            let discountPercentage = 0;

            // Apply discount if provided
            if (discountData && discountData.type && discountData.value) {
                const discountResult = this._applyDiscount(originalTotal, discountData);
                finalPrice = discountResult.finalPrice;
                discountAmount = discountResult.discountAmount;
                discountPercentage = discountResult.discountPercentage;
            }

            // Apply additional pricing rules if specified
            if (options.pricingRules) {
                finalPrice = this._applyPricingRules(finalPrice, options.pricingRules);
            }

            // Validate final price
            const validation = this.validateConversionValue(finalPrice, {
                originalPrice: originalTotal,
                discountAmount,
                discountPercentage
            });

            if (!validation.isValid) {
                console.warn('Price validation failed:', validation.errors);
                // Use fallback pricing if validation fails
                finalPrice = this._getFallbackPrice(originalTotal, discountAmount);
            }

            // Calculate pricing breakdown
            const pricingBreakdown: PricingBreakdown = {
                basePrice,
                quantity,
                originalTotal,
                discountAmount,
                discountPercentage,
                finalPrice,
                currency: priceData.currency || 'JPY',

                // Additional metadata for tracking
                pricingId: this._generatePricingId(),
                calculatedAt: new Date().toISOString(),
                validationPassed: validation.isValid,

                // Target ROAS optimization data (always include for testing)
                roasValue: finalPrice,
                roasCategory: this._categorizeROASValue(finalPrice),
                profitMargin: this._calculateProfitMargin(basePrice, finalPrice)
            };

            return {
                success: true,
                pricing: pricingBreakdown,
                validation
            };

        } catch (error: any) {
            console.error('Dynamic price calculation failed:', error);
            return {
                success: false,
                error: error.message,
                pricing: null,
                validation: { isValid: false, errors: [error.message], warnings: [], correctedValue: 0 }
            };
        }
    }

    /**
     * Validate conversion value for accuracy and compliance
     */
    validateConversionValue(conversionValue: number, context: any = {}): ValidationResult {
        const validation: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            correctedValue: conversionValue
        };

        // Basic value validation
        if (typeof conversionValue !== 'number' || isNaN(conversionValue)) {
            validation.isValid = false;
            validation.errors.push('Conversion value must be a valid number');
            return validation;
        }

        if (conversionValue < 0) {
            validation.isValid = false;
            validation.errors.push('Conversion value cannot be negative');
            return validation;
        }

        // Price range validation
        if (conversionValue < this.minPrice) {
            validation.warnings.push(`Conversion value ${conversionValue} is below minimum threshold ${this.minPrice}`);
            validation.correctedValue = this.minPrice;
        }

        if (conversionValue > this.maxPrice) {
            validation.warnings.push(`Conversion value ${conversionValue} exceeds maximum threshold ${this.maxPrice}`);
            validation.correctedValue = this.maxPrice;
        }

        // Discount validation
        if (context.discountPercentage && context.discountPercentage > this.maxDiscountPercentage) {
            validation.isValid = false;
            validation.errors.push(`Discount percentage ${context.discountPercentage}% exceeds maximum allowed ${this.maxDiscountPercentage}%`);
        }

        // Consistency validation
        if (context.originalPrice && context.discountAmount) {
            const expectedFinalPrice = context.originalPrice - context.discountAmount;
            const priceDifference = Math.abs(conversionValue - expectedFinalPrice);

            if (priceDifference > 1) { // Allow for rounding differences
                validation.warnings.push(`Price calculation inconsistency detected: expected ${expectedFinalPrice}, got ${conversionValue}`);
            }
        }

        // Target ROAS validation
        if (this.roasOptimizationEnabled && context.targetROAS) {
            const roasValidation = this._validateTargetROAS(conversionValue, context.targetROAS);
            if (!roasValidation.isValid) {
                validation.warnings.push(...roasValidation.warnings);
            }
        }

        return validation;
    }

    /**
     * Track revenue attribution by campaign and keyword
     */
    trackRevenueAttribution(conversionData: ConversionData, pricingData: PricingBreakdown): AttributionResult {
        if (!this.revenueAttributionEnabled) {
            return { success: false, reason: 'Revenue attribution disabled' };
        }

        try {
            // Validate input data
            if (!conversionData || typeof conversionData !== 'object') {
                throw new Error('Invalid conversion data provided');
            }

            if (!pricingData || typeof pricingData !== 'object' || typeof pricingData.finalPrice !== 'number') {
                throw new Error('Invalid pricing data provided');
            }

            const attributionKey = this._generateAttributionKey(conversionData);
            const attributionRecord: AttributionRecord = {
                conversionId: conversionData.conversionId || this._generateConversionId(),
                timestamp: new Date().toISOString(),

                // Revenue data
                revenue: pricingData.finalPrice,
                originalRevenue: pricingData.originalTotal || pricingData.finalPrice,
                discountAmount: pricingData.discountAmount || 0,

                // Attribution data
                campaign: conversionData.campaign || 'unknown',
                adGroup: conversionData.adGroup || 'unknown',
                keyword: conversionData.keyword || 'unknown',
                gclid: conversionData.gclid || '',

                // Product data
                productId: conversionData.productId || '',
                productName: conversionData.productName || '',
                productCategory: conversionData.productCategory || 'tour',

                // Customer data (anonymized)
                customerSegment: this._determineCustomerSegment(pricingData),

                // Performance metrics
                profitMargin: pricingData.profitMargin || 0,
                roasValue: pricingData.roasValue || pricingData.finalPrice
            };

            // Store attribution data
            this.attributionData.set(attributionKey, attributionRecord);

            // Send to analytics if configured
            this._sendAttributionToAnalytics(attributionRecord);

            return {
                success: true,
                attributionId: attributionKey,
                record: attributionRecord
            };

        } catch (error: any) {
            console.error('Revenue attribution tracking failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate comprehensive value and attribution report
     */
    generateValueReport(filters: ReportFilters = {}): ValueReport {
        try {
            const reportData: ReportData = {
                generatedAt: new Date().toISOString(),
                filters,
                summary: {
                    totalRevenue: 0,
                    totalConversions: 0,
                    averageOrderValue: 0,
                    totalDiscountAmount: 0,
                    averageDiscountPercentage: 0
                },
                byCampaign: [],
                byKeyword: [],
                byProduct: [],
                trends: []
            };

            const byCampaignMap = new Map<string, CampaignData>();
            const byKeywordMap = new Map<string, KeywordData>();
            const byProductMap = new Map<string, ProductData>();

            // Process attribution data
            for (const [, record] of Array.from(this.attributionData.entries())) {
                // Apply filters
                if (!this._matchesFilters(record, filters)) {
                    continue;
                }

                // Update summary
                reportData.summary.totalRevenue += record.revenue;
                reportData.summary.totalConversions += 1;
                reportData.summary.totalDiscountAmount += record.discountAmount;

                // Group by campaign
                const campaignKey = record.campaign;
                if (!byCampaignMap.has(campaignKey)) {
                    byCampaignMap.set(campaignKey, {
                        campaign: campaignKey,
                        revenue: 0,
                        conversions: 0,
                        averageOrderValue: 0,
                        roas: 0
                    });
                }
                const campaignData = byCampaignMap.get(campaignKey)!;
                campaignData.revenue += record.revenue;
                campaignData.conversions += 1;
                campaignData.averageOrderValue = campaignData.revenue / campaignData.conversions;

                // Group by keyword
                const keywordKey = `${record.campaign}:${record.keyword}`;
                if (!byKeywordMap.has(keywordKey)) {
                    byKeywordMap.set(keywordKey, {
                        campaign: record.campaign,
                        keyword: record.keyword,
                        revenue: 0,
                        conversions: 0,
                        averageOrderValue: 0
                    });
                }
                const keywordData = byKeywordMap.get(keywordKey)!;
                keywordData.revenue += record.revenue;
                keywordData.conversions += 1;
                keywordData.averageOrderValue = keywordData.revenue / keywordData.conversions;

                // Group by product
                const productKey = record.productId;
                if (!byProductMap.has(productKey)) {
                    byProductMap.set(productKey, {
                        productId: record.productId,
                        productName: record.productName,
                        productCategory: record.productCategory,
                        revenue: 0,
                        conversions: 0,
                        averageOrderValue: 0
                    });
                }
                const productData = byProductMap.get(productKey)!;
                productData.revenue += record.revenue;
                productData.conversions += 1;
                productData.averageOrderValue = productData.revenue / productData.conversions;
            }

            // Calculate final summary metrics
            if (reportData.summary.totalConversions > 0) {
                reportData.summary.averageOrderValue = reportData.summary.totalRevenue / reportData.summary.totalConversions;
                reportData.summary.averageDiscountPercentage = (reportData.summary.totalDiscountAmount / (reportData.summary.totalRevenue + reportData.summary.totalDiscountAmount)) * 100;
            }

            // Convert Maps to Arrays for JSON serialization
            reportData.byCampaign = Array.from(byCampaignMap.values());
            reportData.byKeyword = Array.from(byKeywordMap.values());
            reportData.byProduct = Array.from(byProductMap.values());

            return {
                success: true,
                report: reportData
            };

        } catch (error: any) {
            console.error('Report generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get Target ROAS optimization data for campaigns
     */
    getTargetROASData(conversionData: ConversionData, pricingData: PricingBreakdown): ROASData | null {
        if (!this.roasOptimizationEnabled) {
            return null;
        }

        if (!pricingData || typeof pricingData.finalPrice !== 'number') {
            return null;
        }

        return {
            conversionValue: pricingData.finalPrice,
            currency: pricingData.currency || 'JPY',
            roasCategory: this._categorizeROASValue(pricingData.finalPrice),
            profitMargin: pricingData.profitMargin || 0,
            customerLifetimeValue: this._estimateCustomerLifetimeValue(conversionData),
            optimizationRecommendations: this._generateROASRecommendations(pricingData)
        };
    }

    // Private helper methods

    /**
     * Apply discount to original price
     */
    private _applyDiscount(originalPrice: number, discountData: DiscountData): { finalPrice: number; discountAmount: number; discountPercentage: number } {
        let finalPrice = originalPrice;
        let discountAmount = 0;

        if (discountData.type === 'percentage') {
            discountAmount = Math.floor(originalPrice * (discountData.value / 100));
            finalPrice = originalPrice - discountAmount;
        } else if (discountData.type === 'fixed') {
            discountAmount = Math.min(discountData.value, originalPrice);
            finalPrice = originalPrice - discountAmount;
        }

        // Apply maximum discount limit if specified
        if (discountData.maxDiscountAmount && discountAmount > discountData.maxDiscountAmount) {
            discountAmount = discountData.maxDiscountAmount;
            finalPrice = originalPrice - discountAmount;
        }

        const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

        return {
            finalPrice: Math.max(0, finalPrice),
            discountAmount,
            discountPercentage
        };
    }

    /**
     * Apply additional pricing rules
     */
    private _applyPricingRules(price: number, rules: PricingRule[]): number {
        let adjustedPrice = price;

        for (const rule of rules) {
            switch (rule.type) {
                case 'minimum':
                    adjustedPrice = Math.max(adjustedPrice, rule.value);
                    break;
                case 'maximum':
                    adjustedPrice = Math.min(adjustedPrice, rule.value);
                    break;
                case 'round':
                    adjustedPrice = Math.round(adjustedPrice / rule.value) * rule.value;
                    break;
                default:
                    // Unknown rule type, skip
                    console.warn(`Unknown pricing rule type: ${rule.type}`);
                    break;
            }
        }

        return adjustedPrice;
    }

    /**
     * Get fallback price when validation fails
     */
    private _getFallbackPrice(originalPrice: number, discountAmount: number): number {
        const fallbackPrice = originalPrice - Math.min(discountAmount, originalPrice * 0.5); // Max 50% discount
        return Math.max(this.minPrice, Math.min(this.maxPrice, fallbackPrice));
    }

    /**
     * Generate unique pricing ID
     */
    private _generatePricingId(): string {
        return `price_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Generate unique conversion ID
     */
    private _generateConversionId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Generate attribution key
     */
    private _generateAttributionKey(conversionData: ConversionData): string {
        const timestamp = Date.now();
        const campaign = conversionData.campaign || 'unknown';
        const keyword = conversionData.keyword || 'unknown';
        return `${campaign}_${keyword}_${timestamp}`;
    }

    /**
     * Categorize ROAS value for optimization
     */
    private _categorizeROASValue(value: number): string {
        if (value >= 20000) return 'high_value';
        if (value >= 10000) return 'medium_value';
        if (value >= 5000) return 'low_value';
        return 'minimal_value';
    }

    /**
     * Calculate profit margin
     */
    private _calculateProfitMargin(basePrice: number, finalPrice: number): number {
        if (basePrice <= 0) return 0;
        const cost = basePrice * 0.3; // Assume 30% cost ratio
        const profit = finalPrice - cost;
        return (profit / finalPrice) * 100;
    }

    /**
     * Validate Target ROAS requirements
     */
    private _validateTargetROAS(conversionValue: number, targetROAS: any): { isValid: boolean; warnings: string[] } {
        const validation = { isValid: true, warnings: [] as string[] };

        if (targetROAS && targetROAS.minValue && conversionValue < targetROAS.minValue) {
            validation.warnings.push(`Conversion value ${conversionValue} below Target ROAS minimum ${targetROAS.minValue}`);
        }

        return validation;
    }

    /**
     * Determine customer segment for attribution
     */
    private _determineCustomerSegment(pricingData: PricingBreakdown): string {
        const value = pricingData.finalPrice;
        if (value >= 15000) return 'premium';
        if (value >= 8000) return 'standard';
        return 'budget';
    }

    /**
     * Send attribution data to analytics
     */
    private _sendAttributionToAnalytics(record: AttributionRecord): void {
        try {
            // Send to GTM dataLayer for further processing
            if (typeof window !== 'undefined' && (window as any).dataLayer) {
                (window as any).dataLayer.push({
                    event: 'revenue_attribution',
                    attribution_data: {
                        revenue: record.revenue,
                        campaign: record.campaign,
                        keyword: record.keyword,
                        product_id: record.productId,
                        customer_segment: record.customerSegment
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to send attribution to analytics:', error);
        }
    }

    /**
     * Check if record matches report filters
     */
    private _matchesFilters(record: AttributionRecord, filters: ReportFilters): boolean {
        if (filters.dateFrom && new Date(record.timestamp) < new Date(filters.dateFrom)) {
            return false;
        }
        if (filters.dateTo && new Date(record.timestamp) > new Date(filters.dateTo)) {
            return false;
        }
        if (filters.campaign && record.campaign !== filters.campaign) {
            return false;
        }
        if (filters.productCategory && record.productCategory !== filters.productCategory) {
            return false;
        }
        return true;
    }

    /**
     * Estimate customer lifetime value
     */
    private _estimateCustomerLifetimeValue(conversionData: ConversionData): number {
        // Simple estimation based on tour type and customer segment
        const baseValue = conversionData.conversionValue || 0;
        const multiplier = conversionData.isRepeatCustomer ? 2.5 : 1.8;
        return Math.round(baseValue * multiplier);
    }

    /**
     * Generate ROAS optimization recommendations
     */
    private _generateROASRecommendations(pricingData: PricingBreakdown): string[] {
        const recommendations: string[] = [];

        if (pricingData.discountPercentage > 30) {
            recommendations.push('Consider reducing discount percentage to improve profit margins');
        }

        if (pricingData.finalPrice < 5000) {
            recommendations.push('Low conversion value may impact Target ROAS performance');
        }

        if (pricingData.profitMargin < 20) {
            recommendations.push('Low profit margin detected - review pricing strategy');
        }

        return recommendations;
    }

    /**
     * Get price validation enabled status
     */
    isPriceValidationEnabled(): boolean {
        return this.priceValidationEnabled;
    }

    /**
     * Get value tracking enabled status
     */
    isValueTrackingEnabled(): boolean {
        return this.valueTrackingEnabled;
    }
}

// Create singleton instance
const conversionValueOptimizer = new ConversionValueOptimizer();

export default conversionValueOptimizer;
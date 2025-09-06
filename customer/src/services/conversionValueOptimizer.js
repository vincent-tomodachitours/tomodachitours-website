/**
 * Conversion Value Optimizer Service
 * 
 * Handles dynamic pricing with discounts for accurate conversion value tracking.
 * Ensures proper value attribution for Target ROAS campaigns and revenue reporting.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

class ConversionValueOptimizer {
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
     * @param {Object} priceData - Base pricing information
     * @param {Object} discountData - Applied discount information
     * @param {Object} options - Additional pricing options
     * @returns {Object} - Calculated pricing with validation
     */
    calculateDynamicPrice(priceData, discountData = null, options = {}) {
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
            const pricingBreakdown = {
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

        } catch (error) {
            console.error('Dynamic price calculation failed:', error);
            return {
                success: false,
                error: error.message,
                pricing: null,
                validation: { isValid: false, errors: [error.message] }
            };
        }
    }

    /**
     * Validate conversion value for accuracy and compliance
     * @param {number} conversionValue - The conversion value to validate
     * @param {Object} context - Additional context for validation
     * @returns {Object} - Validation result
     */
    validateConversionValue(conversionValue, context = {}) {
        const validation = {
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
     * @param {Object} conversionData - Conversion data with attribution
     * @param {Object} pricingData - Pricing breakdown
     * @returns {Object} - Attribution tracking result
     */
    trackRevenueAttribution(conversionData, pricingData) {
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
            const attributionRecord = {
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

        } catch (error) {
            console.error('Revenue attribution tracking failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate comprehensive value and attribution report
     * @param {Object} filters - Report filters (date range, campaign, etc.)
     * @returns {Object} - Revenue attribution report
     */
    generateValueReport(filters = {}) {
        try {
            const reportData = {
                generatedAt: new Date().toISOString(),
                filters,
                summary: {
                    totalRevenue: 0,
                    totalConversions: 0,
                    averageOrderValue: 0,
                    totalDiscountAmount: 0,
                    averageDiscountPercentage: 0
                },
                byCampaign: new Map(),
                byKeyword: new Map(),
                byProduct: new Map(),
                trends: []
            };

            // Process attribution data
            for (const [, record] of this.attributionData.entries()) {
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
                if (!reportData.byCampaign.has(campaignKey)) {
                    reportData.byCampaign.set(campaignKey, {
                        campaign: campaignKey,
                        revenue: 0,
                        conversions: 0,
                        averageOrderValue: 0,
                        roas: 0
                    });
                }
                const campaignData = reportData.byCampaign.get(campaignKey);
                campaignData.revenue += record.revenue;
                campaignData.conversions += 1;
                campaignData.averageOrderValue = campaignData.revenue / campaignData.conversions;

                // Group by keyword
                const keywordKey = `${record.campaign}:${record.keyword}`;
                if (!reportData.byKeyword.has(keywordKey)) {
                    reportData.byKeyword.set(keywordKey, {
                        campaign: record.campaign,
                        keyword: record.keyword,
                        revenue: 0,
                        conversions: 0,
                        averageOrderValue: 0
                    });
                }
                const keywordData = reportData.byKeyword.get(keywordKey);
                keywordData.revenue += record.revenue;
                keywordData.conversions += 1;
                keywordData.averageOrderValue = keywordData.revenue / keywordData.conversions;

                // Group by product
                const productKey = record.productId;
                if (!reportData.byProduct.has(productKey)) {
                    reportData.byProduct.set(productKey, {
                        productId: record.productId,
                        productName: record.productName,
                        productCategory: record.productCategory,
                        revenue: 0,
                        conversions: 0,
                        averageOrderValue: 0
                    });
                }
                const productData = reportData.byProduct.get(productKey);
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
            reportData.byCampaign = Array.from(reportData.byCampaign.values());
            reportData.byKeyword = Array.from(reportData.byKeyword.values());
            reportData.byProduct = Array.from(reportData.byProduct.values());

            return {
                success: true,
                report: reportData
            };

        } catch (error) {
            console.error('Report generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get Target ROAS optimization data for campaigns
     * @param {Object} conversionData - Conversion data
     * @param {Object} pricingData - Pricing data
     * @returns {Object|null} - ROAS optimization data
     */
    getTargetROASData(conversionData, pricingData) {
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
     * @private
     */
    _applyDiscount(originalPrice, discountData) {
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
     * @private
     */
    _applyPricingRules(price, rules) {
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
     * @private
     */
    _getFallbackPrice(originalPrice, discountAmount) {
        const fallbackPrice = originalPrice - Math.min(discountAmount, originalPrice * 0.5); // Max 50% discount
        return Math.max(this.minPrice, Math.min(this.maxPrice, fallbackPrice));
    }

    /**
     * Generate unique pricing ID
     * @private
     */
    _generatePricingId() {
        return `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique conversion ID
     * @private
     */
    _generateConversionId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate attribution key
     * @private
     */
    _generateAttributionKey(conversionData) {
        const timestamp = Date.now();
        const campaign = conversionData.campaign || 'unknown';
        const keyword = conversionData.keyword || 'unknown';
        return `${campaign}_${keyword}_${timestamp}`;
    }

    /**
     * Categorize ROAS value for optimization
     * @private
     */
    _categorizeROASValue(value) {
        if (value >= 20000) return 'high_value';
        if (value >= 10000) return 'medium_value';
        if (value >= 5000) return 'low_value';
        return 'minimal_value';
    }

    /**
     * Calculate profit margin
     * @private
     */
    _calculateProfitMargin(basePrice, finalPrice) {
        if (basePrice <= 0) return 0;
        const cost = basePrice * 0.3; // Assume 30% cost ratio
        const profit = finalPrice - cost;
        return (profit / finalPrice) * 100;
    }

    /**
     * Validate Target ROAS requirements
     * @private
     */
    _validateTargetROAS(conversionValue, targetROAS) {
        const validation = { isValid: true, warnings: [] };

        if (targetROAS && targetROAS.minValue && conversionValue < targetROAS.minValue) {
            validation.warnings.push(`Conversion value ${conversionValue} below Target ROAS minimum ${targetROAS.minValue}`);
        }

        return validation;
    }

    /**
     * Determine customer segment for attribution
     * @private
     */
    _determineCustomerSegment(pricingData) {
        const value = pricingData.finalPrice;
        if (value >= 15000) return 'premium';
        if (value >= 8000) return 'standard';
        return 'budget';
    }

    /**
     * Send attribution data to analytics
     * @private
     */
    _sendAttributionToAnalytics(record) {
        try {
            // Send to GTM dataLayer for further processing
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
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
     * @private
     */
    _matchesFilters(record, filters) {
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
     * @private
     */
    _estimateCustomerLifetimeValue(conversionData) {
        // Simple estimation based on tour type and customer segment
        const baseValue = conversionData.conversionValue || 0;
        const multiplier = conversionData.isRepeatCustomer ? 2.5 : 1.8;
        return Math.round(baseValue * multiplier);
    }

    /**
     * Generate ROAS optimization recommendations
     * @private
     */
    _generateROASRecommendations(pricingData) {
        const recommendations = [];

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
}

// Create singleton instance
const conversionValueOptimizer = new ConversionValueOptimizer();

export default conversionValueOptimizer;
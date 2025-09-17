/**
 * Metrics Calculation Service for Revenue Attribution Reporter
 * Handles all performance metric calculations
 */

import type {
    BaseReportItem,
    CampaignReportItem,
    PerformanceGrade,
    BidRecommendation,
    KeywordIntent,
    SearchVolume,
    CompetitionLevel,
    ProductSeasonality,
    CustomerSegments,
    RevenueGrowthTrend
} from './types';
import { PERFORMANCE_THRESHOLDS, ESTIMATION_CONSTANTS, KEYWORD_CLASSIFICATION } from './constants';

export class MetricsCalculationService {
    /**
     * Calculate ROAS for campaign/keyword
     */
    calculateROAS(item: BaseReportItem): number {
        const estimatedAdSpend = item.revenue * ESTIMATION_CONSTANTS.AD_SPEND_RATIO;
        return estimatedAdSpend > 0 ? item.revenue / estimatedAdSpend : 0;
    }

    /**
     * Estimate cost per conversion
     */
    estimateCostPerConversion(item: BaseReportItem): number {
        const estimatedAdSpend = item.revenue * ESTIMATION_CONSTANTS.AD_SPEND_RATIO;
        return item.conversions > 0 ? estimatedAdSpend / item.conversions : 0;
    }

    /**
     * Calculate campaign profit margin
     */
    calculateCampaignProfitMargin(campaign: BaseReportItem): number {
        const estimatedCosts = campaign.revenue * ESTIMATION_CONSTANTS.TOTAL_COSTS_RATIO;
        return ((campaign.revenue - estimatedCosts) / campaign.revenue) * 100;
    }

    /**
     * Calculate revenue per click
     */
    calculateRevenuePerClick(item: BaseReportItem): number {
        const estimatedClicks = item.conversions / ESTIMATION_CONSTANTS.BASE_CONVERSION_RATE;
        return estimatedClicks > 0 ? item.revenue / estimatedClicks : 0;
    }

    /**
     * Estimate conversion rate
     */
    estimateConversionRate(item: BaseReportItem): number {
        const baseRate = ESTIMATION_CONSTANTS.BASE_CONVERSION_RATE;
        const performanceMultiplier = item.averageOrderValue > 10000 ? 1.2 : 0.8;
        return baseRate * performanceMultiplier;
    }

    /**
     * Estimate customer lifetime value
     */
    estimateCustomerLTV(item: BaseReportItem): number {
        return item.averageOrderValue * ESTIMATION_CONSTANTS.LTV_MULTIPLIER;
    }

    /**
     * Grade campaign performance
     */
    gradeCampaignPerformance(_campaign: BaseReportItem, roas: number, profitMargin: number): PerformanceGrade {
        const { ROAS, PROFIT_MARGIN } = PERFORMANCE_THRESHOLDS;

        if (roas >= ROAS.EXCELLENT && profitMargin >= PROFIT_MARGIN.EXCELLENT) return 'A';
        if (roas >= ROAS.GOOD && profitMargin >= PROFIT_MARGIN.GOOD) return 'B';
        if (roas >= ROAS.FAIR && profitMargin >= PROFIT_MARGIN.FAIR) return 'C';
        if (roas >= ROAS.POOR && profitMargin >= PROFIT_MARGIN.POOR) return 'D';
        return 'F';
    }

    /**
     * Calculate average ROAS across campaigns
     */
    calculateAverageROAS(campaigns: CampaignReportItem[]): number {
        if (campaigns.length === 0) return 0;
        return campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length;
    }

    /**
     * Calculate revenue growth trend
     */
    calculateRevenueGrowthTrend(campaigns: CampaignReportItem[], _filters: any): RevenueGrowthTrend {
        // Simplified trend calculation - in real implementation, this would compare with historical data
        return campaigns.length > 0 ? 'stable' : 'no_data';
    }

    /**
     * Estimate search volume for keyword
     */
    estimateSearchVolume(keyword: string): SearchVolume {
        const { HIGH_VOLUME_INDICATORS, MEDIUM_VOLUME_INDICATORS } = KEYWORD_CLASSIFICATION;

        if (HIGH_VOLUME_INDICATORS.some(indicator => keyword.toLowerCase().includes(indicator))) {
            return 'high';
        }
        if (MEDIUM_VOLUME_INDICATORS.some(indicator => keyword.toLowerCase().includes(indicator))) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Assess keyword competition level
     */
    assessKeywordCompetition(keyword: string): CompetitionLevel {
        // Simplified competition assessment based on keyword length
        if (keyword.length < 10) return 'high';
        if (keyword.length < 20) return 'medium';
        return 'low';
    }

    /**
     * Classify keyword intent
     */
    classifyKeywordIntent(keyword: string): KeywordIntent {
        const { HIGH_INTENT_WORDS, MEDIUM_INTENT_WORDS } = KEYWORD_CLASSIFICATION;
        const lowerKeyword = keyword.toLowerCase();

        if (HIGH_INTENT_WORDS.some(word => lowerKeyword.includes(word))) {
            return 'high';
        }
        if (MEDIUM_INTENT_WORDS.some(word => lowerKeyword.includes(word))) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Calculate keyword performance score
     */
    calculateKeywordPerformanceScore(keyword: BaseReportItem, roas: number): number {
        let score = 0;

        // ROAS component (40% weight)
        if (roas >= PERFORMANCE_THRESHOLDS.ROAS.EXCELLENT) score += 40;
        else if (roas >= PERFORMANCE_THRESHOLDS.ROAS.GOOD) score += 30;
        else if (roas >= PERFORMANCE_THRESHOLDS.ROAS.FAIR) score += 20;
        else score += 10;

        // Revenue component (30% weight)
        if (keyword.revenue >= 50000) score += 30;
        else if (keyword.revenue >= 20000) score += 25;
        else if (keyword.revenue >= 10000) score += 20;
        else score += 10;

        // Conversion component (30% weight)
        if (keyword.conversions >= 20) score += 30;
        else if (keyword.conversions >= 10) score += 25;
        else if (keyword.conversions >= 5) score += 20;
        else score += 10;

        return Math.min(100, score);
    }

    /**
     * Generate bid recommendation
     */
    generateBidRecommendation(_keyword: BaseReportItem, roas: number): BidRecommendation {
        if (roas >= PERFORMANCE_THRESHOLDS.ROAS.EXCELLENT) return 'increase';
        if (roas >= PERFORMANCE_THRESHOLDS.ROAS.FAIR) return 'maintain';
        return 'decrease';
    }

    /**
     * Calculate product conversion rate
     */
    calculateProductConversionRate(_product: BaseReportItem): number {
        // Simplified calculation - in real implementation, this would use actual data
        return Math.random() * 0.05 + 0.02; // 2-7% range
    }

    /**
     * Calculate product profit margin
     */
    calculateProductProfitMargin(product: BaseReportItem): number {
        // Simplified calculation based on average order value
        if (product.averageOrderValue > 15000) return 65;
        if (product.averageOrderValue > 10000) return 55;
        return 45;
    }

    /**
     * Analyze product seasonality
     */
    analyzeProductSeasonality(product: any): ProductSeasonality {
        const productName = product.productName?.toLowerCase() || '';
        return {
            isHighlySeasonal: productName.includes('cherry') || productName.includes('autumn'),
            peakSeason: 'spring',
            seasonalityScore: 0.7
        };
    }

    /**
     * Calculate product growth rate
     */
    calculateProductGrowthRate(_product: BaseReportItem, _filters: any): number {
        // Simplified growth calculation - in real implementation, this would compare with historical data
        return Math.random() * 0.2 - 0.1; // -10% to +10%
    }

    /**
     * Analyze product customer segments
     */
    analyzeProductCustomerSegments(_product: BaseReportItem): CustomerSegments {
        return {
            premium: 30,
            standard: 50,
            budget: 20
        };
    }

    /**
     * Calculate marketing efficiency
     */
    calculateMarketingEfficiency(product: BaseReportItem): number {
        const adSpend = product.revenue * ESTIMATION_CONSTANTS.AD_SPEND_RATIO;
        return adSpend > 0 ? product.revenue / adSpend : 0;
    }
}

export const metricsCalculationService = new MetricsCalculationService();
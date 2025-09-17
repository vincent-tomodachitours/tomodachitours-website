/**
 * Recommendations Service for Revenue Attribution Reporter
 * Generates insights and recommendations based on performance data
 */

import type {
    BaseReportItem,
    CampaignReportItem,
    KeywordReportItem,
    ProductReportItem,
    CampaignReportSummary,
    KeywordReportSummary,
    ProductReportSummary
} from './types';
import { PERFORMANCE_THRESHOLDS } from './constants';

export class RecommendationsService {
    /**
     * Generate campaign recommendations
     */
    generateCampaignRecommendations(campaign: BaseReportItem, roas: number, profitMargin: number): string[] {
        const recommendations: string[] = [];

        if (roas < PERFORMANCE_THRESHOLDS.ROAS.FAIR) {
            recommendations.push('Consider reducing bids or pausing low-performing keywords');
        }
        if (profitMargin < PERFORMANCE_THRESHOLDS.PROFIT_MARGIN.FAIR) {
            recommendations.push('Review pricing strategy to improve margins');
        }
        if (campaign.conversions < 10) {
            recommendations.push('Increase budget to gather more conversion data');
        }
        if (roas > PERFORMANCE_THRESHOLDS.ROAS.EXCELLENT) {
            recommendations.push('Consider increasing bids to capture more volume');
        }

        return recommendations;
    }

    /**
     * Generate campaign insights
     */
    generateCampaignInsights(campaigns: CampaignReportItem[], summary: CampaignReportSummary): string[] {
        const insights: string[] = [];

        if (summary.averageROAS > PERFORMANCE_THRESHOLDS.ROAS.EXCELLENT) {
            insights.push('Strong overall ROAS performance across campaigns');
        }

        if (campaigns.length > 0 && campaigns[0].revenue > summary.totalRevenue * 0.5) {
            insights.push('Revenue is heavily concentrated in top campaign - consider diversification');
        }

        const topPerformers = campaigns.filter(c => c.performanceGrade === 'A' || c.performanceGrade === 'B');
        if (topPerformers.length / campaigns.length > 0.7) {
            insights.push('Majority of campaigns are performing well - good portfolio health');
        }

        return insights;
    }

    /**
     * Identify keyword optimization opportunities
     */
    identifyKeywordOptimizations(keyword: any): string[] {
        const opportunities: string[] = [];

        if (keyword.conversions < 5) {
            opportunities.push('Low conversion volume - consider bid adjustments');
        }
        if (keyword.keywordIntent === 'low') {
            opportunities.push('Low intent keyword - consider negative keywords or landing page optimization');
        }
        if (keyword.searchVolume === 'high' && keyword.performanceScore < PERFORMANCE_THRESHOLDS.PERFORMANCE_SCORE.GOOD_PERFORMER) {
            opportunities.push('High volume keyword underperforming - review ad copy and landing pages');
        }

        return opportunities;
    }

    /**
     * Generate keyword insights
     */
    generateKeywordInsights(keywords: KeywordReportItem[], summary: KeywordReportSummary): string[] {
        const insights: string[] = [];

        if (summary.highIntentKeywords / summary.totalKeywords > 0.3) {
            insights.push('Good mix of high-intent keywords driving conversions');
        }

        const topPerformers = summary.performanceTiers.topPerformers;
        if (topPerformers.length > 0) {
            const topPerformerRevenue = topPerformers.reduce((sum, k) => sum + k.revenue, 0);
            const revenueShare = (topPerformerRevenue / summary.totalRevenue) * 100;
            insights.push(`Top ${topPerformers.length} keywords generate ${revenueShare.toFixed(1)}% of total revenue`);
        }

        const underPerformers = summary.performanceTiers.underPerformers;
        if (underPerformers.length > keywords.length * 0.3) {
            insights.push('High number of underperforming keywords - consider optimization or pausing');
        }

        return insights;
    }

    /**
     * Generate product recommendations
     */
    generateProductRecommendations(product: any): string[] {
        const recommendations: string[] = [];

        if (product.conversionRate < 0.03) {
            recommendations.push('Low conversion rate - optimize product page');
        }
        if (product.revenueShare > 50) {
            recommendations.push('High revenue concentration - diversify product portfolio');
        }
        if (product.profitMargin < PERFORMANCE_THRESHOLDS.PROFIT_MARGIN.FAIR) {
            recommendations.push('Low profit margin - review pricing or cost structure');
        }
        if (product.seasonality.isHighlySeasonal) {
            recommendations.push('Seasonal product - adjust marketing spend based on seasonality patterns');
        }

        return recommendations;
    }

    /**
     * Generate product insights
     */
    generateProductInsights(products: ProductReportItem[], summary: ProductReportSummary): string[] {
        const insights: string[] = [];

        if (summary.seasonalProducts > 0) {
            insights.push(`${summary.seasonalProducts} products show seasonal patterns - plan inventory accordingly`);
        }

        const highMarginProducts = products.filter(p => p.profitMargin > PERFORMANCE_THRESHOLDS.PROFIT_MARGIN.GOOD);
        if (highMarginProducts.length > 0) {
            const avgMargin = highMarginProducts.reduce((sum, p) => sum + p.profitMargin, 0) / highMarginProducts.length;
            insights.push(`${highMarginProducts.length} products have high margins (avg: ${avgMargin.toFixed(1)}%)`);
        }

        const topProduct = products[0];
        if (topProduct && topProduct.revenueShare > 40) {
            insights.push(`${topProduct.productName} dominates revenue (${topProduct.revenueShare.toFixed(1)}%) - consider promoting other products`);
        }

        return insights;
    }

    /**
     * Generate strategic recommendations based on overall performance
     */
    generateStrategicRecommendations(
        campaigns: CampaignReportItem[],
        keywords: KeywordReportItem[],
        products: ProductReportItem[]
    ): string[] {
        const recommendations: string[] = [];

        // Campaign-level strategic recommendations
        const avgCampaignROAS = campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length;
        if (avgCampaignROAS < PERFORMANCE_THRESHOLDS.ROAS.FAIR) {
            recommendations.push('Overall ROAS below target - review campaign structure and targeting');
        }

        // Keyword-level strategic recommendations
        const highIntentKeywords = keywords.filter(k => k.keywordIntent === 'high');
        if (highIntentKeywords.length / keywords.length < 0.2) {
            recommendations.push('Low proportion of high-intent keywords - expand keyword research');
        }

        // Product-level strategic recommendations
        const seasonalProducts = products.filter(p => p.seasonality.isHighlySeasonal);
        if (seasonalProducts.length > products.length * 0.5) {
            recommendations.push('High seasonality in product portfolio - consider year-round offerings');
        }

        return recommendations;
    }
}

export const recommendationsService = new RecommendationsService();
/**
 * Report Generation Service for Revenue Attribution Reporter
 * Handles the core report generation logic
 */

import type {
    CampaignReport,
    KeywordReport,
    ProductReport,
    CampaignReportItem,
    KeywordReportItem,
    ProductReportItem,
    CampaignReportSummary,
    KeywordReportSummary,
    ProductReportSummary,
    PerformanceTiers,
    ReportFilters
} from './types';
import { REPORT_TYPES, PERFORMANCE_THRESHOLDS } from './constants';
import { metricsCalculationService } from './metricsCalculationService';
import { recommendationsService } from './recommendationsService';
import { cacheService } from './cacheService';
import { sessionService } from '../dynamicRemarketing/sessionService';
import conversionValueOptimizer from '../conversionValueOptimizer';

export class ReportGenerationService {
    /**
     * Generate comprehensive campaign performance report
     */
    async generateCampaignReport(filters: ReportFilters = {}): Promise<CampaignReport> {
        try {
            const cacheKey = `campaign_${JSON.stringify(filters)}`;
            const cached = cacheService.getCachedReport(cacheKey);

            if (cached) {
                return cached;
            }

            // Get base report from conversion value optimizer
            const baseReport = conversionValueOptimizer.generateValueReport(filters) as any;

            if (!baseReport.success) {
                throw new Error(`Base report generation failed: ${baseReport.error}`);
            }

            // Enhance campaign data with additional metrics
            const enhancedCampaigns: CampaignReportItem[] = baseReport.report.byCampaign.map((campaign: any) => {
                const roas = metricsCalculationService.calculateROAS(campaign);
                const costPerConversion = metricsCalculationService.estimateCostPerConversion(campaign);
                const profitMargin = metricsCalculationService.calculateCampaignProfitMargin(campaign);

                return {
                    ...campaign,
                    roas,
                    costPerConversion,
                    profitMargin,
                    revenuePerClick: metricsCalculationService.calculateRevenuePerClick(campaign),
                    conversionRate: metricsCalculationService.estimateConversionRate(campaign),
                    customerLifetimeValue: metricsCalculationService.estimateCustomerLTV(campaign),
                    performanceGrade: metricsCalculationService.gradeCampaignPerformance(campaign, roas, profitMargin),
                    recommendations: recommendationsService.generateCampaignRecommendations(campaign, roas, profitMargin)
                };
            });

            // Sort by revenue descending
            enhancedCampaigns.sort((a, b) => b.revenue - a.revenue);

            // Calculate summary metrics
            const summary: CampaignReportSummary = {
                totalCampaigns: enhancedCampaigns.length,
                totalRevenue: enhancedCampaigns.reduce((sum, c) => sum + c.revenue, 0),
                totalConversions: enhancedCampaigns.reduce((sum, c) => sum + c.conversions, 0),
                averageROAS: metricsCalculationService.calculateAverageROAS(enhancedCampaigns),
                topPerformingCampaign: enhancedCampaigns[0]?.campaign || 'N/A',
                worstPerformingCampaign: enhancedCampaigns[enhancedCampaigns.length - 1]?.campaign || 'N/A',
                revenueGrowthTrend: metricsCalculationService.calculateRevenueGrowthTrend(enhancedCampaigns, filters)
            };

            const report: CampaignReport = {
                success: true,
                reportType: REPORT_TYPES.CAMPAIGN,
                generatedAt: new Date().toISOString(),
                filters: this.enhanceFiltersWithSession(filters),
                summary,
                campaigns: enhancedCampaigns,
                insights: recommendationsService.generateCampaignInsights(enhancedCampaigns, summary)
            };

            // Cache the report
            cacheService.cacheReport(cacheKey, report);

            return report;

        } catch (error) {
            console.error('Campaign report generation failed:', error);
            return this.createErrorReport(REPORT_TYPES.CAMPAIGN, filters, error as Error) as CampaignReport;
        }
    }

    /**
     * Generate detailed keyword performance report
     */
    async generateKeywordReport(filters: ReportFilters = {}): Promise<KeywordReport> {
        try {
            const cacheKey = `keyword_${JSON.stringify(filters)}`;
            const cached = cacheService.getCachedReport(cacheKey);

            if (cached) {
                return cached;
            }

            // Get base report from conversion value optimizer
            const baseReport = conversionValueOptimizer.generateValueReport(filters) as any;

            if (!baseReport.success) {
                throw new Error(`Base report generation failed: ${baseReport.error}`);
            }

            // Enhance keyword data with performance metrics
            const enhancedKeywords: KeywordReportItem[] = baseReport.report.byKeyword.map((keyword: any) => {
                const roas = metricsCalculationService.calculateROAS(keyword);
                const searchVolume = metricsCalculationService.estimateSearchVolume(keyword.keyword);
                const competitionLevel = metricsCalculationService.assessKeywordCompetition(keyword.keyword);
                const keywordIntent = metricsCalculationService.classifyKeywordIntent(keyword.keyword);
                const performanceScore = metricsCalculationService.calculateKeywordPerformanceScore(keyword, roas);

                return {
                    ...keyword,
                    roas,
                    searchVolume,
                    competitionLevel,
                    revenuePerConversion: keyword.averageOrderValue,
                    keywordIntent,
                    performanceScore,
                    bidRecommendation: metricsCalculationService.generateBidRecommendation(keyword, roas),
                    optimizationOpportunities: recommendationsService.identifyKeywordOptimizations({
                        ...keyword,
                        keywordIntent,
                        performanceScore
                    })
                };
            });

            // Sort by performance score descending
            enhancedKeywords.sort((a, b) => b.performanceScore - a.performanceScore);

            // Group keywords by performance tiers
            const performanceTiers: PerformanceTiers = {
                topPerformers: enhancedKeywords.filter(k => k.performanceScore >= PERFORMANCE_THRESHOLDS.PERFORMANCE_SCORE.TOP_PERFORMER),
                goodPerformers: enhancedKeywords.filter(k =>
                    k.performanceScore >= PERFORMANCE_THRESHOLDS.PERFORMANCE_SCORE.GOOD_PERFORMER &&
                    k.performanceScore < PERFORMANCE_THRESHOLDS.PERFORMANCE_SCORE.TOP_PERFORMER
                ),
                underPerformers: enhancedKeywords.filter(k => k.performanceScore < PERFORMANCE_THRESHOLDS.PERFORMANCE_SCORE.GOOD_PERFORMER)
            };

            const summary: KeywordReportSummary = {
                totalKeywords: enhancedKeywords.length,
                totalRevenue: enhancedKeywords.reduce((sum, k) => sum + k.revenue, 0),
                averagePerformanceScore: enhancedKeywords.reduce((sum, k) => sum + k.performanceScore, 0) / enhancedKeywords.length,
                topKeyword: enhancedKeywords[0]?.keyword || 'N/A',
                highIntentKeywords: enhancedKeywords.filter(k => k.keywordIntent === 'high').length,
                performanceTiers
            };

            const report: KeywordReport = {
                success: true,
                reportType: REPORT_TYPES.KEYWORD,
                generatedAt: new Date().toISOString(),
                filters: this.enhanceFiltersWithSession(filters),
                summary,
                keywords: enhancedKeywords,
                performanceTiers,
                insights: recommendationsService.generateKeywordInsights(enhancedKeywords, summary)
            };

            // Cache the report
            cacheService.cacheReport(cacheKey, report);

            return report;

        } catch (error) {
            console.error('Keyword report generation failed:', error);
            return this.createErrorReport(REPORT_TYPES.KEYWORD, filters, error as Error) as KeywordReport;
        }
    }

    /**
     * Generate product-level revenue attribution report
     */
    async generateProductReport(filters: ReportFilters = {}): Promise<ProductReport> {
        try {
            const cacheKey = `product_${JSON.stringify(filters)}`;
            const cached = cacheService.getCachedReport(cacheKey);

            if (cached) {
                return cached;
            }

            // Get base report from conversion value optimizer
            const baseReport = conversionValueOptimizer.generateValueReport(filters) as any;

            if (!baseReport.success) {
                throw new Error(`Base report generation failed: ${baseReport.error}`);
            }

            // Enhance product data with performance metrics
            const enhancedProducts: ProductReportItem[] = baseReport.report.byProduct.map((product: any) => {
                const conversionRate = metricsCalculationService.calculateProductConversionRate(product);
                const profitMargin = metricsCalculationService.calculateProductProfitMargin(product);
                const seasonality = metricsCalculationService.analyzeProductSeasonality(product);

                return {
                    ...product,
                    conversionRate,
                    profitMargin,
                    seasonality,
                    revenueShare: 0, // Will be calculated below
                    growthRate: metricsCalculationService.calculateProductGrowthRate(product, filters),
                    customerSegments: metricsCalculationService.analyzeProductCustomerSegments(product),
                    marketingEfficiency: metricsCalculationService.calculateMarketingEfficiency(product),
                    recommendations: recommendationsService.generateProductRecommendations({
                        ...product,
                        conversionRate,
                        profitMargin,
                        seasonality
                    })
                };
            });

            // Calculate revenue share
            const totalRevenue = enhancedProducts.reduce((sum, p) => sum + p.revenue, 0);
            enhancedProducts.forEach(product => {
                product.revenueShare = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
            });

            // Sort by revenue descending
            enhancedProducts.sort((a, b) => b.revenue - a.revenue);

            const summary: ProductReportSummary = {
                totalProducts: enhancedProducts.length,
                totalRevenue: totalRevenue,
                topProduct: enhancedProducts[0]?.productName || 'N/A',
                averageConversionRate: enhancedProducts.reduce((sum, p) => sum + p.conversionRate, 0) / enhancedProducts.length,
                highestMargin: Math.max(...enhancedProducts.map(p => p.profitMargin)),
                seasonalProducts: enhancedProducts.filter(p => p.seasonality.isHighlySeasonal).length
            };

            const report: ProductReport = {
                success: true,
                reportType: REPORT_TYPES.PRODUCT,
                generatedAt: new Date().toISOString(),
                filters: this.enhanceFiltersWithSession(filters),
                summary,
                products: enhancedProducts,
                insights: recommendationsService.generateProductInsights(enhancedProducts, summary)
            };

            // Cache the report
            cacheService.cacheReport(cacheKey, report);

            return report;

        } catch (error) {
            console.error('Product report generation failed:', error);
            return this.createErrorReport(REPORT_TYPES.PRODUCT, filters, error as Error) as ProductReport;
        }
    }

    /**
     * Enhance filters with session information
     */
    private enhanceFiltersWithSession(filters: ReportFilters): ReportFilters {
        const sessionData = sessionService.getCurrentSessionData();
        return {
            ...filters,
            _sessionId: sessionData.sessionId,
            _userId: sessionData.userId,
            _generatedAt: new Date().toISOString()
        };
    }

    /**
     * Create error report structure
     */
    private createErrorReport(reportType: string, filters: ReportFilters, error: Error): any {
        return {
            success: false,
            error: error.message,
            reportType,
            generatedAt: new Date().toISOString(),
            filters: this.enhanceFiltersWithSession(filters),
            summary: {},
            insights: []
        };
    }
}

export const reportGenerationService = new ReportGenerationService();
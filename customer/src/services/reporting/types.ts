/**
 * Type definitions for Revenue Attribution Reporter Service
 */

export type ExportFormat = 'json' | 'csv' | 'xlsx';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type BidRecommendation = 'increase' | 'maintain' | 'decrease';
export type KeywordIntent = 'high' | 'medium' | 'low';
export type SearchVolume = 'high' | 'medium' | 'low';
export type CompetitionLevel = 'high' | 'medium' | 'low';
export type RevenueGrowthTrend = 'growing' | 'stable' | 'declining' | 'no_data';

export interface BaseReportItem {
    revenue: number;
    conversions: number;
    averageOrderValue: number;
}

export interface CampaignReportItem extends BaseReportItem {
    campaign: string;
    roas: number;
    costPerConversion: number;
    profitMargin: number;
    revenuePerClick: number;
    conversionRate: number;
    customerLifetimeValue: number;
    performanceGrade: PerformanceGrade;
    recommendations: string[];
}

export interface KeywordReportItem extends BaseReportItem {
    keyword: string;
    campaign: string;
    roas: number;
    searchVolume: SearchVolume;
    competitionLevel: CompetitionLevel;
    revenuePerConversion: number;
    keywordIntent: KeywordIntent;
    performanceScore: number;
    bidRecommendation: BidRecommendation;
    optimizationOpportunities: string[];
}

export interface ProductReportItem extends BaseReportItem {
    productName: string;
    conversionRate: number;
    profitMargin: number;
    seasonality: ProductSeasonality;
    revenueShare: number;
    growthRate: number;
    customerSegments: CustomerSegments;
    marketingEfficiency: number;
    recommendations: string[];
}

export interface ProductSeasonality {
    isHighlySeasonal: boolean;
    peakSeason: string;
    seasonalityScore: number;
}

export interface CustomerSegments {
    premium: number;
    standard: number;
    budget: number;
}

export interface PerformanceTiers {
    topPerformers: KeywordReportItem[];
    goodPerformers: KeywordReportItem[];
    underPerformers: KeywordReportItem[];
}

export interface CampaignReportSummary {
    totalCampaigns: number;
    totalRevenue: number;
    totalConversions: number;
    averageROAS: number;
    topPerformingCampaign: string;
    worstPerformingCampaign: string;
    revenueGrowthTrend: RevenueGrowthTrend;
}

export interface KeywordReportSummary {
    totalKeywords: number;
    totalRevenue: number;
    averagePerformanceScore: number;
    topKeyword: string;
    highIntentKeywords: number;
    performanceTiers: PerformanceTiers;
}

export interface ProductReportSummary {
    totalProducts: number;
    totalRevenue: number;
    topProduct: string;
    averageConversionRate: number;
    highestMargin: number;
    seasonalProducts: number;
}

export interface ReportFilters {
    dateFrom?: string;
    dateTo?: string;
    campaign?: string;
    product?: string;
    [key: string]: any;
}

export interface BaseReport<S> {
    success: boolean;
    reportType: string;
    generatedAt: string;
    filters: ReportFilters;
    summary: S;
    insights: string[];
    error?: string;
}

export interface CampaignReport extends BaseReport<CampaignReportSummary> {
    campaigns: CampaignReportItem[];
}

export interface KeywordReport extends BaseReport<KeywordReportSummary> {
    keywords: KeywordReportItem[];
    performanceTiers: PerformanceTiers;
}

export interface ProductReport extends BaseReport<ProductReportSummary> {
    products: ProductReportItem[];
}

export interface ExportResult {
    success: boolean;
    filename?: string;
    data?: string;
    mimeType?: string;
    size?: number;
    error?: string;
}

export interface RealTimeMetrics {
    success: boolean;
    metrics?: {
        last24Hours: {
            revenue: number;
            conversions: number;
            averageOrderValue: number;
        };
        topCampaign: string;
        topKeyword: string;
        lastUpdated: string;
    };
    error?: string;
}

export interface CachedReport {
    report: any;
    timestamp: number;
}
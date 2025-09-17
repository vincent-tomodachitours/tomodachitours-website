/**
 * Main Revenue Attribution Reporter Service
 * 
 * Provides comprehensive revenue attribution reporting by campaign and keyword.
 * Integrates with conversion value optimizer for detailed performance analysis.
 * 
 * Requirements: 8.3, 8.4
 */

import type {
    CampaignReport,
    KeywordReport,
    ProductReport,
    ExportResult,
    RealTimeMetrics,
    ReportFilters,
    ExportFormat
} from './types';

import { reportGenerationService } from './reportGenerationService';
import { cacheService } from './cacheService';
import { exportService } from '../shared/exportService';
import conversionValueOptimizer from '../conversionValueOptimizer';

export class RevenueAttributionReporter {
    /**
     * Generate comprehensive campaign performance report
     */
    async generateCampaignReport(filters: ReportFilters = {}): Promise<CampaignReport> {
        return reportGenerationService.generateCampaignReport(filters);
    }

    /**
     * Generate detailed keyword performance report
     */
    async generateKeywordReport(filters: ReportFilters = {}): Promise<KeywordReport> {
        return reportGenerationService.generateKeywordReport(filters);
    }

    /**
     * Generate product-level revenue attribution report
     */
    async generateProductReport(filters: ReportFilters = {}): Promise<ProductReport> {
        return reportGenerationService.generateProductReport(filters);
    }

    /**
     * Export report in specified format
     */
    async exportReport(
        report: CampaignReport | KeywordReport | ProductReport,
        format: ExportFormat = 'json'
    ): Promise<ExportResult> {
        return exportService.exportData(
            report,
            format,
            report.reportType,
            (data) => this.convertReportToCSV(data)
        );
    }

    /**
     * Get real-time performance metrics
     */
    getRealTimeMetrics(): RealTimeMetrics {
        try {
            const baseReport = conversionValueOptimizer.generateValueReport({
                dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
            }) as any;

            if (!baseReport.success) {
                return { success: false, error: 'Failed to get real-time data' };
            }

            return {
                success: true,
                metrics: {
                    last24Hours: {
                        revenue: baseReport.report.summary.totalRevenue,
                        conversions: baseReport.report.summary.totalConversions,
                        averageOrderValue: baseReport.report.summary.averageOrderValue
                    },
                    topCampaign: baseReport.report.byCampaign[0]?.campaign || 'N/A',
                    topKeyword: baseReport.report.byKeyword[0]?.keyword || 'N/A',
                    lastUpdated: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Real-time metrics failed:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Clear report cache
     */
    clearCache(): void {
        cacheService.clearCache();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return cacheService.getCacheStats();
    }

    /**
     * Convert report to CSV format (custom converter for export service)
     */
    private convertReportToCSV(report: CampaignReport | KeywordReport | ProductReport): string {
        let csv = '';

        if (report.reportType === 'campaign_performance') {
            const campaignReport = report as CampaignReport;
            csv = 'Campaign,Revenue,Conversions,Average Order Value,ROAS,Performance Grade\n';
            campaignReport.campaigns.forEach(campaign => {
                csv += `"${campaign.campaign}",${campaign.revenue},${campaign.conversions},${campaign.averageOrderValue},${campaign.roas.toFixed(2)},"${campaign.performanceGrade}"\n`;
            });
        } else if (report.reportType === 'keyword_performance') {
            const keywordReport = report as KeywordReport;
            csv = 'Keyword,Campaign,Revenue,Conversions,Performance Score,Intent,Recommendation\n';
            keywordReport.keywords.forEach(keyword => {
                csv += `"${keyword.keyword}","${keyword.campaign}",${keyword.revenue},${keyword.conversions},${keyword.performanceScore},"${keyword.keywordIntent}","${keyword.bidRecommendation}"\n`;
            });
        } else if (report.reportType === 'product_performance') {
            const productReport = report as ProductReport;
            csv = 'Product,Revenue,Conversions,Revenue Share,Profit Margin,Conversion Rate\n';
            productReport.products.forEach(product => {
                csv += `"${product.productName}",${product.revenue},${product.conversions},${product.revenueShare.toFixed(2)}%,${product.profitMargin.toFixed(2)}%,${(product.conversionRate * 100).toFixed(2)}%\n`;
            });
        }

        return csv;
    }
}

// Create singleton instance
const revenueAttributionReporter = new RevenueAttributionReporter();

export default revenueAttributionReporter;

// Re-export types for convenience
export type {
    CampaignReport,
    KeywordReport,
    ProductReport,
    ExportResult,
    RealTimeMetrics,
    ReportFilters,
    ExportFormat,
    CampaignReportItem,
    KeywordReportItem,
    ProductReportItem
} from './types';
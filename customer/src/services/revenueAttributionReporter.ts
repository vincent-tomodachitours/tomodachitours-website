/**
 * Revenue Attribution Reporter Service
 * 
 * Provides comprehensive revenue attribution reporting by campaign and keyword.
 * Integrates with conversion value optimizer for detailed performance analysis.
 * 
 * Requirements: 8.3, 8.4
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./reporting/
 */

// Re-export the new service for backward compatibility
export { default } from './reporting';
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
} from './reporting';
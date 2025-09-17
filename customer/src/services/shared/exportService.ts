/**
 * Shared Export Service
 * Provides export functionality for various report formats
 */

import type { ExportResult } from '../reporting/types';

export type ExportFormat = 'json' | 'csv' | 'xlsx';

export class ExportService {
    private readonly supportedFormats: ExportFormat[] = ['json', 'csv', 'xlsx'];

    /**
     * Export data in specified format
     */
    async exportData(
        data: any,
        format: ExportFormat,
        filename: string,
        customConverter?: (data: any) => string
    ): Promise<ExportResult> {
        try {
            if (!this.supportedFormats.includes(format)) {
                throw new Error(`Unsupported export format: ${format}`);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const finalFilename = `${filename}_${timestamp}.${format}`;

            let exportData: string;
            let mimeType: string;

            switch (format) {
                case 'json':
                    exportData = JSON.stringify(data, null, 2);
                    mimeType = 'application/json';
                    break;

                case 'csv':
                    exportData = customConverter ? customConverter(data) : this.convertToCSV(data);
                    mimeType = 'text/csv';
                    break;

                case 'xlsx':
                    // For XLSX, we'd need a library like xlsx or exceljs
                    // For now, return CSV format as fallback
                    exportData = customConverter ? customConverter(data) : this.convertToCSV(data);
                    mimeType = 'text/csv';
                    break;

                default:
                    throw new Error(`Export format ${format} not implemented`);
            }

            return {
                success: true,
                filename: finalFilename,
                data: exportData,
                mimeType,
                size: new Blob([exportData]).size
            };

        } catch (error) {
            console.error('Export failed:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Generic CSV converter for simple objects
     */
    private convertToCSV(data: any): string {
        if (!data || typeof data !== 'object') {
            return '';
        }

        // Handle array of objects
        if (Array.isArray(data)) {
            if (data.length === 0) return '';

            const headers = Object.keys(data[0]);
            let csv = headers.join(',') + '\n';

            data.forEach(item => {
                const values = headers.map(header => {
                    const value = item[header];
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csv += values.join(',') + '\n';
            });

            return csv;
        }

        // Handle single object
        const entries = Object.entries(data);
        let csv = 'Key,Value\n';
        entries.forEach(([key, value]) => {
            csv += `"${key}","${value}"\n`;
        });

        return csv;
    }

    /**
     * Create download link for exported data
     */
    createDownloadLink(exportResult: ExportResult): string | null {
        if (!exportResult.success || !exportResult.data || !exportResult.mimeType) {
            return null;
        }

        try {
            const blob = new Blob([exportResult.data], { type: exportResult.mimeType });
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Failed to create download link:', error);
            return null;
        }
    }

    /**
     * Get supported export formats
     */
    getSupportedFormats(): ExportFormat[] {
        return [...this.supportedFormats];
    }
}

export const exportService = new ExportService();
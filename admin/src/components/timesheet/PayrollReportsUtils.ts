import { PayrollSummary } from '../../types';

/**
 * Generate CSV content from payroll summary
 * This function is extracted for easier testing and reuse
 */
export const generatePayrollCSV = (payrollSummary: PayrollSummary): string => {
    // Create CSV headers
    const csvHeaders = [
        'Employee Name',
        'Month',
        'Year',
        'Date',
        'Clock In',
        'Clock Out',
        'Hours Worked',
        'Todo',
        'Note'
    ];

    const csvRows = [
        csvHeaders.join(','),
        // Summary row
        [
            `"${payrollSummary.employee_name}"`,
            `"${payrollSummary.month}"`,
            payrollSummary.year.toString(),
            'SUMMARY',
            `Total Shifts: ${payrollSummary.total_shifts}`,
            `Total Hours: ${payrollSummary.total_hours}`,
            `Avg Shift: ${payrollSummary.average_shift_length}h`,
            '',
            ''
        ].join(','),
        // Empty row for separation
        '',
        // Individual shift rows
        ...payrollSummary.shifts.map(shift => [
            `"${payrollSummary.employee_name}"`,
            `"${payrollSummary.month}"`,
            payrollSummary.year.toString(),
            `"${shift.date}"`,
            `"${shift.clock_in}"`,
            `"${shift.clock_out || 'N/A'}"`,
            (shift.hours_worked || 0).toString(),
            `"${shift.todo || ''}"`,
            `"${shift.note || ''}"`
        ].join(','))
    ];

    return csvRows.join('\n');
};

/**
 * Generate filename for payroll CSV download
 */
export const generatePayrollFilename = (payrollSummary: PayrollSummary): string => {
    const employeeName = payrollSummary.employee_name.replace(/\s+/g, '_');
    return `payroll_${employeeName}_${payrollSummary.month}_${payrollSummary.year}.csv`;
};

/**
 * Download CSV file with given content and filename
 */
export const downloadCSVFile = (csvContent: string, filename: string): void => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};
import { generatePayrollCSV, generatePayrollFilename } from './PayrollReportsUtils';
import { PayrollSummary } from '../../types';

// Mock data for testing
const mockPayrollSummary: PayrollSummary = {
    employee_id: '1',
    employee_name: 'John Doe',
    month: 'January',
    year: 2024,
    total_hours: 40.5,
    total_shifts: 5,
    average_shift_length: 8.1,
    shifts: [
        {
            date: '1/1/2024',
            clock_in: '9:00:00 AM',
            clock_out: '5:00:00 PM',
            hours_worked: 8,
            todo: 'Morning tour prep',
            note: 'Good day'
        },
        {
            date: '1/2/2024',
            clock_in: '9:00:00 AM',
            clock_out: '5:30:00 PM',
            hours_worked: 8.5,
            todo: 'Equipment check',
            note: 'Late finish'
        }
    ]
};

describe('PayrollReportsUtils', () => {
    describe('generatePayrollCSV', () => {
        it('should generate correct CSV content', () => {
            const csvContent = generatePayrollCSV(mockPayrollSummary);

            // Check that CSV contains headers
            expect(csvContent).toContain('Employee Name,Month,Year,Date,Clock In,Clock Out,Hours Worked,Todo,Note');

            // Check that CSV contains summary row
            expect(csvContent).toContain('"John Doe","January",2024,SUMMARY,Total Shifts: 5,Total Hours: 40.5,Avg Shift: 8.1h,,');

            // Check that CSV contains shift data
            expect(csvContent).toContain('"John Doe","January",2024,"1/1/2024","9:00:00 AM","5:00:00 PM",8,"Morning tour prep","Good day"');
            expect(csvContent).toContain('"John Doe","January",2024,"1/2/2024","9:00:00 AM","5:30:00 PM",8.5,"Equipment check","Late finish"');
        });

        it('should handle empty shifts array', () => {
            const emptyPayrollSummary: PayrollSummary = {
                ...mockPayrollSummary,
                total_hours: 0,
                total_shifts: 0,
                average_shift_length: 0,
                shifts: []
            };

            const csvContent = generatePayrollCSV(emptyPayrollSummary);

            // Should still contain headers and summary
            expect(csvContent).toContain('Employee Name,Month,Year,Date,Clock In,Clock Out,Hours Worked,Todo,Note');
            expect(csvContent).toContain('"John Doe","January",2024,SUMMARY,Total Shifts: 0,Total Hours: 0,Avg Shift: 0h,,');
        });

        it('should handle shifts with missing data', () => {
            const payrollWithMissingData: PayrollSummary = {
                ...mockPayrollSummary,
                shifts: [
                    {
                        date: '1/1/2024',
                        clock_in: '9:00:00 AM',
                        // Missing clock_out, hours_worked, todo, note
                    }
                ]
            };

            const csvContent = generatePayrollCSV(payrollWithMissingData);

            // Should handle missing data gracefully
            expect(csvContent).toContain('"John Doe","January",2024,"1/1/2024","9:00:00 AM","N/A",0,"",""');
        });
    });

    describe('generatePayrollFilename', () => {
        it('should generate correct filename', () => {
            const filename = generatePayrollFilename(mockPayrollSummary);
            expect(filename).toBe('payroll_John_Doe_January_2024.csv');
        });

        it('should handle employee names with multiple spaces', () => {
            const payrollWithSpaces: PayrollSummary = {
                ...mockPayrollSummary,
                employee_name: 'John   Middle   Doe'
            };

            const filename = generatePayrollFilename(payrollWithSpaces);
            expect(filename).toBe('payroll_John_Middle_Doe_January_2024.csv');
        });

        it('should handle special characters in employee name', () => {
            const payrollWithSpecialChars: PayrollSummary = {
                ...mockPayrollSummary,
                employee_name: 'John O\'Connor-Smith'
            };

            const filename = generatePayrollFilename(payrollWithSpecialChars);
            expect(filename).toBe('payroll_John_O\'Connor-Smith_January_2024.csv');
        });
    });
});

// Manual test function for CSV generation (can be called from console)
export const testCSVGeneration = () => {
    console.log('Testing CSV generation...');

    const csvContent = generatePayrollCSV(mockPayrollSummary);
    console.log('Generated CSV content:');
    console.log(csvContent);

    const filename = generatePayrollFilename(mockPayrollSummary);
    console.log('Generated filename:', filename);

    return { csvContent, filename };
};
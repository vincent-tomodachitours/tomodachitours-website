import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayrollReports } from '../PayrollReports';
import { EmployeeService } from '../../../services/employeeService';
import { TimesheetService } from '../../../services/timesheetService';
import { generatePayrollCSV, generatePayrollFilename, downloadCSVFile } from '../PayrollReportsUtils';
import { Employee, PayrollSummary } from '../../../types';

// Mock dependencies
jest.mock('../../../services/employeeService');
jest.mock('../../../services/timesheetService');
jest.mock('../PayrollReportsUtils');

// Mock Button component
jest.mock('../../ui/Button', () => ({
    Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={className}
            data-testid="button"
            data-variant={variant}
            {...props}
        >
            {children}
        </button>
    )
}));

const mockEmployees: Employee[] = [
    {
        id: 'emp-1',
        user_id: 'user-1',
        employee_code: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        role: 'tour_guide',
        status: 'active',
        hire_date: '2024-01-01',
        tour_types: ['NIGHT_TOUR'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 'emp-2',
        user_id: 'user-2',
        employee_code: 'EMP002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        role: 'tour_guide',
        status: 'active',
        hire_date: '2024-01-01',
        tour_types: ['MORNING_TOUR'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }
];

const mockPayrollSummary: PayrollSummary = {
    employee_id: 'emp-1',
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

const mockEmptyPayrollSummary: PayrollSummary = {
    employee_id: 'emp-1',
    employee_name: 'John Doe',
    month: 'January',
    year: 2024,
    total_hours: 0,
    total_shifts: 0,
    average_shift_length: 0,
    shifts: []
};

describe('PayrollReports', () => {
    const mockEmployeeService = EmployeeService as jest.Mocked<typeof EmployeeService>;
    const mockTimesheetService = TimesheetService as jest.Mocked<typeof TimesheetService>;
    const mockGeneratePayrollCSV = generatePayrollCSV as jest.MockedFunction<typeof generatePayrollCSV>;
    const mockGeneratePayrollFilename = generatePayrollFilename as jest.MockedFunction<typeof generatePayrollFilename>;
    const mockDownloadCSVFile = downloadCSVFile as jest.MockedFunction<typeof downloadCSVFile>;

    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy.mockClear();

        // Default mocks
        mockEmployeeService.getEmployees.mockResolvedValue(mockEmployees);
        mockTimesheetService.getPayrollSummary.mockResolvedValue(mockPayrollSummary);
        mockGeneratePayrollCSV.mockReturnValue('csv,content');
        mockGeneratePayrollFilename.mockReturnValue('payroll_John_Doe_January_2024.csv');
        mockDownloadCSVFile.mockImplementation(() => { });

        // Mock current date
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
        consoleSpy.mockRestore();
    });

    describe('Component Initialization', () => {
        it('should render payroll reports interface', async () => {
            render(<PayrollReports />);

            expect(screen.getByText('Payroll Reports')).toBeInTheDocument();
            expect(screen.getByLabelText('Employee')).toBeInTheDocument();
            expect(screen.getByLabelText('Month')).toBeInTheDocument();
            expect(screen.getByLabelText('Year')).toBeInTheDocument();
            expect(screen.getByText('Generate Report')).toBeInTheDocument();
        });

        it('should load active employees on mount', async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(mockEmployeeService.getEmployees).toHaveBeenCalledWith({
                    status: ['active']
                });
            });

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith (EMP002)')).toBeInTheDocument();
            });
        });

        it('should set current month and year as defaults', () => {
            render(<PayrollReports />);

            const monthSelect = screen.getByLabelText('Month') as HTMLSelectElement;
            const yearSelect = screen.getByLabelText('Year') as HTMLSelectElement;

            expect(monthSelect.value).toBe('1'); // January (current month in mock)
            expect(yearSelect.value).toBe('2024'); // Current year in mock
        });

        it('should handle employee loading error', async () => {
            mockEmployeeService.getEmployees.mockRejectedValue(new Error('Failed to load'));

            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load employees')).toBeInTheDocument();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error loading employees:', expect.any(Error));
        });
    });

    describe('Form Interactions', () => {
        it('should update selected employee', async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            expect((employeeSelect as HTMLSelectElement).value).toBe('emp-1');
        });

        it('should update selected month', () => {
            render(<PayrollReports />);

            const monthSelect = screen.getByLabelText('Month');
            fireEvent.change(monthSelect, { target: { value: '6' } });

            expect((monthSelect as HTMLSelectElement).value).toBe('6');
        });

        it('should update selected year', () => {
            render(<PayrollReports />);

            const yearSelect = screen.getByLabelText('Year');
            fireEvent.change(yearSelect, { target: { value: '2023' } });

            expect((yearSelect as HTMLSelectElement).value).toBe('2023');
        });

        it('should disable generate button when no employee selected', () => {
            render(<PayrollReports />);

            const generateButton = screen.getByText('Generate Report');
            expect(generateButton).toBeDisabled();
        });

        it('should enable generate button when employee is selected', async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            expect(generateButton).not.toBeDisabled();
        });
    });

    describe('Payroll Summary Generation', () => {
        it('should generate payroll summary successfully', async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(mockTimesheetService.getPayrollSummary).toHaveBeenCalledWith('emp-1', 1, 2024);
            });

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('40.5h')).toBeInTheDocument();
                expect(screen.getByText('5')).toBeInTheDocument();
                expect(screen.getByText('8.1h')).toBeInTheDocument();
            });
        });

        it('should show loading state during generation', async () => {
            mockTimesheetService.getPayrollSummary.mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            expect(screen.getByText('Generating...')).toBeInTheDocument();
            expect(generateButton).toBeDisabled();
        });

        it('should show error when no employee selected', async () => {
            render(<PayrollReports />);

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('Please select an employee')).toBeInTheDocument();
            });

            expect(mockTimesheetService.getPayrollSummary).not.toHaveBeenCalled();
        });

        it('should handle payroll generation error', async () => {
            mockTimesheetService.getPayrollSummary.mockRejectedValue(new Error('Generation failed'));

            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to generate payroll summary')).toBeInTheDocument();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error generating payroll summary:', expect.any(Error));
        });

        it('should show message when no data found', async () => {
            mockTimesheetService.getPayrollSummary.mockResolvedValue(mockEmptyPayrollSummary);

            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('No timesheet data found for John Doe in January 2024')).toBeInTheDocument();
                expect(screen.getByText('No Data Available')).toBeInTheDocument();
                expect(screen.getByText('No timesheet entries found for the selected employee and period.')).toBeInTheDocument();
            });
        });
    });

    describe('Payroll Summary Display', () => {
        beforeEach(async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });
        });

        it('should display summary cards', () => {
            expect(screen.getByText('Employee')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Total Hours')).toBeInTheDocument();
            expect(screen.getByText('40.5h')).toBeInTheDocument();
            expect(screen.getByText('Total Shifts')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Avg Shift Length')).toBeInTheDocument();
            expect(screen.getByText('8.1h')).toBeInTheDocument();
        });

        it('should display detailed shifts table', () => {
            expect(screen.getByText('Detailed Shifts - January 2024')).toBeInTheDocument();
            expect(screen.getByText('Date')).toBeInTheDocument();
            expect(screen.getByText('Clock In')).toBeInTheDocument();
            expect(screen.getByText('Clock Out')).toBeInTheDocument();
            expect(screen.getByText('Hours')).toBeInTheDocument();
            expect(screen.getByText('Todo')).toBeInTheDocument();
            expect(screen.getByText('Note')).toBeInTheDocument();

            // Check shift data
            expect(screen.getByText('1/1/2024')).toBeInTheDocument();
            expect(screen.getByText('9:00:00 AM')).toBeInTheDocument();
            expect(screen.getByText('5:00:00 PM')).toBeInTheDocument();
            expect(screen.getByText('8h')).toBeInTheDocument();
            expect(screen.getByText('Morning tour prep')).toBeInTheDocument();
            expect(screen.getByText('Good day')).toBeInTheDocument();

            expect(screen.getByText('1/2/2024')).toBeInTheDocument();
            expect(screen.getByText('5:30:00 PM')).toBeInTheDocument();
            expect(screen.getByText('8.5h')).toBeInTheDocument();
            expect(screen.getByText('Equipment check')).toBeInTheDocument();
            expect(screen.getByText('Late finish')).toBeInTheDocument();
        });

        it('should handle missing shift data gracefully', async () => {
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

            mockTimesheetService.getPayrollSummary.mockResolvedValue(payrollWithMissingData);

            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('N/A')).toBeInTheDocument(); // For missing clock_out
                expect(screen.getAllByText('-')).toHaveLength(2); // For missing todo and note
            });
        });
    });

    describe('CSV Download', () => {
        beforeEach(async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('Download CSV')).toBeInTheDocument();
            });
        });

        it('should show download button after successful generation', () => {
            expect(screen.getByText('Download CSV')).toBeInTheDocument();
        });

        it('should download CSV when button clicked', () => {
            const downloadButton = screen.getByText('Download CSV');
            fireEvent.click(downloadButton);

            expect(mockGeneratePayrollCSV).toHaveBeenCalledWith(mockPayrollSummary);
            expect(mockGeneratePayrollFilename).toHaveBeenCalledWith(mockPayrollSummary);
            expect(mockDownloadCSVFile).toHaveBeenCalledWith('csv,content', 'payroll_John_Doe_January_2024.csv');
        });

        it('should show loading state during CSV generation', () => {
            mockGeneratePayrollCSV.mockImplementation(() => {
                // Simulate slow CSV generation
                return 'csv,content';
            });

            const downloadButton = screen.getByText('Download CSV');
            fireEvent.click(downloadButton);

            // The button text should change briefly during generation
            expect(downloadButton).toBeDisabled();
        });

        it('should handle CSV generation error', () => {
            mockGeneratePayrollCSV.mockImplementation(() => {
                throw new Error('CSV generation failed');
            });

            const downloadButton = screen.getByText('Download CSV');
            fireEvent.click(downloadButton);

            expect(screen.getByText('Failed to generate CSV file')).toBeInTheDocument();
            expect(consoleSpy).toHaveBeenCalledWith('Error generating CSV:', expect.any(Error));
        });

        it('should not show download button when no data available', async () => {
            mockTimesheetService.getPayrollSummary.mockResolvedValue(mockEmptyPayrollSummary);

            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.getByText('No Data Available')).toBeInTheDocument();
            });

            expect(screen.queryByText('Download CSV')).not.toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        it('should show validation error when trying to generate without employee', () => {
            render(<PayrollReports />);

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            expect(screen.getByText('Please select an employee')).toBeInTheDocument();
        });

        it('should clear error when employee is selected', async () => {
            render(<PayrollReports />);

            // First trigger the error
            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            expect(screen.getByText('Please select an employee')).toBeInTheDocument();

            // Then select an employee
            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(screen.queryByText('Please select an employee')).not.toBeInTheDocument();
            });
        });
    });

    describe('Month and Year Options', () => {
        it('should display all 12 months', () => {
            render(<PayrollReports />);

            const monthSelect = screen.getByLabelText('Month');
            const options = monthSelect.querySelectorAll('option');

            expect(options).toHaveLength(12); // 12 months
            expect(options[0]).toHaveTextContent('January');
            expect(options[11]).toHaveTextContent('December');
        });

        it('should display last 5 years including current year', () => {
            render(<PayrollReports />);

            const yearSelect = screen.getByLabelText('Year');
            const options = yearSelect.querySelectorAll('option');

            expect(options).toHaveLength(5);
            expect(options[0]).toHaveTextContent('2024'); // Current year
            expect(options[4]).toHaveTextContent('2020'); // 4 years back
        });
    });

    describe('Accessibility', () => {
        it('should have proper labels for form elements', () => {
            render(<PayrollReports />);

            expect(screen.getByLabelText('Employee')).toBeInTheDocument();
            expect(screen.getByLabelText('Month')).toBeInTheDocument();
            expect(screen.getByLabelText('Year')).toBeInTheDocument();
        });

        it('should have proper table headers', async () => {
            render(<PayrollReports />);

            await waitFor(() => {
                expect(screen.getByText('John Doe (EMP001)')).toBeInTheDocument();
            });

            const employeeSelect = screen.getByLabelText('Employee');
            fireEvent.change(employeeSelect, { target: { value: 'emp-1' } });

            const generateButton = screen.getByText('Generate Report');
            fireEvent.click(generateButton);

            await waitFor(() => {
                const table = screen.getByRole('table');
                expect(table).toBeInTheDocument();

                const headers = screen.getAllByRole('columnheader');
                expect(headers).toHaveLength(6);
                expect(headers[0]).toHaveTextContent('Date');
                expect(headers[1]).toHaveTextContent('Clock In');
                expect(headers[2]).toHaveTextContent('Clock Out');
                expect(headers[3]).toHaveTextContent('Hours');
                expect(headers[4]).toHaveTextContent('Todo');
                expect(headers[5]).toHaveTextContent('Note');
            });
        });
    });
});
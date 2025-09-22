import React, { useState, useEffect } from 'react';
import { Employee, PayrollSummary } from '../../types';
import { EmployeeService } from '../../services/employeeService';
import { TimesheetService } from '../../services/timesheetService';
import { Button } from '../ui/Button';
import { generatePayrollCSV, generatePayrollFilename, downloadCSVFile } from './PayrollReportsUtils';

interface PayrollReportsProps {
    className?: string;
}

export const PayrollReports: React.FC<PayrollReportsProps> = ({ className = '' }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Load active employees on component mount
    useEffect(() => {
        loadActiveEmployees();
    }, []);

    const loadActiveEmployees = async () => {
        try {
            const activeEmployees = await EmployeeService.getEmployees({
                status: ['active']
            });
            setEmployees(activeEmployees);
        } catch (err) {
            console.error('Error loading employees:', err);
            setError('Failed to load employees');
        }
    };

    const generatePayrollSummary = async () => {
        if (!selectedEmployeeId) {
            setError('Please select an employee');
            return;
        }

        setLoading(true);
        setError(null);
        setPayrollSummary(null);

        try {
            const summary = await TimesheetService.getPayrollSummary(
                selectedEmployeeId,
                selectedMonth,
                selectedYear
            );
            setPayrollSummary(summary);

            // Show message if no data found
            if (summary.total_shifts === 0) {
                setError(`No timesheet data found for ${summary.employee_name} in ${summary.month} ${summary.year}`);
            }
        } catch (err) {
            console.error('Error generating payroll summary:', err);
            setError('Failed to generate payroll summary');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!payrollSummary) return;

        setIsGenerating(true);

        try {
            const csvContent = generatePayrollCSV(payrollSummary);
            const filename = generatePayrollFilename(payrollSummary);
            downloadCSVFile(csvContent, filename);
        } catch (err) {
            console.error('Error generating CSV:', err);
            setError('Failed to generate CSV file');
        } finally {
            setIsGenerating(false);
        }
    };

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payroll Reports</h2>

            {/* Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Employee Selection */}
                <div>
                    <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Employee
                    </label>
                    <select
                        id="employee-select"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select an employee</option>
                        {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.first_name} {employee.last_name} ({employee.employee_code})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Month Selection */}
                <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Month
                    </label>
                    <select
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {months.map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Year Selection */}
                <div>
                    <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Year
                    </label>
                    <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Generate Button */}
            <div className="mb-6">
                <Button
                    onClick={generatePayrollSummary}
                    disabled={loading || !selectedEmployeeId}
                    className="mr-4"
                >
                    {loading ? 'Generating...' : 'Generate Report'}
                </Button>

                {payrollSummary && payrollSummary.total_shifts > 0 && (
                    <Button
                        onClick={downloadCSV}
                        disabled={isGenerating}
                        variant="ghost"
                    >
                        {isGenerating ? 'Downloading...' : 'Download CSV'}
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Payroll Summary Display */}
            {payrollSummary && payrollSummary.total_shifts > 0 && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800">Employee</h3>
                            <p className="text-lg font-semibold text-blue-900">{payrollSummary.employee_name}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-green-800">Total Hours</h3>
                            <p className="text-lg font-semibold text-green-900">{payrollSummary.total_hours}h</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-purple-800">Total Shifts</h3>
                            <p className="text-lg font-semibold text-purple-900">{payrollSummary.total_shifts}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-orange-800">Avg Shift Length</h3>
                            <p className="text-lg font-semibold text-orange-900">{payrollSummary.average_shift_length}h</p>
                        </div>
                    </div>

                    {/* Detailed Shifts Table */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Detailed Shifts - {payrollSummary.month} {payrollSummary.year}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Clock In
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Clock Out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hours
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Todo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Note
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {payrollSummary.shifts.map((shift, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.clock_in}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.clock_out || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.hours_worked ? `${shift.hours_worked}h` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {shift.todo || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {shift.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {payrollSummary && payrollSummary.total_shifts === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-500">
                        No timesheet entries found for the selected employee and period.
                    </p>
                </div>
            )}
        </div>
    );
};
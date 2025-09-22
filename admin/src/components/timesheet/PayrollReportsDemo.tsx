import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PayrollReports } from './PayrollReports';
import { AdminAuthProvider } from '../../contexts/AdminAuthContext';

// Create a demo query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
});

/**
 * Demo component to test PayrollReports functionality
 * This can be used for manual testing and development
 */
export const PayrollReportsDemo: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AdminAuthProvider>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-6xl mx-auto px-4">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Payroll Reports Demo
                        </h1>

                        <PayrollReports className="mb-6" />

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h2 className="text-lg font-medium text-gray-900 mb-2">
                                Demo Instructions
                            </h2>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Make sure you're logged in as an admin or manager</li>
                                <li>• Select an employee from the dropdown</li>
                                <li>• Choose a month and year for the report</li>
                                <li>• Click "Generate Report" to view payroll summary</li>
                                <li>• If data exists, you can download it as CSV</li>
                                <li>• The component handles empty data periods gracefully</li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mt-4">
                            <h3 className="text-md font-medium text-blue-900 mb-2">
                                Features Demonstrated
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✓ Employee selection dropdown with active employees</li>
                                <li>✓ Month/year picker for report period selection</li>
                                <li>✓ Payroll summary calculation with total hours and shifts</li>
                                <li>✓ CSV export functionality for download</li>
                                <li>✓ Error handling for empty data periods</li>
                                <li>✓ Loading states and user feedback</li>
                                <li>✓ Responsive design with Tailwind CSS</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </AdminAuthProvider>
        </QueryClientProvider>
    );
};
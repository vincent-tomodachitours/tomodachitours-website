import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClockInOutWidget } from './ClockInOutWidget';
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
 * Demo component to test ClockInOutWidget functionality
 * This can be used for manual testing and development
 */
export const ClockInOutDemo: React.FC = () => {
    const handleStatusChange = (isActive: boolean) => {
        console.log('Clock status changed:', isActive ? 'Clocked In' : 'Clocked Out');
    };

    return (
        <QueryClientProvider client={queryClient}>
            <AdminAuthProvider>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-md mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Clock In/Out Widget Demo
                        </h1>

                        <ClockInOutWidget
                            onStatusChange={handleStatusChange}
                            className="mb-6"
                        />

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h2 className="text-lg font-medium text-gray-900 mb-2">
                                Demo Instructions
                            </h2>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Make sure you're logged in as an employee</li>
                                <li>• Click "Clock In" to start a shift</li>
                                <li>• Optionally add a todo for your shift</li>
                                <li>• Click "Clock Out" to end your shift</li>
                                <li>• Optionally add notes about your shift</li>
                                <li>• Check browser console for status change events</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </AdminAuthProvider>
        </QueryClientProvider>
    );
};
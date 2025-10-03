import React from 'react';
import Navigation from './Navigation';
import BookingRequestMonitoringAlert from '../ui/BookingRequestMonitoringAlert';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { hasPermission } = useAdminAuth();
    
    // Only show monitoring alerts for users who can manage booking requests
    const showMonitoring = hasPermission('edit_bookings');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            {showMonitoring && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <BookingRequestMonitoringAlert />
                </div>
            )}
            <main>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout; 
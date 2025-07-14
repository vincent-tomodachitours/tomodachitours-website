import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Permission, EmployeeRole } from '../../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: Permission;
    requiredRole?: EmployeeRole;
}

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

const AccessDenied: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
            <div className="rounded-md bg-red-50 p-6">
                <h2 className="text-lg font-medium text-red-900 mb-2">Access Denied</h2>
                <p className="text-sm text-red-700">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
            </div>
        </div>
    </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermission,
    requiredRole
}) => {
    const { employee, loading, hasPermission, hasRole } = useAdminAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!employee) {
        // Redirect to login with the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if employee account is active
    if (employee.status !== 'active') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full text-center">
                    <div className="rounded-md bg-yellow-50 p-6">
                        <h2 className="text-lg font-medium text-yellow-900 mb-2">Account Inactive</h2>
                        <p className="text-sm text-yellow-700">
                            Your account is currently inactive. Please contact your administrator.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
        return <AccessDenied />;
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <AccessDenied />;
    }

    return <>{children}</>;
};

export default ProtectedRoute; 
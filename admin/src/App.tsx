import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './contexts/QueryProvider';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import { BookingList, EmployeeBookingsCalendar } from './pages/bookings';
import { AvailabilityCalendar } from './pages/availability';
import EmployeeList from './pages/employees/EmployeeList';
import { ShiftCalendar } from './pages/schedule';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import { TourList } from './pages/tours';
import { TimesheetDashboard, TimesheetTable } from './pages/timesheet';
import { BookingRequestsDashboard } from './pages/booking-requests';
import BookingRequestAnalytics from './pages/booking-requests/BookingRequestAnalytics';

// Conditional Bookings component based on user role
const BookingsPage: React.FC = () => {
    const { hasPermission } = useAdminAuth();

    // Show admin booking list for admins/managers, employee calendar for tour guides
    if (hasPermission('manage_employees') || hasPermission('edit_bookings')) {
        return <BookingList />;
    } else {
        return <EmployeeBookingsCalendar />;
    }
};

// Redirect component to handle root route
const RootRedirect: React.FC = () => {
    const { employee, loading } = useAdminAuth();

    console.log('🔀 RootRedirect - Loading:', loading, 'Employee:', !!employee);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading authentication...</p>
                </div>
            </div>
        );
    }

    const redirectTo = employee ? "/dashboard" : "/login";
    console.log('🔀 RootRedirect - Redirecting to:', redirectTo);

    return <Navigate to={redirectTo} replace />;
};

function App() {
    return (
        <QueryProvider>
            <AdminAuthProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50">
                        <Routes>
                            {/* Root redirect */}
                            <Route path="/" element={<RootRedirect />} />

                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />

                            {/* Protected routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <Dashboard />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Placeholder for future routes */}
                            <Route
                                path="/bookings"
                                element={
                                    <ProtectedRoute requiredPermission="view_bookings">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <BookingsPage />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/availability"
                                element={
                                    <ProtectedRoute requiredPermission="manage_own_availability">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <AvailabilityCalendar />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/employees"
                                element={
                                    <ProtectedRoute requiredPermission="manage_employees">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <EmployeeList />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/schedule"
                                element={
                                    <ProtectedRoute requiredPermission="manage_employees">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <ShiftCalendar />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/tours"
                                element={
                                    <ProtectedRoute requiredPermission="manage_tours">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <TourList />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/analytics"
                                element={
                                    <ProtectedRoute requiredPermission="view_analytics">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <AnalyticsDashboard />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/timesheet"
                                element={
                                    <ProtectedRoute>
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <TimesheetDashboard />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/timesheet/manage"
                                element={
                                    <ProtectedRoute requiredPermission="manage_employees">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <TimesheetTable />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/booking-requests"
                                element={
                                    <ProtectedRoute requiredPermission="edit_bookings">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <BookingRequestsDashboard />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/booking-requests/analytics"
                                element={
                                    <ProtectedRoute requiredPermission="edit_bookings">
                                        <AdminLayout>
                                            <div className="py-6">
                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                    <BookingRequestAnalytics />
                                                </div>
                                            </div>
                                        </AdminLayout>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Catch-all route */}
                            <Route
                                path="*"
                                element={
                                    <div className="min-h-screen flex items-center justify-center">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
                                            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                                        </div>
                                    </div>
                                }
                            />
                        </Routes>


                    </div>
                </Router>
            </AdminAuthProvider>
        </QueryProvider>
    );
}

export default App; 
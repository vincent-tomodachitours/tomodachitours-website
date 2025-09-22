import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { Employee, Permission, EmployeeRole } from '../../../types';

// Mock the AdminAuthContext
jest.mock('../../../contexts/AdminAuthContext');

const mockEmployee: Employee = {
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
};

const TestComponent: React.FC = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            {component}
        </MemoryRouter>
    );
};

describe('ProtectedRoute', () => {
    const mockUseAdminAuth = useAdminAuth as jest.MockedFunction<typeof useAdminAuth>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Loading State', () => {
        it('should show loading spinner when auth is loading', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: null,
                loading: true,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('Authentication', () => {
        it('should redirect to login when user is not authenticated', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: null,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>,
                ['/protected']
            );

            // Should not render protected content
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should render protected content when user is authenticated', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn().mockReturnValue(true),
                hasRole: jest.fn().mockReturnValue(true)
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    describe('Employee Status', () => {
        it('should show inactive account message when employee is inactive', () => {
            const inactiveEmployee = { ...mockEmployee, status: 'inactive' as const };

            mockUseAdminAuth.mockReturnValue({
                employee: inactiveEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Account Inactive')).toBeInTheDocument();
            expect(screen.getByText('Your account is currently inactive. Please contact your administrator.')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should show inactive account message when employee is suspended', () => {
            const suspendedEmployee = { ...mockEmployee, status: 'suspended' as const };

            mockUseAdminAuth.mockReturnValue({
                employee: suspendedEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Account Inactive')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should show inactive account message when employee is terminated', () => {
            const terminatedEmployee = { ...mockEmployee, status: 'terminated' as const };

            mockUseAdminAuth.mockReturnValue({
                employee: terminatedEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Account Inactive')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should allow access when employee is active', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn().mockReturnValue(true),
                hasRole: jest.fn().mockReturnValue(true)
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    describe('Permission-based Access Control', () => {
        it('should allow access when user has required permission', () => {
            const mockHasPermission = jest.fn((permission: Permission) => {
                return permission === 'manage_employees';
            });

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: jest.fn().mockReturnValue(true)
            });

            renderWithRouter(
                <ProtectedRoute requiredPermission="manage_employees">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasPermission).toHaveBeenCalledWith('manage_employees');
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });

        it('should deny access when user lacks required permission', () => {
            const mockHasPermission = jest.fn((permission: Permission) => {
                return permission !== 'manage_employees';
            });

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: jest.fn().mockReturnValue(true)
            });

            renderWithRouter(
                <ProtectedRoute requiredPermission="manage_employees">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasPermission).toHaveBeenCalledWith('manage_employees');
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.getByText("You don't have permission to access this page. Please contact your administrator if you believe this is an error.")).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should test multiple permission scenarios', () => {
            const testCases: Array<{
                permission: Permission;
                hasPermission: boolean;
                shouldAllow: boolean;
            }> = [
                    { permission: 'view_bookings', hasPermission: true, shouldAllow: true },
                    { permission: 'view_bookings', hasPermission: false, shouldAllow: false },
                    { permission: 'edit_bookings', hasPermission: true, shouldAllow: true },
                    { permission: 'edit_bookings', hasPermission: false, shouldAllow: false },
                    { permission: 'manage_tours', hasPermission: true, shouldAllow: true },
                    { permission: 'manage_tours', hasPermission: false, shouldAllow: false },
                    { permission: 'manage_employees', hasPermission: true, shouldAllow: true },
                    { permission: 'manage_employees', hasPermission: false, shouldAllow: false },
                    { permission: 'view_analytics', hasPermission: true, shouldAllow: true },
                    { permission: 'view_analytics', hasPermission: false, shouldAllow: false },
                    { permission: 'manage_own_availability', hasPermission: true, shouldAllow: true },
                    { permission: 'manage_own_availability', hasPermission: false, shouldAllow: false },
                    { permission: 'view_timesheets', hasPermission: true, shouldAllow: true },
                    { permission: 'view_timesheets', hasPermission: false, shouldAllow: false },
                    { permission: 'manage_timesheets', hasPermission: true, shouldAllow: true },
                    { permission: 'manage_timesheets', hasPermission: false, shouldAllow: false },
                    { permission: 'system_admin', hasPermission: true, shouldAllow: true },
                    { permission: 'system_admin', hasPermission: false, shouldAllow: false }
                ];

            testCases.forEach(({ permission, hasPermission, shouldAllow }) => {
                const mockHasPermission = jest.fn().mockReturnValue(hasPermission);

                mockUseAdminAuth.mockReturnValue({
                    employee: mockEmployee,
                    loading: false,
                    signIn: jest.fn(),
                    signOut: jest.fn(),
                    hasPermission: mockHasPermission,
                    hasRole: jest.fn().mockReturnValue(true)
                });

                const { unmount } = renderWithRouter(
                    <ProtectedRoute requiredPermission={permission}>
                        <TestComponent />
                    </ProtectedRoute>
                );

                if (shouldAllow) {
                    expect(screen.getByText('Protected Content')).toBeInTheDocument();
                } else {
                    expect(screen.getByText('Access Denied')).toBeInTheDocument();
                    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
                }

                unmount();
            });
        });
    });

    describe('Role-based Access Control', () => {
        it('should allow access when user has required role', () => {
            const mockHasRole = jest.fn((role: EmployeeRole) => {
                return role === 'admin';
            });

            mockUseAdminAuth.mockReturnValue({
                employee: { ...mockEmployee, role: 'admin' },
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn().mockReturnValue(true),
                hasRole: mockHasRole
            });

            renderWithRouter(
                <ProtectedRoute requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasRole).toHaveBeenCalledWith('admin');
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });

        it('should deny access when user lacks required role', () => {
            const mockHasRole = jest.fn((role: EmployeeRole) => {
                return role !== 'admin';
            });

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn().mockReturnValue(true),
                hasRole: mockHasRole
            });

            renderWithRouter(
                <ProtectedRoute requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasRole).toHaveBeenCalledWith('admin');
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should test multiple role scenarios', () => {
            const testCases: Array<{
                requiredRole: EmployeeRole;
                userRole: EmployeeRole;
                shouldAllow: boolean;
            }> = [
                    { requiredRole: 'admin', userRole: 'admin', shouldAllow: true },
                    { requiredRole: 'admin', userRole: 'manager', shouldAllow: false },
                    { requiredRole: 'admin', userRole: 'tour_guide', shouldAllow: false },
                    { requiredRole: 'admin', userRole: 'support', shouldAllow: false },
                    { requiredRole: 'manager', userRole: 'admin', shouldAllow: false },
                    { requiredRole: 'manager', userRole: 'manager', shouldAllow: true },
                    { requiredRole: 'manager', userRole: 'tour_guide', shouldAllow: false },
                    { requiredRole: 'manager', userRole: 'support', shouldAllow: false },
                    { requiredRole: 'tour_guide', userRole: 'admin', shouldAllow: false },
                    { requiredRole: 'tour_guide', userRole: 'manager', shouldAllow: false },
                    { requiredRole: 'tour_guide', userRole: 'tour_guide', shouldAllow: true },
                    { requiredRole: 'tour_guide', userRole: 'support', shouldAllow: false },
                    { requiredRole: 'support', userRole: 'admin', shouldAllow: false },
                    { requiredRole: 'support', userRole: 'manager', shouldAllow: false },
                    { requiredRole: 'support', userRole: 'tour_guide', shouldAllow: false },
                    { requiredRole: 'support', userRole: 'support', shouldAllow: true }
                ];

            testCases.forEach(({ requiredRole, userRole, shouldAllow }) => {
                const mockHasRole = jest.fn((role: EmployeeRole) => role === userRole);

                mockUseAdminAuth.mockReturnValue({
                    employee: { ...mockEmployee, role: userRole },
                    loading: false,
                    signIn: jest.fn(),
                    signOut: jest.fn(),
                    hasPermission: jest.fn().mockReturnValue(true),
                    hasRole: mockHasRole
                });

                const { unmount } = renderWithRouter(
                    <ProtectedRoute requiredRole={requiredRole}>
                        <TestComponent />
                    </ProtectedRoute>
                );

                if (shouldAllow) {
                    expect(screen.getByText('Protected Content')).toBeInTheDocument();
                } else {
                    expect(screen.getByText('Access Denied')).toBeInTheDocument();
                    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
                }

                unmount();
            });
        });
    });

    describe('Combined Permission and Role Requirements', () => {
        it('should allow access when user has both required permission and role', () => {
            const mockHasPermission = jest.fn().mockReturnValue(true);
            const mockHasRole = jest.fn().mockReturnValue(true);

            mockUseAdminAuth.mockReturnValue({
                employee: { ...mockEmployee, role: 'admin' },
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: mockHasRole
            });

            renderWithRouter(
                <ProtectedRoute requiredPermission="manage_employees" requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasPermission).toHaveBeenCalledWith('manage_employees');
            expect(mockHasRole).toHaveBeenCalledWith('admin');
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });

        it('should deny access when user has permission but lacks required role', () => {
            const mockHasPermission = jest.fn().mockReturnValue(true);
            const mockHasRole = jest.fn().mockReturnValue(false);

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: mockHasRole
            });

            renderWithRouter(
                <ProtectedRoute requiredPermission="manage_employees" requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasRole).toHaveBeenCalledWith('admin');
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should deny access when user has role but lacks required permission', () => {
            const mockHasPermission = jest.fn().mockReturnValue(false);
            const mockHasRole = jest.fn().mockReturnValue(true);

            mockUseAdminAuth.mockReturnValue({
                employee: { ...mockEmployee, role: 'admin' },
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: mockHasRole
            });

            renderWithRouter(
                <ProtectedRoute requiredPermission="manage_employees" requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasPermission).toHaveBeenCalledWith('manage_employees');
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should deny access when user lacks both permission and role', () => {
            const mockHasPermission = jest.fn().mockReturnValue(false);
            const mockHasRole = jest.fn().mockReturnValue(false);

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: mockHasRole
            });

            renderWithRouter(
                <ProtectedRoute requiredPermission="manage_employees" requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(mockHasRole).toHaveBeenCalledWith('admin');
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('No Requirements', () => {
        it('should allow access when no permission or role requirements are specified', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined employee gracefully', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: undefined as any,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should handle null employee gracefully', () => {
            mockUseAdminAuth.mockReturnValue({
                employee: null,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            renderWithRouter(
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            );

            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should handle permission check function throwing error', () => {
            const mockHasPermission = jest.fn().mockImplementation(() => {
                throw new Error('Permission check failed');
            });

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: mockHasPermission,
                hasRole: jest.fn().mockReturnValue(true)
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute requiredPermission="manage_employees">
                        <TestComponent />
                    </ProtectedRoute>
                );
            }).toThrow('Permission check failed');
        });

        it('should handle role check function throwing error', () => {
            const mockHasRole = jest.fn().mockImplementation(() => {
                throw new Error('Role check failed');
            });

            mockUseAdminAuth.mockReturnValue({
                employee: mockEmployee,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn().mockReturnValue(true),
                hasRole: mockHasRole
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute requiredRole="admin">
                        <TestComponent />
                    </ProtectedRoute>
                );
            }).toThrow('Role check failed');
        });
    });
});
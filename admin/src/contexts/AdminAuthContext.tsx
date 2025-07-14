import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { supabase, getSession } from '../lib/supabase';
import { Employee, AdminAuthContextType, Permission, EmployeeRole } from '../types';

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Role-based permissions mapping
const rolePermissions: Record<EmployeeRole, Permission[]> = {
    admin: ['view_bookings', 'edit_bookings', 'manage_tours', 'manage_employees', 'view_analytics', 'system_admin'],
    manager: ['view_bookings', 'edit_bookings', 'manage_tours', 'view_analytics'],
    tour_guide: ['view_bookings', 'manage_own_availability'],
    support: ['view_bookings', 'edit_bookings']
};

interface AdminAuthProviderProps {
    children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Refs to prevent race conditions
    const isLoadingEmployeeRef = useRef(false);
    const lastUserIdRef = useRef<string | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced employee data loading to prevent duplicate calls
    const loadEmployeeData = useCallback(async (userId: string) => {
        // Prevent duplicate calls for the same user
        if (isLoadingEmployeeRef.current && lastUserIdRef.current === userId) {
            return;
        }

        isLoadingEmployeeRef.current = true;
        lastUserIdRef.current = userId;

        try {
            const { data: employeeData, error } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single();

            if (error) {
                console.error('Error loading employee data:', error);

                if (error.code === 'PGRST116') {
                    console.warn('No employee record found for this user. User needs to be added to employees table.');
                } else if (error.code === '42P17') {
                    console.warn('RLS policy issue detected. Run the fix-rls-policies.sql script.');
                }

                setEmployee(null);
                return;
            }

            setEmployee(employeeData);
        } catch (error) {
            console.error('Unexpected error loading employee data:', error);
            setEmployee(null);
        } finally {
            isLoadingEmployeeRef.current = false;
        }
    }, []);

    // Debounced auth state handler
    const handleAuthStateChange = useCallback(async (event: string, session: any) => {
        // Clear any existing debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Debounce rapid auth state changes
        debounceTimeoutRef.current = setTimeout(async () => {
            // Skip token refresh events if already initialized to prevent excessive checks
            if (authInitialized && event === 'TOKEN_REFRESHED') {
                return;
            }

            setLoading(true);

            try {
                if (event === 'SIGNED_IN' && session?.user) {
                    await loadEmployeeData(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    setEmployee(null);
                    lastUserIdRef.current = null;
                } else if (event === 'USER_UPDATED' && session?.user) {
                    // Only reload if it's a different user
                    if (lastUserIdRef.current !== session.user.id) {
                        await loadEmployeeData(session.user.id);
                    }
                }
            } catch (error) {
                console.error('Error handling auth state change:', error);
                setEmployee(null);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce
    }, [authInitialized, loadEmployeeData]);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const session = await getSession();

                if (!mounted) return;

                if (session?.user) {
                    await loadEmployeeData(session.user.id);
                } else {
                    setEmployee(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                if (mounted) {
                    setEmployee(null);
                }
            } finally {
                if (mounted) {
                    setAuthInitialized(true);
                    setLoading(false);
                }
            }
        };

        // Initialize auth
        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

        return () => {
            mounted = false;
            subscription?.unsubscribe();
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [handleAuthStateChange, loadEmployeeData]);

    const signIn = async (email: string, password: string) => {
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Supabase auth error:', error);
                throw error;
            }

            if (data.user) {
                await loadEmployeeData(data.user.id);
            }
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            // Clear refs
            isLoadingEmployeeRef.current = false;
            lastUserIdRef.current = null;

            await supabase.auth.signOut();
            setEmployee(null);
            setAuthInitialized(false);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const hasPermission = (permission: Permission): boolean => {
        if (!employee) return false;
        return rolePermissions[employee.role]?.includes(permission) || false;
    };

    const hasRole = (role: EmployeeRole): boolean => {
        return employee?.role === role;
    };

    const value: AdminAuthContextType = {
        employee,
        loading,
        signIn,
        signOut,
        hasPermission,
        hasRole,
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = (): AdminAuthContextType => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}; 
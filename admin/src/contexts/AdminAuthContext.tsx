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
            console.log('🔄 Employee data already loading for user:', userId);
            return;
        }

        isLoadingEmployeeRef.current = true;
        lastUserIdRef.current = userId;

        console.log('📊 Loading employee data for user ID:', userId);

        try {
            const { data: employeeData, error } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single();

            if (error) {
                console.error('❌ Error loading employee data:', error);
                console.error('📋 Error details:', { code: error.code, message: error.message, details: error.details });

                if (error.code === 'PGRST116') {
                    console.warn('⚠️ No employee record found for this user. User needs to be added to employees table.');
                    console.log('💡 To fix this, run the link-existing-user.sql script in Supabase');
                } else if (error.code === '42P17') {
                    console.warn('⚠️ RLS policy issue detected. Run the fix-rls-policies.sql script.');
                }

                setEmployee(null);
                return;
            }

            console.log('✅ Employee data loaded successfully:', {
                email: employeeData.email,
                role: employeeData.role,
                status: employeeData.status,
                name: `${employeeData.first_name} ${employeeData.last_name}`
            });

            setEmployee(employeeData);
        } catch (error) {
            console.error('❌ Unexpected error loading employee data:', error);
            setEmployee(null);
        } finally {
            isLoadingEmployeeRef.current = false;
        }
    }, []);

    // Debounced auth state handler
    const handleAuthStateChange = useCallback(async (event: string, session: any) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');

        // Clear any existing debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Debounce rapid auth state changes
        debounceTimeoutRef.current = setTimeout(async () => {
            // Don't process if we're already initialized and this is a token refresh
            if (authInitialized && event === 'TOKEN_REFRESHED') {
                console.log('🔄 Token refreshed, skipping state change');
                return;
            }

            setLoading(true);

            try {
                if (event === 'SIGNED_IN' && session?.user) {
                    console.log('✅ User signed in:', session.user.email);
                    await loadEmployeeData(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    console.log('👋 User signed out');
                    setEmployee(null);
                    lastUserIdRef.current = null;
                } else if (event === 'USER_UPDATED' && session?.user) {
                    console.log('🔄 User updated:', session.user.email);
                    // Only reload if it's a different user
                    if (lastUserIdRef.current !== session.user.id) {
                        await loadEmployeeData(session.user.id);
                    }
                }
            } catch (error) {
                console.error('❌ Error handling auth state change:', error);
                setEmployee(null);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce
    }, [authInitialized, loadEmployeeData]);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            console.log('🔄 Initializing auth...');

            try {
                const session = await getSession();

                if (!mounted) return;

                console.log('📋 Session check result:', session ? 'Found session' : 'No session');

                if (session?.user) {
                    console.log('👤 User found in session:', session.user.email);
                    await loadEmployeeData(session.user.id);
                } else {
                    console.log('❌ No user session found');
                    setEmployee(null);
                }
            } catch (error) {
                console.error('❌ Error initializing auth:', error);
                if (mounted) {
                    setEmployee(null);
                }
            } finally {
                if (mounted) {
                    console.log('✅ Auth initialization complete');
                    setAuthInitialized(true);
                    setLoading(false);
                }
            }
        };

        // Initialize auth
        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

        // Handle browser visibility changes to prevent unnecessary auth checks
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('🌙 Tab became hidden');
            } else {
                console.log('☀️ Tab became visible');
                // Only refresh if we have a user and it's been a while
                if (authInitialized && employee && !loading) {
                    console.log('🔄 Refreshing session on tab visibility');
                    // Gentle session refresh without full re-auth
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session && session.user.id !== lastUserIdRef.current) {
                            console.log('🔄 Session user changed, reloading employee data');
                            loadEmployeeData(session.user.id);
                        }
                    }).catch(console.error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            mounted = false;
            subscription?.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [employee, loading, authInitialized, handleAuthStateChange, loadEmployeeData]);

    const signIn = async (email: string, password: string) => {
        console.log('🔐 Starting sign in process for:', email);
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('❌ Supabase auth error:', error);
                throw error;
            }

            console.log('✅ Auth successful for user:', data.user?.email);

            if (data.user) {
                await loadEmployeeData(data.user.id);
            }
        } catch (error) {
            console.error('❌ Sign in error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        console.log('👋 Signing out...');
        try {
            // Clear refs
            isLoadingEmployeeRef.current = false;
            lastUserIdRef.current = null;

            await supabase.auth.signOut();
            setEmployee(null);
            setAuthInitialized(false);
            console.log('✅ Sign out successful');
        } catch (error) {
            console.error('❌ Sign out error:', error);
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

    // Debug logging for auth state (throttled)
    useEffect(() => {
        const logTimeout = setTimeout(() => {
            console.log('🔍 Auth state update:', {
                loading,
                authInitialized,
                hasEmployee: !!employee,
                employeeEmail: employee?.email,
                employeeRole: employee?.role,
                isLoadingEmployee: isLoadingEmployeeRef.current
            });
        }, 100);

        return () => clearTimeout(logTimeout);
    }, [loading, employee, authInitialized]);

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
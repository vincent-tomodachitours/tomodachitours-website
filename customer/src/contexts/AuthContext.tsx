import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getSession } from '../lib/supabase';
import { AuthContextType, AuthProviderProps } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Get initial session
        getSession().then((session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
        signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),
        signOut: () => supabase.auth.signOut(),
        resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email),
        updatePassword: (password: string) => supabase.auth.updateUser({ password })
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
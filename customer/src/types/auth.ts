import { User, AuthError } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
    signUp: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
    updatePassword: (password: string) => Promise<{ data: any; error: AuthError | null }>;
}

export interface AuthProviderProps {
    children: React.ReactNode;
}
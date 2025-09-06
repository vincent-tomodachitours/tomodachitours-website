import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, employee, loading: authLoading } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Debug: Log auth state changes
    useEffect(() => {
        console.log('Login component - Auth state:', { employee, authLoading });

        // If user is already authenticated and has employee data, redirect
        if (!authLoading && employee) {
            console.log('User already authenticated, redirecting based on role');

            // Always redirect admins and managers to dashboard
            // Only redirect tour guides to their original destination if it was a valid route for them
            let redirectTo = '/dashboard';

            if (employee.role === 'tour_guide') {
                const from = (location.state as any)?.from?.pathname;
                // Only redirect to availability page if they originally tried to go there
                if (from === '/availability') {
                    redirectTo = '/availability';
                }
                // For any other route, send tour guides to dashboard as well
            }

            console.log(`Redirecting ${employee.role} to:`, redirectTo);
            navigate(redirectTo, { replace: true });
        }
    }, [employee, authLoading, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Starting sign in process...');
            await signIn(email, password);

            // Don't navigate immediately - let the useEffect handle it
            console.log('Sign in completed, waiting for auth state update...');

        } catch (err: any) {
            console.error('Login error:', err);

            // Handle specific error messages
            if (err?.message?.includes('Invalid login credentials')) {
                setError('Invalid email or password');
            } else if (err?.message?.includes('Email not confirmed')) {
                setError('Please check your email and confirm your account');
            } else if (err?.message?.includes('Too many requests')) {
                setError('Too many login attempts. Please try again later');
            } else {
                setError('Login failed. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading state if auth is loading or we're in the process of signing in
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Tomodachi Tours
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Admin Panel - Employee Login
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            For account issues, contact your system administrator
                        </p>
                    </div>

                    {/* Debug info in development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-400 text-center">
                            Debug: Auth Loading: {authLoading.toString()}, Employee: {employee ? 'Yes' : 'No'}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login; 
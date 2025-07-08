import { useState, useEffect } from 'react';

export const usePaymentProvider = () => {
    const [primaryProvider, setPrimaryProvider] = useState('payjp'); // Default to PAYJP
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPrimaryProvider();
    }, []);

    const fetchPrimaryProvider = async () => {
        try {
            setError(null);
            // Call our backend to determine the primary provider
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-payment-provider`, {
                headers: {
                    "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPrimaryProvider(data.primary || 'payjp');
        } catch (error) {
            console.error('Failed to fetch payment provider:', error);
            setError(error.message);
            // Fallback to PAYJP if we can't determine the provider
            setPrimaryProvider('payjp');
        } finally {
            setLoading(false);
        }
    };

    return {
        primaryProvider,
        loading,
        error,
        refresh: fetchPrimaryProvider
    };
}; 
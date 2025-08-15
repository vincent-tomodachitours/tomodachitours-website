import { useState } from 'react';

export const usePaymentProvider = () => {
    // HARD CODED: Always use Stripe as primary provider
    // eslint-disable-next-line no-unused-vars
    const [primaryProvider, setPrimaryProvider] = useState('stripe'); // Changed from 'payjp' to 'stripe'
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false); // Changed to false since we're not fetching
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);

    // COMMENTED OUT: Dynamic provider fetching - uncomment to restore dynamic switching
    /*
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
    */

    // HARD CODED: Always return Stripe - no backend call needed
    return {
        primaryProvider: 'stripe', // Hard coded to always return Stripe
        loading: false,
        error: null,
        refresh: () => { } // Dummy function since we're not fetching
    };
}; 
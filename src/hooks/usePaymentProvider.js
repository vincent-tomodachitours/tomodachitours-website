import { useState } from 'react';

export const usePaymentProvider = () => {
    // Hard-coded to always use Stripe as primary provider
    const [primaryProvider] = useState('stripe');
    const [loading] = useState(false);
    const [error] = useState(null);

    return {
        primaryProvider: 'stripe', // Always return Stripe
        loading: false,
        error: null,
        refresh: () => { } // Dummy function since we're not fetching
    };
}; 
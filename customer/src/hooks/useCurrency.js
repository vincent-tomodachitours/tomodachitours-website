import { useState, useEffect } from 'react';
import currencyService from '../services/currencyService';

/**
 * React hook for currency conversion
 * @param {number} jpyAmount - Amount in JPY to convert
 * @returns {Object} { usdAmount: string, loading: boolean, error: string|null }
 */
export const useCurrency = (jpyAmount) => {
    const [usdAmount, setUsdAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isCancelled = false;

        const convertCurrency = async () => {
            if (!jpyAmount || jpyAmount <= 0) {
                setUsdAmount('');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const formattedUSD = await currencyService.getFormattedUSDConversion(jpyAmount);

                if (!isCancelled) {
                    setUsdAmount(formattedUSD);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message);
                    console.error('Currency conversion error:', err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        convertCurrency();

        return () => {
            isCancelled = true;
        };
    }, [jpyAmount]);

    return { usdAmount, loading, error };
};

export default useCurrency;
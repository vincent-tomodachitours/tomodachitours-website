import { useState, useEffect } from 'react';
import currencyService from '../services/currencyService';
import { CurrencyHookResult } from '../types/hooks';

/**
 * React hook for currency conversion
 * @param jpyAmount - Amount in JPY to convert
 * @returns Object with usdAmount, loading state, and error
 */
export const useCurrency = (jpyAmount: number): CurrencyHookResult => {
    const [usdAmount, setUsdAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const convertCurrency = async (): Promise<void> => {
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
                    const errorMessage = err instanceof Error ? err.message : 'Currency conversion failed';
                    setError(errorMessage);
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
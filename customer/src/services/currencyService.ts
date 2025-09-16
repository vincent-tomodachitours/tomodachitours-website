/**
 * Currency conversion service for JPY to USD conversion
 * Uses a free exchange rate API with caching to minimize API calls
 */

interface CacheEntry {
    rate: number;
    timestamp: number;
}

interface ExchangeRateResponse {
    rates?: {
        USD?: number;
    };
}

class CurrencyService {
    private cache: Map<string, CacheEntry>;
    private cacheExpiry: number;
    private fallbackRate: number;
    private apiUrl: string;

    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        this.fallbackRate = 0.0067; // Fallback rate (approximately 1 JPY = 0.0067 USD)
        this.apiUrl = 'https://api.exchangerate-api.com/v4/latest/JPY';
    }

    /**
     * Get USD conversion rate for JPY
     * @returns Exchange rate (JPY to USD)
     */
    async getJPYToUSDRate(): Promise<number> {
        const cacheKey = 'JPY_USD_RATE';
        const cached = this.cache.get(cacheKey);

        // Return cached rate if still valid
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.rate;
        }

        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ExchangeRateResponse = await response.json();
            const usdRate = data.rates?.USD;

            if (typeof usdRate === 'number' && usdRate > 0) {
                // Cache the rate
                this.cache.set(cacheKey, {
                    rate: usdRate,
                    timestamp: Date.now()
                });

                console.log(`✅ Currency rate updated: 1 JPY = ${usdRate} USD`);
                return usdRate;
            } else {
                throw new Error('Invalid rate data received');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('⚠️ Failed to fetch exchange rate, using fallback:', errorMessage);

            // Cache fallback rate for a shorter period (1 hour)
            this.cache.set(cacheKey, {
                rate: this.fallbackRate,
                timestamp: Date.now() - (this.cacheExpiry - 60 * 60 * 1000) // Expire in 1 hour
            });

            return this.fallbackRate;
        }
    }

    /**
     * Convert JPY amount to USD
     * @param jpyAmount - Amount in JPY
     * @returns Amount in USD
     */
    async convertJPYToUSD(jpyAmount: number): Promise<number> {
        if (!jpyAmount || jpyAmount <= 0) return 0;

        const rate = await this.getJPYToUSDRate();
        return jpyAmount * rate;
    }

    /**
     * Format USD amount for display
     * @param usdAmount - Amount in USD
     * @returns Formatted USD string
     */
    formatUSD(usdAmount: number): string {
        if (!usdAmount || usdAmount <= 0) return '$0';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(usdAmount));
    }

    /**
     * Get formatted JPY to USD conversion string
     * @param jpyAmount - Amount in JPY
     * @returns Formatted conversion string like "$25"
     */
    async getFormattedUSDConversion(jpyAmount: number): Promise<string> {
        const usdAmount = await this.convertJPYToUSD(jpyAmount);
        return this.formatUSD(usdAmount);
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache(): void {
        this.cache.clear();
        console.log('💾 Currency cache cleared');
    }
}

// Export singleton instance
const currencyService = new CurrencyService();
export default currencyService;
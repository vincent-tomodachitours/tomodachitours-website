/**
 * Utility functions for price formatting and calculations
 */

/**
 * Format a price in JPY with proper currency formatting
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0
    }).format(price);
};

/**
 * Format a price in JPY without currency symbol
 */
export const formatPriceNumber = (price: number): string => {
    return new Intl.NumberFormat('ja-JP', {
        minimumFractionDigits: 0
    }).format(price);
};

/**
 * Calculate percentage change between two prices
 */
export const calculatePriceChange = (oldPrice: number, newPrice: number): {
    amount: number;
    percentage: number;
    isIncrease: boolean;
} => {
    const amount = newPrice - oldPrice;
    const percentage = oldPrice > 0 ? (amount / oldPrice) * 100 : 0;

    return {
        amount,
        percentage,
        isIncrease: amount > 0
    };
};

/**
 * Apply a percentage change to a price
 */
export const applyPercentageChange = (basePrice: number, percentage: number): number => {
    return Math.max(1, Math.round(basePrice * (1 + percentage / 100)));
};

/**
 * Apply an absolute change to a price
 */
export const applyAbsoluteChange = (basePrice: number, amount: number): number => {
    return Math.max(1, basePrice + amount);
};

/**
 * Validate if a price is valid (positive integer)
 */
export const isValidPrice = (price: number): boolean => {
    return Number.isInteger(price) && price > 0;
};

/**
 * Parse a price string to number, handling various formats
 */
export const parsePrice = (priceString: string): number => {
    // Remove currency symbols, commas, and spaces
    const cleaned = priceString.replace(/[¥,\s]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get price range description
 */
export const getPriceRangeDescription = (minPrice: number, maxPrice: number): string => {
    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};

/**
 * Calculate bulk pricing statistics
 */
export interface PricingStats {
    total: number;
    average: number;
    min: number;
    max: number;
    median: number;
}

export const calculatePricingStats = (prices: number[]): PricingStats => {
    if (prices.length === 0) {
        return { total: 0, average: 0, min: 0, max: 0, median: 0 };
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const total = prices.reduce((sum, price) => sum + price, 0);
    const average = total / prices.length;
    const min = sortedPrices[0];
    const max = sortedPrices[sortedPrices.length - 1];

    // Calculate median
    const mid = Math.floor(sortedPrices.length / 2);
    const median = sortedPrices.length % 2 === 0
        ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
        : sortedPrices[mid];

    return { total, average, min, max, median };
};
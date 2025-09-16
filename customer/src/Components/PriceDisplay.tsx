import React from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { PriceDisplayProps } from '../types';

const PriceDisplay: React.FC<PriceDisplayProps> = ({
    jpyPrice,
    originalPrice,
    className = '',
    showPerGuest = true,
    showViatorComparison = false,
    size = 'medium'
}) => {
    const { usdAmount, loading } = useCurrency(jpyPrice) as { usdAmount: string; loading: boolean; error: string | null };

    // Size-based styling
    const sizeClasses = {
        small: {
            jpyPrice: 'text-lg font-bold',
            usdPrice: 'text-sm font-semibold text-blue-600',
            perGuest: 'text-sm'
        },
        medium: {
            jpyPrice: 'text-2xl sm:text-3xl font-bold',
            usdPrice: 'text-base sm:text-lg font-semibold text-blue-600',
            perGuest: 'text-base sm:text-lg font-medium'
        },
        large: {
            jpyPrice: 'text-3xl sm:text-4xl font-bold',
            usdPrice: 'text-lg sm:text-xl font-semibold text-blue-600',
            perGuest: 'text-lg sm:text-xl font-medium'
        }
    };

    const styles = sizeClasses[size] || sizeClasses.medium;

    // Calculate savings percentage if original price is available
    const savingsPercentage = originalPrice && jpyPrice
        ? Math.round(((originalPrice - jpyPrice) / originalPrice) * 100)
        : null;

    return (
        <div className={`text-gray-800 ${className}`}>
            {/* Viator comparison (if enabled and original price available and different from current price) */}
            {showViatorComparison && originalPrice && originalPrice !== jpyPrice && (
                <div className="mb-1">
                    <div className="flex items-center gap-2 text-gray-500">
                        <span className="line-through decoration-red-500 decoration-2 text-base font-medium">
                            Viator: ¥{originalPrice.toLocaleString('en-US')}
                        </span>
                        {savingsPercentage && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                Save {savingsPercentage}%
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Current price */}
            <div className="flex items-baseline gap-2 flex-wrap">
                <span className={styles.jpyPrice}>
                    ¥{jpyPrice ? jpyPrice.toLocaleString('en-US') : '0'}
                </span>
                {!loading && usdAmount && (
                    <span className={styles.usdPrice}>
                        ({usdAmount})
                    </span>
                )}
                {showPerGuest && (
                    <span className={`text-gray-600 ${styles.perGuest}`}>
                        / Guest
                    </span>
                )}
            </div>
            {loading && (
                <div className="text-xs text-gray-400 mt-1">
                    Loading USD conversion...
                </div>
            )}
        </div>
    );
};

export default PriceDisplay;
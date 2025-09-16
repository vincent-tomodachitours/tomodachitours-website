import React from 'react';

interface DiscountSectionProps {
    discountCode: string;
    setDiscountCode: (code: string) => void;
    appliedDiscount: any;
    discountLoading: boolean;
    discountError: string;
    onApplyDiscount: () => void;
    paymentProcessing: boolean;
}

const DiscountSection: React.FC<DiscountSectionProps> = ({
    discountCode,
    setDiscountCode,
    appliedDiscount,
    discountLoading,
    discountError,
    onApplyDiscount,
    paymentProcessing
}) => {
    return (
        <div className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'>
            <div className='p-6 lg:p-8'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <h2 className='font-inter text-xl font-semibold text-gray-900'>Discount Code</h2>
                </div>

                {appliedDiscount ? (
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                        <div className='flex items-center gap-2 mb-2'>
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className='font-semibold text-green-800'>Discount Applied!</span>
                        </div>
                        <p className='text-green-700 text-sm'>
                            Code: <span className='font-mono font-bold'>{appliedDiscount.code}</span>
                        </p>
                        <p className='text-green-700 text-sm'>
                            {appliedDiscount.type === 'percentage'
                                ? `${appliedDiscount.value}% off`
                                : `¥${appliedDiscount.value.toLocaleString()} off`
                            }
                        </p>
                        <p className='text-green-700 text-sm font-semibold'>
                            You save: ¥{(appliedDiscount.originalAmount - appliedDiscount.finalAmount).toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        <div className='flex gap-3'>
                            <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                placeholder="Enter discount code"
                                disabled={paymentProcessing || discountLoading}
                                className='flex-1 h-12 rounded-lg border border-gray-300 px-4 font-inter text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                            />
                            <button
                                onClick={onApplyDiscount}
                                disabled={!discountCode.trim() || paymentProcessing || discountLoading}
                                className='px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {discountLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Applying...</span>
                                    </div>
                                ) : (
                                    'Apply'
                                )}
                            </button>
                        </div>

                        {discountError && (
                            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                                <div className='flex items-center gap-2'>
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className='text-red-800 text-sm font-medium'>{discountError}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountSection;
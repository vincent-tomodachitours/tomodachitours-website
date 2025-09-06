import React from 'react';

const OrderSummary = ({
    tourName,
    tourDate,
    tourTime,
    adult,
    child,
    infant,
    tourPrice,
    appliedDiscount,
    finalPrice,
    discountCode,
    setDiscountCode,
    discountLoading,
    discountError,
    onApplyDiscount,
    paymentProcessing
}) => {
    const originalPrice = (adult + child) * tourPrice;

    return (
        <div className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 sticky top-6'>
            <div className='p-6 lg:p-8'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h2 className='font-inter text-xl font-semibold text-gray-900'>Order Summary</h2>
                </div>

                <div className='space-y-4'>
                    {/* Tour Details */}
                    <div className='bg-gray-50 rounded-lg p-4'>
                        <h3 className='font-semibold text-gray-900 mb-2'>{tourName}</h3>
                        <div className='space-y-1 text-sm text-gray-600'>
                            <div className='flex justify-between'>
                                <span>Date:</span>
                                <span className='font-medium'>{new Date(tourDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span>Time:</span>
                                <span className='font-medium'>{tourTime}</span>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className='space-y-2'>
                        <h4 className='font-semibold text-gray-900'>Participants</h4>
                        {adult > 0 && (
                            <div className='flex justify-between text-sm'>
                                <span>Adults × {adult}</span>
                                <span>¥{(adult * tourPrice).toLocaleString()}</span>
                            </div>
                        )}
                        {child > 0 && (
                            <div className='flex justify-between text-sm'>
                                <span>Children × {child}</span>
                                <span>¥{(child * tourPrice).toLocaleString()}</span>
                            </div>
                        )}
                        {infant > 0 && (
                            <div className='flex justify-between text-sm'>
                                <span>Infants × {infant}</span>
                                <span className='text-green-600'>Free</span>
                            </div>
                        )}
                    </div>

                    <div className='border-t border-gray-200 pt-4'>
                        <div className='flex justify-between text-sm'>
                            <span>Subtotal:</span>
                            <span>¥{originalPrice.toLocaleString()}</span>
                        </div>

                        {appliedDiscount && (
                            <div className='flex justify-between text-sm text-green-600'>
                                <span>Discount ({appliedDiscount.code}):</span>
                                <span>-¥{(appliedDiscount.originalAmount - appliedDiscount.finalAmount).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Discount Code Section */}
                    <div className='border-t border-gray-200 pt-4'>
                        <div className='flex items-center gap-2 mb-3'>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className='font-semibold text-gray-900 text-sm'>Discount Code</span>
                        </div>

                        {appliedDiscount ? (
                            <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className='font-semibold text-green-800 text-sm'>Applied!</span>
                                </div>
                                <p className='text-green-700 text-xs'>
                                    Code: <span className='font-mono font-bold'>{appliedDiscount.code}</span>
                                </p>
                                <p className='text-green-700 text-xs'>
                                    You save: ¥{(appliedDiscount.originalAmount - appliedDiscount.finalAmount).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                <div className='flex gap-2'>
                                    <input
                                        type="text"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                        placeholder="Enter discount code"
                                        disabled={paymentProcessing || discountLoading}
                                        className='flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm font-inter text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                                    />
                                    <button
                                        onClick={onApplyDiscount}
                                        disabled={!discountCode.trim() || paymentProcessing || discountLoading}
                                        className='px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        {discountLoading ? (
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Apply</span>
                                            </div>
                                        ) : (
                                            'Apply'
                                        )}
                                    </button>
                                </div>

                                {discountError && (
                                    <div className='bg-red-50 border border-red-200 rounded-lg p-2'>
                                        <div className='flex items-center gap-2'>
                                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className='text-red-800 text-xs font-medium'>{discountError}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className='border-t border-gray-200 pt-4'>
                        <div className='flex justify-between text-lg font-bold'>
                            <span>Total:</span>
                            <span className='text-blue-600'>¥{finalPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6'>
                        <div className='flex items-start gap-2'>
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className='text-sm text-blue-800'>
                                <p className='font-semibold mb-1'>Important Notes:</p>
                                <ul className='space-y-1 text-xs'>
                                    <li>• Free cancellation up to 24 hours before the tour</li>
                                    <li>• Please arrive 10 minutes before the scheduled time</li>
                                    <li>• Confirmation will be sent to your email</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
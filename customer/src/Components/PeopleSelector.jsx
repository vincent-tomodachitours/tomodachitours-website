import React from 'react'

const PeopleSelector = ({ min = 0, max = 9, title = "NAME", participants, value, onChange, ageRange, price }) => {

    const decrease = () => {
        if (value > min) {
            onChange(value - 1);
        }
    };

    const increase = () => {
        if (value < max && participants < max) {
            onChange(value + 1);
        }
    };

    return (
        <div className='w-full bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow duration-200 font-ubuntu'>
            <div className='flex justify-between items-center'>
                <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold text-gray-800 text-base'>{title}</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            Age {ageRange}
                        </span>
                    </div>
                    {price !== undefined && (
                        <div className="text-sm text-gray-600 font-medium">
                            {price === 0 ? (
                                <span className="text-green-600 font-semibold">Free</span>
                            ) : (
                                <span className="text-gray-800">¥{price.toLocaleString('en-US')}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className='flex items-center bg-gray-100 rounded-lg p-1'>
                    <button
                        title="Decrease"
                        onClick={decrease}
                        disabled={value === min}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ${value === min
                            ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                            : 'cursor-pointer text-white bg-blue-500 hover:bg-blue-600 hover:shadow-lg active:scale-95 shadow-sm'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </button>

                    <div className='w-10 h-8 flex items-center justify-center mx-2'>
                        <span className='font-bold text-base text-gray-800'>{value}</span>
                    </div>

                    <button
                        title="Increase"
                        onClick={increase}
                        disabled={participants >= max}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ${participants >= max
                            ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                            : 'cursor-pointer text-white bg-blue-500 hover:bg-blue-600 hover:shadow-lg active:scale-95 shadow-sm'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
};

export default PeopleSelector
import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const CheckoutForm = ({
    formData,
    onInputChange,
    emailError,
    emailTouched,
    onEmailBlur,
    paymentProcessing
}) => {
    return (
        <div className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'>
            <div className='p-6 lg:p-8'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className='font-inter text-xl font-semibold text-gray-900'>Contact Information</h2>
                </div>

                <form className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                            <label className="font-inter text-sm font-medium text-gray-700" htmlFor="fname">
                                First Name
                            </label>
                            <input
                                className='w-full h-12 rounded-lg border border-gray-300 px-4 font-inter text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                                type="text"
                                id='fname'
                                name='fname'
                                value={formData.fname}
                                onChange={onInputChange}
                                placeholder="Enter your first name"
                                disabled={paymentProcessing}
                            />
                        </div>
                        <div className='space-y-2'>
                            <label className="font-inter text-sm font-medium text-gray-700" htmlFor="lname">
                                Last Name
                            </label>
                            <input
                                className='w-full h-12 rounded-lg border border-gray-300 px-4 font-inter text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                                type="text"
                                id='lname'
                                name='lname'
                                value={formData.lname}
                                onChange={onInputChange}
                                placeholder="Enter your last name"
                                disabled={paymentProcessing}
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                            <label className="font-inter text-sm font-medium text-gray-700" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                className={`w-full h-12 rounded-lg border px-4 font-inter text-gray-900 placeholder-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 ${emailTouched && emailError
                                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    }`}
                                type="email"
                                id='email'
                                name='email'
                                value={formData.email}
                                onChange={onInputChange}
                                onBlur={onEmailBlur}
                                placeholder="Enter your email address"
                                disabled={paymentProcessing}
                            />
                            {emailTouched && emailError && (
                                <p className="text-red-500 text-sm font-inter flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {emailError}
                                </p>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <label className="font-inter text-sm font-medium text-gray-700" htmlFor="phone">
                                Phone Number
                            </label>
                            <PhoneInput
                                country={'us'}
                                onChange={(phone) => {
                                    const syntheticEvent = {
                                        target: {
                                            name: 'phone',
                                            value: phone,
                                            type: 'text'
                                        }
                                    };
                                    onInputChange(syntheticEvent);
                                }}
                                value={formData.phone}
                                disabled={paymentProcessing}
                                inputStyle={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '8px',
                                    border: '1px solid #D1D5DB',
                                    fontSize: '16px',
                                    fontFamily: 'Inter, sans-serif',
                                    backgroundColor: paymentProcessing ? '#F9FAFB' : '#FFFFFF',
                                    color: paymentProcessing ? '#6B7280' : '#111827'
                                }}
                                buttonStyle={{
                                    borderRadius: '8px 0 0 8px',
                                    border: '1px solid #D1D5DB',
                                    backgroundColor: paymentProcessing ? '#F9FAFB' : '#FFFFFF'
                                }}
                                containerStyle={{
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    <div className='flex items-start gap-3'>
                        <input
                            type="checkbox"
                            id='terms'
                            name='terms'
                            checked={formData.terms}
                            onChange={onInputChange}
                            disabled={paymentProcessing}
                            className='mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50'
                        />
                        <label htmlFor="terms" className="font-inter text-sm text-gray-700 leading-relaxed">
                            I agree to the{' '}
                            <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                                Terms of Service
                            </a>
                            {' '}and{' '}
                            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                                Privacy Policy
                            </a>
                        </label>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutForm;
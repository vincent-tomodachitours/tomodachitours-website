// React import removed as it's not needed with new JSX transform
import CheckoutForm from './Checkout/CheckoutForm';
import OrderSummary from './Checkout/OrderSummary';
import PaymentSection from './Checkout/PaymentSection';
import { useCheckoutLogic } from './Checkout/useCheckoutLogic';
import bookingFlowManager from '../services/bookingFlowManager';
import { CheckoutProps } from '../types';
import { isBookingRequestTour, getCheckoutButtonText, getProcessingMessage } from '../utils/tourUtils';

const Checkout = ({ onClose, sheetId, tourDate, tourTime, adult, child, infant, tourPrice, tourName }: CheckoutProps) => {
    const {
        // State
        paymentProcessing,
        setPaymentProcessing,
        discountCode,
        setDiscountCode,
        appliedDiscount,
        discountLoading,
        discountError,
        emailError,
        emailTouched,
        is3DSInProgress,
        setIs3DSInProgress,
        paymentAllowed,
        formData,
        finalPrice,
        bookingId,
        conversionValidated,
        conversionRetryCount,
        maxRetries,

        // Refs
        childRef,
        formRef,

        // Handlers
        handleInputChange,
        handleEmailBlur,
        handleApplyDiscount,
        handlePayNowButton
    } = useCheckoutLogic({
        sheetId,
        tourName,
        adult,
        child,
        infant,
        tourDate,
        tourTime,
        tourPrice
    });

    // Calculate original price before discount
    const originalPrice = (adult + child) * tourPrice;
    
    // Determine if this is a booking request tour
    const isRequestTour = isBookingRequestTour(sheetId);

    return (
        <div className='fixed inset-0 h-screen bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-40 p-4'>
            {/* Modern modal container */}
            <div className='bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative'>

                {/* Processing overlay within the modal */}
                {paymentProcessing && (
                    <div className='absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl'>
                        <div className='bg-white rounded-lg shadow-lg p-8 flex flex-col items-center space-y-4 border border-gray-200'>
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-lg font-semibold text-gray-800">
                                {isRequestTour ? 'Submitting Request' : 'Processing Payment'}
                            </div>
                            <div className="text-sm text-gray-600 text-center max-w-xs">
                                {is3DSInProgress ? (
                                    <>
                                        Verifying your card with 3D Secure. If a popup window opens, please complete the verification.
                                        <br /><br />
                                        <strong>Do not close this window.</strong>
                                    </>
                                ) : (
                                    getProcessingMessage(sheetId)
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug Panel - only show in development */}
                {process.env.NODE_ENV === 'development' && bookingId && (
                    <div className='absolute top-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs max-w-xs z-40'>
                        <div className='font-semibold mb-2'>Booking Debug Info</div>
                        <div>Booking ID: {bookingId}</div>
                        <div>Conversion Validated: {conversionValidated ? '✅' : '❌'}</div>
                        <div>Retry Count: {conversionRetryCount}/{maxRetries}</div>
                        {bookingFlowManager.getCurrentBookingState() && (
                            <div className='mt-2'>
                                <div className='font-semibold'>Tracking Status:</div>
                                <div>Begin Checkout: {bookingFlowManager.isConversionTracked('begin_checkout') ? '✅' : '❌'}</div>
                                <div>Add Payment: {bookingFlowManager.isConversionTracked('add_payment_info') ? '✅' : '❌'}</div>
                                <div>Purchase: {bookingFlowManager.isConversionTracked('purchase') ? '✅' : '❌'}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Header */}
                <div className='bg-gradient-to-r from-slate-50 to-white border-b border-gray-100 p-6'>
                    <div className='flex items-center gap-4'>
                        <button
                            className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800'
                            onClick={() => {
                                // Check if 3D Secure is in progress and prevent closing
                                const payjp3DS = sessionStorage.getItem('payjp_3ds_in_progress') === 'true' ||
                                    localStorage.getItem('payjp_3ds_in_progress') === 'true';
                                const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
                                    localStorage.getItem('checkout_should_stay_open') === 'true';
                                if (payjp3DS || shouldStayOpen) {
                                    console.log('🛑 Preventing checkout close button during PayJP 3D Secure verification');
                                    return;
                                }
                                onClose();
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className='font-inter font-bold text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                            Checkout
                        </h1>
                    </div>
                </div>

                {/* Body - scrollable content */}
                <div className='flex-1 overflow-y-auto'>
                    <div className='p-6 lg:p-8'>
                        <div className='flex flex-col xl:flex-row gap-8'>

                            {/* Contact & Payment Information */}
                            <div className='flex-1 space-y-8'>

                                {/* Contact Information */}
                                <CheckoutForm
                                    formData={formData}
                                    onInputChange={handleInputChange}
                                    emailError={emailError}
                                    emailTouched={emailTouched}
                                    onEmailBlur={handleEmailBlur}
                                    paymentProcessing={paymentProcessing}
                                />

                                {/* Booking Request Information for Uji Tours */}
                                {isRequestTour && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                                                    Booking Request Process
                                                </h3>
                                                <p className="text-sm text-blue-800">
                                                    This tour requires manual confirmation. Your payment method will be securely stored but not charged until your booking is approved by our team. You'll receive an email confirmation once we verify availability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Information */}
                                <PaymentSection
                                    childRef={childRef}
                                    formRef={formRef}
                                    sheetId={sheetId}
                                    tourDate={tourDate}
                                    tourTime={tourTime}
                                    adult={adult}
                                    child={child}
                                    infant={infant}
                                    finalPrice={finalPrice}
                                    originalPrice={originalPrice}
                                    appliedDiscount={appliedDiscount}
                                    tourName={tourName}
                                    formData={formData}
                                    paymentProcessing={paymentProcessing}
                                    setPaymentProcessing={setPaymentProcessing}
                                    setIs3DSInProgress={setIs3DSInProgress}
                                    isRequestTour={isRequestTour}
                                />
                            </div>

                            {/* Order Summary Sidebar */}
                            <div className='xl:w-96'>
                                <OrderSummary
                                    tourName={tourName}
                                    tourDate={tourDate}
                                    tourTime={tourTime}
                                    adult={adult}
                                    child={child}
                                    infant={infant}
                                    tourPrice={tourPrice}
                                    appliedDiscount={appliedDiscount}
                                    finalPrice={finalPrice}
                                    discountCode={discountCode}
                                    setDiscountCode={setDiscountCode}
                                    discountLoading={discountLoading}
                                    discountError={discountError}
                                    onApplyDiscount={handleApplyDiscount}
                                    paymentProcessing={paymentProcessing}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with Pay Button */}
                <div className='bg-gradient-to-r from-slate-50 to-white border-t border-gray-100 p-6'>
                    <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                        <div className='text-sm text-gray-600'>
                            <span>Total: </span>
                            <span className='text-2xl font-bold text-blue-600'>¥{finalPrice.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handlePayNowButton}
                            disabled={!paymentAllowed || paymentProcessing}
                            className='w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none'
                        >
                            {paymentProcessing ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{isRequestTour ? 'Submitting...' : 'Processing...'}</span>
                                </div>
                            ) : (
                                getCheckoutButtonText(sheetId, false, finalPrice)
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
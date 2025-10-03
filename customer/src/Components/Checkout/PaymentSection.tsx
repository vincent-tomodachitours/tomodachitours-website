// React import removed as it's not needed with new JSX transform
import CardForm from '../CardForm';
import { PaymentSectionProps } from '../../types';

const PaymentSection = ({
    childRef,
    formRef,
    sheetId,
    tourDate,
    tourTime,
    adult,
    child,
    infant,
    finalPrice,
    originalPrice,
    appliedDiscount,
    tourName,
    formData,
    paymentProcessing,
    setPaymentProcessing,
    setIs3DSInProgress,
    isRequestTour = false
}: PaymentSectionProps) => {
    return (
        <div className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'>
            <div className='p-6 lg:p-8'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center'>
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h2 className='font-inter text-xl font-semibold text-gray-900'>
                        {isRequestTour ? 'Payment Method' : 'Payment Information'}
                    </h2>
                </div>
                
                {isRequestTour && (
                    <div className="mb-4 text-sm text-gray-600">
                        Your payment method will be securely stored but not charged until your booking is confirmed.
                    </div>
                )}

                <CardForm
                    ref={childRef}
                    formRef={formRef}
                    sheetId={sheetId}
                    tourDate={tourDate}
                    tourTime={tourTime}
                    adult={adult}
                    child={child}
                    infant={infant}
                    totalPrice={finalPrice}
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
        </div>
    );
};

export default PaymentSection;
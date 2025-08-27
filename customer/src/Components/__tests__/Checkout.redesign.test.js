/**
 * Test for redesigned Checkout component with simplified conversion tracking
 * Tests the integration with bookingFlowManager and GTM-based tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Checkout from '../Checkout';
import bookingFlowManager from '../../services/bookingFlowManager';
import gtmService from '../../services/gtmService';

// Mock the services
jest.mock('../../services/bookingFlowManager');
jest.mock('../../services/gtmService');

// Mock react-phone-input-2
jest.mock('react-phone-input-2', () => {
    return function PhoneInput({ onChange, ...props }) {
        return (
            <input
                data-testid="phone-input"
                onChange={(e) => onChange(e.target.value)}
                {...props}
            />
        );
    };
});

const defaultProps = {
    onClose: jest.fn(),
    sheetId: 'test-tour-123',
    tourDate: '2024-03-15',
    tourTime: '10:00 AM',
    adult: 2,
    child: 1,
    infant: 0,
    tourPrice: 5000,
    tourName: 'Test Kyoto Tour'
};

const renderCheckout = (props = {}) => {
    return render(
        <BrowserRouter>
            <Checkout {...defaultProps} {...props} />
        </BrowserRouter>
    );
};

describe('Redesigned Checkout Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock bookingFlowManager methods
        bookingFlowManager.initializeBooking.mockReturnValue('booking_123');
        bookingFlowManager.trackBeginCheckout.mockReturnValue({ success: true, data: {} });
        bookingFlowManager.trackAddPaymentInfo.mockReturnValue({ success: true, data: {} });
        bookingFlowManager.getCurrentBookingState.mockReturnValue({
            bookingId: 'booking_123',
            currentStep: 'begin_checkout',
            conversionTracking: {
                viewItemTracked: false,
                beginCheckoutTracked: true,
                addPaymentInfoTracked: false,
                purchaseTracked: false
            }
        });
        bookingFlowManager.isConversionTracked.mockImplementation((type) => {
            const tracking = {
                'begin_checkout': true,
                'add_payment_info': false,
                'purchase': false
            };
            return tracking[type] || false;
        });

        // Mock GTM service methods
        gtmService.validateTagFiring.mockResolvedValue(true);
        gtmService.trackBeginCheckoutConversion.mockReturnValue(true);
    });

    test('initializes booking flow on mount', async () => {
        renderCheckout();

        await waitFor(() => {
            expect(bookingFlowManager.initializeBooking).toHaveBeenCalledWith({
                tourId: 'test-tour-123',
                tourName: 'Test Kyoto Tour',
                price: 15000, // 2 adults + 1 child * 5000
                date: '2024-03-15',
                time: '10:00 AM',
                location: 'Kyoto',
                category: 'tour'
            });
        });
    });

    test('tracks begin checkout conversion on initialization', async () => {
        renderCheckout();

        await waitFor(() => {
            expect(bookingFlowManager.trackBeginCheckout).toHaveBeenCalledWith({
                customerData: null
            });
        });
    });

    test('updates customer data when form is filled', async () => {
        renderCheckout();

        // Fill in customer information
        const emailInput = screen.getByLabelText(/email address/i);
        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

        await waitFor(() => {
            expect(bookingFlowManager.trackBeginCheckout).toHaveBeenCalledWith({
                customerData: {
                    email: 'test@example.com',
                    phone: '',
                    name: 'John Doe',
                    firstName: 'John',
                    lastName: 'Doe'
                }
            });
        });
    });

    test('tracks add payment info when pay now is clicked', async () => {
        renderCheckout();

        // Fill required form fields
        const emailInput = screen.getByLabelText(/email address/i);
        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const phoneInput = screen.getByTestId('phone-input');
        const termsCheckbox = screen.getByRole('checkbox');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
        fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
        fireEvent.click(termsCheckbox);

        // Wait for form validation
        await waitFor(() => {
            const payButton = screen.getByText(/pay now/i);
            expect(payButton).not.toBeDisabled();
        });

        // Click pay now button
        const payButton = screen.getByText(/pay now/i);
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(bookingFlowManager.trackAddPaymentInfo).toHaveBeenCalledWith({
                provider: 'stripe',
                amount: 15000,
                currency: 'JPY',
                paymentMethod: 'card'
            });
        });
    });

    test('validates conversion firing after tracking', async () => {
        renderCheckout();

        await waitFor(() => {
            expect(gtmService.validateTagFiring).toHaveBeenCalledWith('google_ads_begin_checkout');
        });
    });

    test('shows debug panel in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        renderCheckout();

        expect(screen.getByText('Booking Debug Info')).toBeInTheDocument();
        expect(screen.getByText(/Booking ID: booking_123/)).toBeInTheDocument();
        expect(screen.getByText(/Begin Checkout: ✅/)).toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
    });

    test('handles conversion retry on failure', async () => {
        // Mock validation failure
        gtmService.validateTagFiring.mockResolvedValueOnce(false);

        renderCheckout();

        // Wait for initial tracking and validation
        await waitFor(() => {
            expect(gtmService.validateTagFiring).toHaveBeenCalled();
        });

        // Wait for retry attempt
        await waitFor(() => {
            expect(bookingFlowManager.trackBeginCheckout).toHaveBeenCalledTimes(2);
        }, { timeout: 3000 });
    });

    test('applies discount correctly to final price', () => {
        const appliedDiscount = {
            code: 'TEST10',
            type: 'percentage',
            value: 10,
            originalAmount: 15000,
            finalAmount: 13500
        };

        renderCheckout({ appliedDiscount });

        expect(screen.getByText('¥13,500')).toBeInTheDocument();
    });

    test('prevents closing during payment processing', () => {
        renderCheckout();

        // Simulate payment processing
        const payButton = screen.getByText(/pay now/i);
        fireEvent.click(payButton);

        // Try to close
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        // Should not call onClose during processing
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    test('stores incomplete booking data on unmount', () => {
        const { unmount } = renderCheckout();

        // Mock sessionStorage
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        unmount();

        expect(setItemSpy).toHaveBeenCalledWith(
            'incomplete_booking',
            expect.stringContaining('booking_123')
        );

        setItemSpy.mockRestore();
    });
});
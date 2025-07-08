import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkout from '../Checkout';

// Mock CardForm component - using factory function to avoid React scope issues
jest.mock('../CardForm', () => {
    const mockReact = require('react');
    return mockReact.forwardRef((props, ref) => {
        mockReact.useImperativeHandle(ref, () => ({
            handleCreateBooking: jest.fn()
        }));
        return mockReact.createElement('div', { 'data-testid': 'card-form' }, 'Card Form Mock');
    });
});

// Mock fetch for API calls
global.fetch = jest.fn();

const mockProps = {
    onClose: jest.fn(),
    tourName: 'Kyoto Night Tour',
    sheetId: 'Night tour',
    tourDate: '2024-01-15',
    tourTime: '18:00',
    adult: 2,
    child: 1,
    infant: 0,
    tourPrice: 6500
};

describe('Checkout Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockProps.onClose.mockClear();
    });

    test('renders checkout form correctly', () => {
        render(<Checkout {...mockProps} />);
        
        expect(screen.getByText('CHECKOUT')).toBeInTheDocument();
        expect(screen.getByText('Lead traveller\'s contact information')).toBeInTheDocument();
        expect(screen.getByText('Payment information')).toBeInTheDocument();
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
        expect(screen.getByText('Kyoto Night Tour')).toBeInTheDocument();
    });

    test('calculates total price correctly', () => {
        render(<Checkout {...mockProps} />);
        
        // Check if total is calculated correctly (adults + children) * price
        const expectedTotal = (2 + 1) * 6500; // 19500
        expect(screen.getByText(`¥${expectedTotal.toLocaleString('en-US')}`)).toBeInTheDocument();
    });

    test('displays participant breakdown correctly', () => {
        render(<Checkout {...mockProps} />);
        
        expect(screen.getByText('Adults: 2')).toBeInTheDocument();
        expect(screen.getByText('Children: 1')).toBeInTheDocument();
        expect(screen.getByText(`¥${(2 * 6500).toLocaleString('en-US')}`)).toBeInTheDocument(); // Adults total
        expect(screen.getByText(`¥${(1 * 6500).toLocaleString('en-US')}`)).toBeInTheDocument(); // Children total
    });

    test('form validation prevents payment when fields are empty', () => {
        render(<Checkout {...mockProps} />);
        
        const payButton = screen.getByRole('button', { name: /pay now/i });
        expect(payButton).toHaveClass('bg-gray-500');
        expect(payButton).toHaveClass('cursor-default');
    });

    test('form validation enables payment when all fields are filled', async () => {
        render(<Checkout {...mockProps} />);
        
        // Fill out the form
        fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'John' } });
        fireEvent.change(screen.getAllByDisplayValue('')[1], { target: { value: 'Doe' } });
        fireEvent.change(screen.getAllByDisplayValue('')[2], { target: { value: 'john@example.com' } });
        
        // Check terms checkbox
        const termsCheckbox = screen.getByRole('checkbox');
        fireEvent.click(termsCheckbox);
        
        await waitFor(() => {
            const payButton = screen.getByRole('button', { name: /pay now/i });
            expect(payButton).toHaveClass('bg-blue-600');
        });
    });

    test('discount code input and apply button work correctly', () => {
        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        expect(discountInput).toBeInTheDocument();
        expect(applyButton).toBeInTheDocument();
        
        fireEvent.change(discountInput, { target: { value: 'WELCOME10' } });
        expect(discountInput.value).toBe('WELCOME10');
    });

    test('discount code validation - valid code', async () => {
        const mockDiscountResponse = {
            success: true,
            discount: {
                code: 'WELCOME10',
                type: 'percentage',
                value: 10,
                discountAmount: 1950,
                originalAmount: 19500,
                finalAmount: 17550
            }
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockDiscountResponse
        });

        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        fireEvent.change(discountInput, { target: { value: 'WELCOME10' } });
        fireEvent.click(applyButton);
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'https://us-central1-tomodachitours-f4612.cloudfunctions.net/validateDiscountCode',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: 'WELCOME10',
                        tourPrice: 6500,
                        adults: 2,
                        children: 1
                    })
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/Discount applied: -10%/)).toBeInTheDocument();
        });
        
        await waitFor(() => {
            expect(screen.getByText('¥19,500')).toBeInTheDocument(); // Original price crossed out
        });
        
        await waitFor(() => {
            expect(screen.getByText('¥17,550')).toBeInTheDocument(); // Final price
        });
    });

    test('discount code validation - invalid code', async () => {
        const mockErrorResponse = {
            success: false,
            message: 'Invalid or expired discount code'
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockErrorResponse
        });

        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        fireEvent.change(discountInput, { target: { value: 'INVALID123' } });
        fireEvent.click(applyButton);
        
        await waitFor(() => {
            expect(screen.getByText('Invalid or expired discount code')).toBeInTheDocument();
        });
    });

    test('discount remove functionality works', async () => {
        const mockDiscountResponse = {
            success: true,
            discount: {
                code: 'WELCOME10',
                type: 'percentage',
                value: 10,
                discountAmount: 1950,
                originalAmount: 19500,
                finalAmount: 17550
            }
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockDiscountResponse
        });

        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        // Apply discount first
        fireEvent.change(discountInput, { target: { value: 'WELCOME10' } });
        fireEvent.click(applyButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Discount applied: -10%/)).toBeInTheDocument();
        });

        // Remove discount
        const removeButton = screen.getByRole('button', { name: /remove/i });
        fireEvent.click(removeButton);
        
        await waitFor(() => {
            expect(screen.queryByText(/Discount applied: -10%/)).not.toBeInTheDocument();
            expect(discountInput.value).toBe('');
        });
    });

    test('discount loading state works correctly', async () => {
        // Mock slow response
        fetch.mockImplementationOnce(() => 
            new Promise(resolve => setTimeout(() => resolve({
                json: async () => ({ success: true, discount: {} })
            }), 100))
        );

        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        fireEvent.change(discountInput, { target: { value: 'WELCOME10' } });
        fireEvent.click(applyButton);
        
        // Check loading state
        expect(screen.getByText('Checking...')).toBeInTheDocument();
        expect(applyButton).toHaveClass('bg-gray-400');
        expect(applyButton).toBeDisabled();
        
        await waitFor(() => {
            expect(screen.queryByText('Checking...')).not.toBeInTheDocument();
        });
    });

    test('CardForm receives correct props with discount', async () => {
        const mockDiscountResponse = {
            success: true,
            discount: {
                code: 'WELCOME10',
                type: 'percentage',
                value: 10,
                discountAmount: 1950,
                originalAmount: 19500,
                finalAmount: 17550
            }
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockDiscountResponse
        });

        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        fireEvent.change(discountInput, { target: { value: 'WELCOME10' } });
        fireEvent.click(applyButton);
        
        await waitFor(() => {
            const cardForm = screen.getByTestId('card-form');
            expect(cardForm).toBeInTheDocument();
            // Note: We can't easily test props passed to mocked components,
            // but we can verify the component renders with discount applied
            expect(screen.getByText('¥17,550')).toBeInTheDocument();
        });
    });

    test('closes checkout when close button is clicked', () => {
        render(<Checkout {...mockProps} />);
        
        const closeButton = screen.getByRole('button', { name: '<' });
        fireEvent.click(closeButton);
        
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('handles network errors gracefully', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<Checkout {...mockProps} />);
        
        const discountInput = screen.getByLabelText('Discount code');
        const applyButton = screen.getByRole('button', { name: /apply/i });
        
        fireEvent.change(discountInput, { target: { value: 'WELCOME10' } });
        fireEvent.click(applyButton);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to validate discount code')).toBeInTheDocument();
        });
    });
}); 
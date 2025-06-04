import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BookingCancellation from '../BookingCancellation';

// Mock Header and Footer components - using factory function to avoid React scope issues
jest.mock('../Headers/Header1', () => {
    const mockReact = require('react');
    return function MockHeader() {
        return mockReact.createElement('div', { 'data-testid': 'header' }, 'Header');
    };
});

jest.mock('../Footer', () => {
    const mockReact = require('react');
    return function MockFooter() {
        return mockReact.createElement('div', { 'data-testid': 'footer' }, 'Footer');
    };
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('BookingCancellation Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        global.confirm.mockClear();
    });

    test('renders booking cancellation page correctly', () => {
        renderWithRouter(<BookingCancellation />);
        
        expect(screen.getByText('Cancel Your Booking')).toBeInTheDocument();
        expect(screen.getByText('Email Address (used for booking)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /find bookings/i })).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('email input works correctly', () => {
        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        
        expect(emailInput.value).toBe('test@example.com');
    });

    test('lookup bookings with valid email', async () => {
        const mockBookingsResponse = {
            success: true,
            bookings: [
                {
                    id: 2,
                    date: '2024-01-20',
                    time: '10:00',
                    adults: '2',
                    children: '1',
                    tourName: 'Kyoto Morning Tour',
                    chargeId: 'ch_test123',
                    canCancel: true
                },
                {
                    id: 3,
                    date: '2024-01-15',
                    time: '18:00',
                    adults: '1',
                    children: '0',
                    tourName: 'Kyoto Night Tour',
                    chargeId: 'ch_test456',
                    canCancel: false
                }
            ]
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockBookingsResponse
        });

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'https://us-central1-tomodachitours-f4612.cloudfunctions.net/getBookingDetails',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'test@example.com' })
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Your Bookings')).toBeInTheDocument();
            expect(screen.getByText('Kyoto Morning Tour')).toBeInTheDocument();
            expect(screen.getByText('Kyoto Night Tour')).toBeInTheDocument();
            expect(screen.getByText('Participants: 2 adults, 1 children')).toBeInTheDocument();
            expect(screen.getByText('Participants: 1 adults, 0 children')).toBeInTheDocument();
        });
    });

    test('displays no bookings message when none found', async () => {
        const mockResponse = {
            success: true,
            bookings: []
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockResponse
        });

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(screen.getByText('No bookings found for this email address')).toBeInTheDocument();
        });
    });

    test('displays cancel booking button for cancellable bookings', async () => {
        const mockBookingsResponse = {
            success: true,
            bookings: [
                {
                    id: 2,
                    date: '2024-01-20',
                    time: '10:00',
                    adults: '2',
                    children: '1',
                    tourName: 'Kyoto Morning Tour',
                    chargeId: 'ch_test123',
                    canCancel: true
                }
            ]
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockBookingsResponse
        });

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
            expect(cancelButton).toBeInTheDocument();
            expect(cancelButton).toHaveClass('bg-red-600');
        });
    });

    test('displays non-cancellable message for recent bookings', async () => {
        const mockBookingsResponse = {
            success: true,
            bookings: [
                {
                    id: 3,
                    date: '2024-01-15',
                    time: '18:00',
                    adults: '1',
                    children: '0',
                    tourName: 'Kyoto Night Tour',
                    chargeId: 'ch_test456',
                    canCancel: false
                }
            ]
        };

        fetch.mockResolvedValueOnce({
            json: async () => mockBookingsResponse
        });

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(screen.getByText('Cannot cancel - less than 24 hours before tour')).toBeInTheDocument();
        });
    });

    test('successful booking cancellation flow', async () => {
        // Mock lookup response
        const mockBookingsResponse = {
            success: true,
            bookings: [
                {
                    id: 2,
                    date: '2024-01-20',
                    time: '10:00',
                    adults: '2',
                    children: '1',
                    tourName: 'Kyoto Morning Tour',
                    chargeId: 'ch_test123',
                    canCancel: true
                }
            ]
        };

        // Mock cancellation response
        const mockCancelResponse = {
            success: true,
            message: 'Booking cancelled successfully',
            refund: {
                amount: 13000,
                id: 'rf_test123'
            }
        };

        fetch
            .mockResolvedValueOnce({ json: async () => mockBookingsResponse })
            .mockResolvedValueOnce({ json: async () => mockCancelResponse });

        global.confirm.mockReturnValue(true);

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        // Look up bookings
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(screen.getByText('Kyoto Morning Tour')).toBeInTheDocument();
        });

        // Cancel booking
        const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
        fireEvent.click(cancelButton);
        
        expect(global.confirm).toHaveBeenCalledWith(
            'Are you sure you want to cancel your booking for Kyoto Morning Tour on 2024-01-20?'
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'https://us-central1-tomodachitours-f4612.cloudfunctions.net/cancelBooking',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookingId: 2,
                        chargeId: 'ch_test123',
                        email: 'test@example.com'
                    })
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/Booking cancelled successfully. Refund of ¥13,000 will be processed./)).toBeInTheDocument();
        });
    });

    test('cancellation confirmation dialog rejection', async () => {
        const mockBookingsResponse = {
            success: true,
            bookings: [
                {
                    id: 2,
                    date: '2024-01-20',
                    time: '10:00',
                    adults: '2',
                    children: '1',
                    tourName: 'Kyoto Morning Tour',
                    chargeId: 'ch_test123',
                    canCancel: true
                }
            ]
        };

        fetch.mockResolvedValueOnce({ json: async () => mockBookingsResponse });
        global.confirm.mockReturnValue(false);

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(screen.getByText('Kyoto Morning Tour')).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
        fireEvent.click(cancelButton);
        
        expect(global.confirm).toHaveBeenCalled();
        // Cancellation API should not be called
        expect(fetch).toHaveBeenCalledTimes(1); // Only the lookup call
    });

    test('handles cancellation failure', async () => {
        const mockBookingsResponse = {
            success: true,
            bookings: [
                {
                    id: 2,
                    date: '2024-01-20',
                    time: '10:00',
                    adults: '2',
                    children: '1',
                    tourName: 'Kyoto Morning Tour',
                    chargeId: 'ch_test123',
                    canCancel: true
                }
            ]
        };

        const mockCancelErrorResponse = {
            success: false,
            message: 'Cancellation must be made at least 24 hours before the tour date'
        };

        fetch
            .mockResolvedValueOnce({ json: async () => mockBookingsResponse })
            .mockResolvedValueOnce({ json: async () => mockCancelErrorResponse });

        global.confirm.mockReturnValue(true);

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(screen.getByText('Kyoto Morning Tour')).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
        fireEvent.click(cancelButton);
        
        await waitFor(() => {
            expect(screen.getByText('Cancellation must be made at least 24 hours before the tour date')).toBeInTheDocument();
        });
    });

    test('loading states work correctly', async () => {
        // Mock slow lookup response
        fetch.mockImplementationOnce(() => 
            new Promise(resolve => setTimeout(() => resolve({
                json: async () => ({ success: true, bookings: [] })
            }), 100))
        );

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        // Check loading state
        expect(screen.getByText('Looking up...')).toBeInTheDocument();
        expect(findButton).toBeDisabled();
        
        await waitFor(() => {
            expect(screen.queryByText('Looking up...')).not.toBeInTheDocument();
        });
    });

    test('handles network errors gracefully', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        renderWithRouter(<BookingCancellation />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const findButton = screen.getByRole('button', { name: /find bookings/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(findButton);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to lookup bookings')).toBeInTheDocument();
        });
    });
}); 
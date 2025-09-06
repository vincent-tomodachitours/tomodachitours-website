import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BaseTourPage from '../BaseTourPage';
import gtmService from '../../../services/gtmService';

// Mock the services
jest.mock('../../../services/gtmService');
jest.mock('../../../services/toursService');
jest.mock('../../../services/analytics');
jest.mock('../../../services/attributionService');

// Mock intersection observer
global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: query.includes('768px'), // Mock mobile view
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

describe('BaseTourPage - Begin Checkout Tracking', () => {
    const mockTourData = {
        id: 'test-tour',
        name: 'Test Tour',
        price: 5000,
        category: 'cultural'
    };

    const defaultProps = {
        tourId: 'test-tour',
        images: [],
        overviewContent: <div>Overview</div>,
        tourDetails: {},
        itineraryStops: [],
        meetingPointData: {},
        SEOComponent: () => <div>SEO</div>,
        StructuredDataComponent: () => <div>Structured Data</div>
    };

    beforeEach(() => {
        jest.clearAllMocks();
        gtmService.trackBeginCheckoutConversion = jest.fn();

        // Mock getElementById to return a mock element
        document.getElementById = jest.fn().mockReturnValue({
            scrollIntoView: jest.fn()
        });
    });

    test('should track begin_checkout when mobile Book Now button is clicked', async () => {
        render(<BaseTourPage {...defaultProps} />);

        // Wait for component to load and set tour data
        // We need to simulate the tour data being loaded
        const component = screen.getByTestId ? screen.getByTestId('base-tour-page') : document.body;

        // Find the mobile Book Now button
        const bookNowButton = screen.getByText('Book Now');
        expect(bookNowButton).toBeInTheDocument();

        // Click the button
        fireEvent.click(bookNowButton);

        // Verify that gtmService.trackBeginCheckoutConversion was called
        await waitFor(() => {
            expect(gtmService.trackBeginCheckoutConversion).toHaveBeenCalled();
        });
    });
});
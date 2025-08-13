import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';

// Mock the TripAdvisorReviews component
jest.mock('../../Components/TripAdvisorReviews', () => {
    return function MockTripAdvisorReviews({ locationId, maxReviews, showRating, layout, className, showAttribution }) {
        return (
            <div data-testid="tripadvisor-reviews" className={className}>
                <div>Mock TripAdvisor Reviews</div>
                <div>Location ID: {locationId}</div>
                <div>Max Reviews: {maxReviews}</div>
                <div>Show Rating: {showRating ? 'true' : 'false'}</div>
                <div>Layout: {layout}</div>
                <div>Show Attribution: {showAttribution ? 'true' : 'false'}</div>
            </div>
        );
    };
});

// Mock the tours service
jest.mock('../../services/toursService', () => ({
    fetchTours: jest.fn(() => Promise.resolve({
        'night-tour': {
            'tour-title': 'Night Tour',
            'tour-description': 'Experience Kyoto at night',
            'tour-price': 5000
        },
        'morning-tour': {
            'tour-title': 'Morning Tour',
            'tour-description': 'Early morning exploration',
            'tour-price': 4500
        },
        'uji-tour': {
            'tour-title': 'Uji Tour',
            'tour-description': 'Matcha experience',
            'tour-price': 6000
        },
        'gion-tour': {
            'tour-title': 'Gion Tour',
            'tour-description': 'Geisha district tour',
            'tour-price': 5500
        }
    }))
}));

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
    process.env = {
        ...originalEnv,
        REACT_APP_TRIPADVISOR_LOCATION_ID: '27931661'
    };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('Home Page TripAdvisor Integration', () => {
    const renderHome = () => {
        return render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );
    };

    test('should render Customer Reviews section', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
        });

        // Check for section description
        expect(screen.getByText(/See what our guests are saying about their unforgettable experiences/)).toBeInTheDocument();
    });

    test('should render TripAdvisorReviews component with correct props', async () => {
        renderHome();

        await waitFor(() => {
            const reviewsComponent = screen.getByTestId('tripadvisor-reviews');
            expect(reviewsComponent).toBeInTheDocument();
        });

        // Check that the component receives correct props
        expect(screen.getByText('Location ID: 27931661')).toBeInTheDocument();
        expect(screen.getByText('Max Reviews: 6')).toBeInTheDocument();
        expect(screen.getByText('Show Rating: true')).toBeInTheDocument();
        expect(screen.getByText('Layout: grid')).toBeInTheDocument();
        expect(screen.getByText('Show Attribution: true')).toBeInTheDocument();
    });

    test('should have Customer Reviews section positioned before Footer', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
        });

        const reviewsSection = screen.getByText('Customer Reviews').closest('section');
        const footer = screen.getByRole('contentinfo'); // Footer typically has this role

        // Check that reviews section exists and is positioned correctly
        expect(reviewsSection).toBeInTheDocument();
        expect(footer).toBeInTheDocument();

        // The reviews section should come before the footer in the DOM
        const reviewsSectionPosition = Array.from(document.body.querySelectorAll('*')).indexOf(reviewsSection);
        const footerPosition = Array.from(document.body.querySelectorAll('*')).indexOf(footer);

        expect(reviewsSectionPosition).toBeLessThan(footerPosition);
    });

    test('should have proper styling classes for responsive design', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
        });

        const reviewsSection = screen.getByText('Customer Reviews').closest('section');

        // Check for responsive styling classes
        expect(reviewsSection).toHaveClass('bg-white', 'py-16', 'border-t', 'border-gray-100');

        const container = reviewsSection.querySelector('.container');
        expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'max-w-7xl');

        const heading = screen.getByText('Customer Reviews');
        expect(heading).toHaveClass('font-ubuntu', 'text-4xl', 'md:text-5xl', 'lg:text-6xl', 'font-bold', 'text-gray-900', 'mb-4');
    });

    test('should have animation classes applied', async () => {
        renderHome();

        await waitFor(() => {
            const reviewsComponent = screen.getByTestId('tripadvisor-reviews');
            expect(reviewsComponent).toBeInTheDocument();
        });

        const reviewsComponent = screen.getByTestId('tripadvisor-reviews');
        expect(reviewsComponent).toHaveClass('animate-fade-in-up');
    });

    test('should maintain existing homepage functionality', async () => {
        renderHome();

        await waitFor(() => {
            // Check that existing sections still exist
            expect(screen.getByText('Our Tours')).toBeInTheDocument();
            expect(screen.getByText('Discover Kyoto Beyond the Guidebooks')).toBeInTheDocument();
        });

        // Check that the error state is shown when tours fail to load (which is expected in test environment)
        await waitFor(() => {
            expect(screen.getByText('Unable to load tours. Please try again later.')).toBeInTheDocument();
        });

        // Verify that the page structure is maintained
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    });
});
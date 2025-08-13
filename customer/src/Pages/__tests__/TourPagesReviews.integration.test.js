import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import tour components
import GionTour from '../GionTour';
import MorningTour from '../MorningTour';
import NightTour from '../NightTour';
import UjiTour from '../UjiTour';

// Mock dependencies
jest.mock('../../services/toursService', () => ({
    getTour: jest.fn()
}));

jest.mock('../../Components/TripAdvisorReviews', () => {
    return function MockTripAdvisorReviews({ locationId, maxReviews, showRating, layout, className, showAttribution }) {
        return (
            <div data-testid="tripadvisor-reviews" className={className}>
                <div data-testid="location-id">{locationId}</div>
                <div data-testid="max-reviews">{maxReviews}</div>
                <div data-testid="show-rating">{showRating ? 'true' : 'false'}</div>
                <div data-testid="layout">{layout}</div>
                <div data-testid="show-attribution">{showAttribution ? 'true' : 'false'}</div>
            </div>
        );
    };
});

jest.mock('../../Components/DatePicker', () => {
    return function MockDatePicker() {
        return <div data-testid="date-picker">Mock DatePicker</div>;
    };
});

jest.mock('../../Components/TourPages/ImageShowcase', () => {
    return function MockImageShowcase() {
        return <div data-testid="image-showcase">Mock ImageShowcase</div>;
    };
});

jest.mock('../../Components/Headers/Header1', () => {
    return function MockHeader() {
        return <div data-testid="header">Mock Header</div>;
    };
});

jest.mock('../../Components/Footer', () => {
    return function MockFooter() {
        return <div data-testid="footer">Mock Footer</div>;
    };
});

// Mock tour service
const { getTour } = require('../../services/toursService');

describe('Tour Pages TripAdvisor Reviews Integration', () => {
    const mockTourData = {
        'tour-title': 'Test Tour',
        'tour-price': 5000,
        'tour-duration': 180,
        'reviews': 150,
        'time-slots': ['09:00', '14:00'],
        'max-participants': 8,
        'cancellation-cutoff-hours': 24,
        'cancellation-cutoff-hours-with-participant': 48,
        'next-day-cutoff-time': '18:00'
    };

    let originalEnv;

    beforeAll(() => {
        originalEnv = process.env;
        process.env = {
            ...originalEnv,
            REACT_APP_TRIPADVISOR_LOCATION_ID: '27931661'
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        getTour.mockResolvedValue(mockTourData);
        // Mock window.innerWidth for mobile detection
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderTourPage = (TourComponent) => {
        return render(
            <BrowserRouter>
                <TourComponent />
            </BrowserRouter>
        );
    };

    describe('Requirement 5.1: Tour page integration', () => {
        it('should integrate TripAdvisorReviews component into Gion tour page', async () => {
            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Verify reviews section heading
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
            expect(screen.getByText(/See what our guests say about their Gion District walking tour experience/)).toBeInTheDocument();
        });

        it('should integrate TripAdvisorReviews component into Morning tour page', async () => {
            renderTourPage(MorningTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Verify reviews section heading
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
            expect(screen.getByText(/See what our guests say about their morning tour experience/)).toBeInTheDocument();
        });

        it('should integrate TripAdvisorReviews component into Night tour page', async () => {
            renderTourPage(NightTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Verify reviews section heading
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
            expect(screen.getByText(/See what our guests say about their evening Fushimi Inari Shrine tour experience/)).toBeInTheDocument();
        });

        it('should integrate TripAdvisorReviews component into Uji tour page', async () => {
            renderTourPage(UjiTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Verify reviews section heading
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
            expect(screen.getByText(/See what our guests say about their Uji matcha experience/)).toBeInTheDocument();
        });
    });

    describe('Requirement 5.2: General business reviews fallback', () => {
        it('should use general business location ID for all tour pages', async () => {
            const tourPages = [GionTour, MorningTour, NightTour, UjiTour];

            for (const TourComponent of tourPages) {
                const { unmount } = renderTourPage(TourComponent);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
                });

                // Verify it uses the general business location ID
                expect(screen.getByTestId('location-id')).toHaveTextContent('27931661');

                unmount();
            }
        });

        it('should handle missing location ID gracefully', async () => {
            // Temporarily remove the environment variable
            delete process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;

            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Should still render but with undefined location ID
            expect(screen.getByTestId('location-id')).toHaveTextContent('');

            // Restore environment variable
            process.env.REACT_APP_TRIPADVISOR_LOCATION_ID = '27931661';
        });
    });

    describe('Requirement 5.3: Tour-specific review context', () => {
        it('should display tour-specific descriptions for each tour page', async () => {
            // Test Gion tour specific description
            const { unmount: unmountGion } = renderTourPage(GionTour);
            await waitFor(() => {
                expect(screen.getByText(/Gion District walking tour experience/)).toBeInTheDocument();
            });
            unmountGion();

            // Test Morning tour specific description
            const { unmount: unmountMorning } = renderTourPage(MorningTour);
            await waitFor(() => {
                expect(screen.getByText(/morning tour experience visiting Fushimi Inari, Bamboo Grove, and Tenryu-ji Temple/)).toBeInTheDocument();
            });
            unmountMorning();

            // Test Night tour specific description
            const { unmount: unmountNight } = renderTourPage(NightTour);
            await waitFor(() => {
                expect(screen.getByText(/evening Fushimi Inari Shrine tour experience/)).toBeInTheDocument();
            });
            unmountNight();

            // Test Uji tour specific description
            renderTourPage(UjiTour);
            await waitFor(() => {
                expect(screen.getByText(/Uji matcha experience and Byodo-in Temple tour/)).toBeInTheDocument();
            });
        });

        it('should maintain consistent review section structure across all tours', async () => {
            const tourPages = [GionTour, MorningTour, NightTour, UjiTour];

            for (const TourComponent of tourPages) {
                const { unmount } = renderTourPage(TourComponent);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
                });

                // Verify consistent structure
                expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
                expect(screen.getByTestId('tripadvisor-reviews')).toHaveClass('px-4');

                unmount();
            }
        });
    });

    describe('Requirement 5.5: Consistent styling across tour pages', () => {
        it('should use consistent TripAdvisorReviews configuration across all tour pages', async () => {
            const tourPages = [GionTour, MorningTour, NightTour, UjiTour];

            for (const TourComponent of tourPages) {
                const { unmount } = renderTourPage(TourComponent);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
                });

                // Verify consistent configuration
                expect(screen.getByTestId('max-reviews')).toHaveTextContent('6');
                expect(screen.getByTestId('show-rating')).toHaveTextContent('true');
                expect(screen.getByTestId('layout')).toHaveTextContent('grid');
                expect(screen.getByTestId('show-attribution')).toHaveTextContent('true');

                unmount();
            }
        });

        it('should have consistent section styling and positioning', async () => {
            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Find the reviews section container
            const reviewsSection = screen.getByTestId('tripadvisor-reviews').closest('.mt-16.mb-12');
            expect(reviewsSection).toBeInTheDocument();

            // Verify heading styling
            const heading = screen.getByText('Customer Reviews');
            expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900', 'mb-4');
        });

        it('should position reviews section correctly relative to other components', async () => {
            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Verify reviews section appears after main content but before footer
            const reviewsSection = screen.getByTestId('tripadvisor-reviews');
            const footer = screen.getByTestId('footer');

            // Reviews should come before footer in DOM order
            expect(reviewsSection.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });
    });

    describe('Error handling and loading states', () => {
        it('should handle tour data loading errors gracefully', async () => {
            getTour.mockRejectedValue(new Error('Failed to load tour data'));

            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByText('Unable to load tour information. Please try again later.')).toBeInTheDocument();
            });

            // Reviews section should not be rendered when tour data fails to load
            expect(screen.queryByTestId('tripadvisor-reviews')).not.toBeInTheDocument();
        });

        it('should show loading state while tour data is being fetched', async () => {
            // Mock a delayed response
            getTour.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockTourData), 100)));

            renderTourPage(GionTour);

            // Should show loading state initially
            expect(screen.getByText('Loading tour information...')).toBeInTheDocument();
            expect(screen.queryByTestId('tripadvisor-reviews')).not.toBeInTheDocument();

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            expect(screen.queryByText('Loading tour information...')).not.toBeInTheDocument();
        });
    });

    describe('Responsive behavior', () => {
        it('should maintain reviews section on mobile devices', async () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 768,
            });

            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Reviews section should still be present on mobile
            expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
            expect(screen.getByTestId('layout')).toHaveTextContent('grid');
        });

        it('should maintain consistent spacing on different screen sizes', async () => {
            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Verify the reviews section has proper spacing classes
            const reviewsContainer = screen.getByTestId('tripadvisor-reviews').closest('.mt-16.mb-12');
            expect(reviewsContainer).toBeInTheDocument();
        });
    });

    describe('Accessibility and SEO', () => {
        it('should have proper heading hierarchy for reviews section', async () => {
            renderTourPage(GionTour);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            // Reviews section should have h2 heading
            const heading = screen.getByRole('heading', { name: 'Customer Reviews' });
            expect(heading.tagName).toBe('H2');
        });

        it('should provide descriptive text for each tour type', async () => {
            const tourDescriptions = [
                { component: GionTour, text: 'Gion District walking tour experience' },
                { component: MorningTour, text: 'morning tour experience visiting Fushimi Inari, Bamboo Grove, and Tenryu-ji Temple' },
                { component: NightTour, text: 'evening Fushimi Inari Shrine tour experience' },
                { component: UjiTour, text: 'Uji matcha experience and Byodo-in Temple tour' }
            ];

            for (const { component: TourComponent, text } of tourDescriptions) {
                const { unmount } = renderTourPage(TourComponent);

                await waitFor(() => {
                    expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
                });

                unmount();
            }
        });
    });
});
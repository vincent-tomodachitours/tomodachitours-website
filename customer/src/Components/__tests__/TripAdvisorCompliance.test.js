import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TripAdvisorReviews from '../TripAdvisorReviews';
import ReviewCard from '../ReviewCard';
import * as tripAdvisorService from '../../services/tripAdvisorService';

// Mock the TripAdvisor service
jest.mock('../../services/tripAdvisorService', () => ({
    getBusinessReviews: jest.fn()
}));

describe('TripAdvisor Compliance Tests', () => {
    const mockLocationId = 'test-location-123';

    const mockReviews = [
        {
            id: 'review-1',
            title: 'Amazing tour!',
            text: 'Had a wonderful time exploring Kyoto with our guide.',
            rating: 5,
            author: 'John Doe',
            authorLocation: 'New York, NY',
            date: '2024-01-15',
            helpfulVotes: 3
        },
        {
            id: 'review-2',
            title: 'Great experience',
            text: 'The tour was well organized and informative.',
            rating: 4,
            author: 'Jane Smith',
            authorLocation: 'London, UK',
            date: '2024-01-10',
            helpfulVotes: 1
        }
    ];

    const mockBusinessInfo = {
        locationId: mockLocationId,
        name: 'Tomodachi Tours',
        overallRating: 4.8,
        totalReviews: 150,
        ranking: '#1 of 50 Tours in Kyoto',
        tripAdvisorUrl: 'https://tripadvisor.com/test-location'
    };

    const mockSuccessResponse = {
        reviews: mockReviews,
        businessInfo: mockBusinessInfo,
        cached: false,
        fetchedAt: '2024-01-20T10:00:00Z'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);
    });

    describe('Requirement 1.3: TripAdvisor branding and attribution', () => {
        it('should display proper TripAdvisor attribution', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Check "Powered by TripAdvisor" text
            expect(screen.getByText('Powered by')).toBeInTheDocument();
            const tripAdvisorTexts = screen.getAllByText('TripAdvisor');
            expect(tripAdvisorTexts.length).toBeGreaterThan(0);

            // Check TripAdvisor logo is present
            const logo = screen.getByLabelText('TripAdvisor Logo');
            expect(logo).toBeInTheDocument();
            expect(logo.tagName).toBe('svg');
        });

        it('should include compliance notice text', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            expect(screen.getByText(/Reviews are provided by TripAdvisor/)).toBeInTheDocument();
            expect(screen.getByText(/TripAdvisor and the TripAdvisor logo are trademarks/)).toBeInTheDocument();
            expect(screen.getByText(/Reviews displayed with permission from TripAdvisor/)).toBeInTheDocument();
        });

        it('should display TripAdvisor badge on each review card', () => {
            mockReviews.forEach((review, index) => {
                const { unmount } = render(<ReviewCard review={review} />);

                const badge = screen.getByTestId('tripadvisor-badge');
                expect(badge).toBeInTheDocument();
                expect(badge).toHaveTextContent('TripAdvisor');

                // Clean up for next iteration
                unmount();
            });
        });
    });

    describe('Requirement 4.1: TripAdvisor attribution and branding', () => {
        it('should include proper TripAdvisor attribution', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
            });

            const attribution = screen.getByTestId('tripadvisor-attribution');

            // Check attribution contains required elements
            expect(attribution).toHaveTextContent('Powered by');
            expect(attribution).toHaveTextContent('TripAdvisor');

            // Check logo is present with correct attributes
            const logo = screen.getByLabelText('TripAdvisor Logo');
            expect(logo).toHaveAttribute('fill', '#00AA6C');
        });

        it('should use official TripAdvisor brand colors', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Check TripAdvisor green (#00AA6C) is used for logos
            const logos = screen.getAllByLabelText(/TripAdvisor/);
            logos.forEach(logo => {
                expect(logo).toHaveAttribute('fill', '#00AA6C');
            });

            // Check business rating uses TripAdvisor green
            const ratingElement = screen.getByText('4.8');
            expect(ratingElement).toHaveStyle('color: #00AA6C');
        });

        it('should maintain consistent branding across all components', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Check all TripAdvisor logos use consistent color
            const allLogos = screen.getAllByLabelText(/TripAdvisor/);
            expect(allLogos.length).toBeGreaterThan(0);

            allLogos.forEach(logo => {
                expect(logo).toHaveAttribute('fill', '#00AA6C');
            });

            // Check all TripAdvisor text uses consistent styling
            const tripAdvisorTexts = screen.getAllByText('TripAdvisor');
            expect(tripAdvisorTexts.length).toBeGreaterThan(0);
        });
    });

    describe('Requirement 4.2: Link to TripAdvisor business listing', () => {
        it('should include link to TripAdvisor business listing', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-business-link')).toBeInTheDocument();
            });

            const businessLink = screen.getByTestId('tripadvisor-business-link');
            expect(businessLink).toHaveAttribute('href', mockBusinessInfo.tripAdvisorUrl);
            expect(businessLink).toHaveAttribute('target', '_blank');
            expect(businessLink).toHaveAttribute('rel', 'noopener noreferrer');
            expect(businessLink).toHaveTextContent('View all reviews on TripAdvisor');
        });

        it('should include TripAdvisor link in business rating section', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} showRating={true} />);

            await waitFor(() => {
                expect(screen.getByTestId('business-rating')).toBeInTheDocument();
            });

            const tripAdvisorLink = screen.getByTestId('tripadvisor-link');
            expect(tripAdvisorLink).toBeInTheDocument();
            expect(tripAdvisorLink).toHaveAttribute('href', mockBusinessInfo.tripAdvisorUrl);
            expect(tripAdvisorLink).toHaveAttribute('target', '_blank');
            expect(tripAdvisorLink).toHaveAttribute('rel', 'noopener noreferrer');
            expect(tripAdvisorLink).toHaveTextContent('View on TripAdvisor');
        });

        it('should ensure all external links have proper security attributes', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Check all external links have proper security attributes
            const externalLinks = screen.getAllByRole('link');
            externalLinks.forEach(link => {
                if (link.getAttribute('href')?.includes('tripadvisor.com')) {
                    expect(link).toHaveAttribute('target', '_blank');
                    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
                }
            });
        });
    });

    describe('Brand Guidelines Compliance', () => {
        it('should use TripAdvisor orange for star ratings', () => {
            const review = mockReviews[0];
            render(<ReviewCard review={review} />);

            const ratingContainer = screen.getByLabelText(`Rating: ${review.rating} out of 5 stars`);
            const filledStars = ratingContainer.querySelectorAll('svg path[fill="#FF5722"]');

            // Should have filled stars with TripAdvisor orange color
            expect(filledStars.length).toBe(review.rating);
        });

        it('should use proper TripAdvisor green for branding elements', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Check TripAdvisor green (#00AA6C) is used consistently
            const logoElement = screen.getByLabelText('TripAdvisor Logo');
            const ratingElement = screen.getByText('4.8');

            expect(logoElement).toHaveAttribute('fill', '#00AA6C');
            expect(ratingElement).toHaveStyle('color: #00AA6C');

            // Check all TripAdvisor logos use the correct color
            const allLogos = screen.getAllByLabelText(/TripAdvisor/);
            allLogos.forEach(logo => {
                expect(logo).toHaveAttribute('fill', '#00AA6C');
            });
        });

        it('should maintain proper logo proportions and visibility', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            const logos = screen.getAllByLabelText(/TripAdvisor/);
            logos.forEach(logo => {
                // Check logo is visible
                expect(logo).toBeVisible();
                // Check logo has proper viewBox for scalability
                expect(logo).toHaveAttribute('viewBox', '0 0 200 200');
                // Check logo has proper fill color
                expect(logo).toHaveAttribute('fill', '#00AA6C');
            });
        });
    });

    describe('Accessibility Compliance', () => {
        it('should have proper aria labels for TripAdvisor elements', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Check aria labels are present
            expect(screen.getByLabelText('TripAdvisor Logo')).toBeInTheDocument();

            // Check that multiple TripAdvisor logos exist (in business rating and review cards)
            const tripAdvisorLogos = screen.getAllByLabelText('TripAdvisor');
            expect(tripAdvisorLogos.length).toBeGreaterThan(0);
        });

        it('should have proper semantic structure for screen readers', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
            });

            const attribution = screen.getByTestId('tripadvisor-attribution');

            // Check proper semantic structure
            expect(attribution).toHaveClass('text-center');

            // Check links are properly structured
            const links = attribution.querySelectorAll('a');
            links.forEach(link => {
                expect(link).toHaveAttribute('href');
                expect(link).toHaveAttribute('target', '_blank');
                expect(link).toHaveAttribute('rel', 'noopener noreferrer');
            });
        });

        it('should provide proper context for review ratings', () => {
            const review = mockReviews[0];
            render(<ReviewCard review={review} />);

            const ratingContainer = screen.getByLabelText(`Rating: ${review.rating} out of 5 stars`);
            expect(ratingContainer).toBeInTheDocument();

            // Check rating text is also present for screen readers
            expect(screen.getByText(`${review.rating}/5`)).toBeInTheDocument();
        });
    });

    describe('Content Integrity', () => {
        it('should display reviews without modification', () => {
            mockReviews.forEach((review, index) => {
                const { unmount } = render(<ReviewCard review={review} />);

                // Check original content is preserved
                expect(screen.getByText(review.title)).toBeInTheDocument();
                expect(screen.getByText(review.text)).toBeInTheDocument();
                expect(screen.getByText(review.author)).toBeInTheDocument();
                expect(screen.getByText(`${review.rating}/5`)).toBeInTheDocument();

                // Clean up for next iteration
                unmount();
            });
        });

        it('should include reviewer attribution', () => {
            const review = mockReviews[0];
            render(<ReviewCard review={review} />);

            expect(screen.getByText(review.author)).toBeInTheDocument();
            expect(screen.getByText(review.authorLocation)).toBeInTheDocument();
        });

        it('should show review dates', () => {
            const review = mockReviews[0];
            render(<ReviewCard review={review} />);

            // Date should be formatted properly
            const dateElements = screen.getAllByText('January 15, 2024');
            expect(dateElements.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling Compliance', () => {
        it('should maintain branding even when API fails', async () => {
            const errorResponse = {
                reviews: [],
                businessInfo: mockBusinessInfo,
                cached: true,
                cachedAt: '2024-01-19T10:00:00Z',
                error: 'API rate limit exceeded'
            };

            tripAdvisorService.getBusinessReviews.mockResolvedValue(errorResponse);

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            });

            // Attribution should still be present even with no reviews
            expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
            expect(screen.getByText('Powered by')).toBeInTheDocument();
            expect(screen.getByText('TripAdvisor')).toBeInTheDocument();
        });

        it('should handle missing business URL gracefully', async () => {
            const responseWithoutUrl = {
                ...mockSuccessResponse,
                businessInfo: {
                    ...mockBusinessInfo,
                    tripAdvisorUrl: null
                }
            };

            tripAdvisorService.getBusinessReviews.mockResolvedValue(responseWithoutUrl);

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Attribution should still be present
            expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
            expect(screen.getByText('Powered by')).toBeInTheDocument();

            // But business links should not be present
            expect(screen.queryByTestId('tripadvisor-business-link')).not.toBeInTheDocument();
            expect(screen.queryByTestId('tripadvisor-link')).not.toBeInTheDocument();
        });
    });

    describe('Integration Compliance', () => {
        it('should work correctly when attribution is disabled', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} showAttribution={false} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            // Main attribution should be hidden
            expect(screen.queryByTestId('tripadvisor-attribution')).not.toBeInTheDocument();

            // But individual review cards should still have TripAdvisor badges
            const badges = screen.getAllByTestId('tripadvisor-badge');
            expect(badges).toHaveLength(2);
        });

        it('should maintain compliance across different layout modes', async () => {
            // Test grid layout
            const { rerender } = render(
                <TripAdvisorReviews locationId={mockLocationId} layout="grid" />
            );

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();

            // Test carousel layout
            rerender(<TripAdvisorReviews locationId={mockLocationId} layout="carousel" />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
        });
    });
});
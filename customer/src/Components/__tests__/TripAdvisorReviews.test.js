import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TripAdvisorReviews from '../TripAdvisorReviews';
import * as tripAdvisorService from '../../services/tripAdvisorService';

// Mock the TripAdvisor service
jest.mock('../../services/tripAdvisorService', () => ({
    getBusinessReviews: jest.fn()
}));

// Mock ReviewCard component
jest.mock('../ReviewCard', () => {
    return function MockReviewCard({ review }) {
        return (
            <div data-testid="review-card" data-review-id={review.id}>
                <h3>{review.title}</h3>
                <p>{review.text}</p>
                <span>Rating: {review.rating}</span>
                <span>Author: {review.author}</span>
            </div>
        );
    };
});

describe('TripAdvisorReviews', () => {
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
        },
        {
            id: 'review-3',
            title: 'Highly recommended',
            text: 'Our guide was knowledgeable and friendly.',
            rating: 5,
            author: 'Mike Johnson',
            authorLocation: 'Sydney, Australia',
            date: '2024-01-05',
            helpfulVotes: 2
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
    });

    describe('Loading States', () => {
        it('should show skeleton placeholders while loading', () => {
            // Mock a pending promise that never resolves during the test
            tripAdvisorService.getBusinessReviews.mockReturnValue(new Promise(() => { }));

            render(<TripAdvisorReviews locationId={mockLocationId} maxReviews={3} />);

            // Should show skeleton cards
            expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
            expect(screen.queryByTestId('review-card')).not.toBeInTheDocument();
        });

        it('should show correct number of skeleton cards based on maxReviews', () => {
            tripAdvisorService.getBusinessReviews.mockReturnValue(new Promise(() => { }));

            render(<TripAdvisorReviews locationId={mockLocationId} maxReviews={2} />);

            expect(screen.getAllByTestId('skeleton-card')).toHaveLength(2);
        });

        it('should limit skeleton cards to maximum of 6', () => {
            tripAdvisorService.getBusinessReviews.mockReturnValue(new Promise(() => { }));

            render(<TripAdvisorReviews locationId={mockLocationId} maxReviews={10} />);

            expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
        });
    });

    describe('Successful Data Loading', () => {
        beforeEach(() => {
            tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);
        });

        it('should render reviews after successful load', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(screen.getByText('Amazing tour!')).toBeInTheDocument();
            expect(screen.getByText('Great experience')).toBeInTheDocument();
            expect(screen.getByText('Highly recommended')).toBeInTheDocument();
        });

        it('should limit reviews to maxReviews prop', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} maxReviews={2} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(2);
            });

            expect(tripAdvisorService.getBusinessReviews).toHaveBeenCalledWith({
                locationId: mockLocationId,
                maxReviews: 2,
                forceRefresh: false
            });
        });

        it('should display business rating when showRating is true', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} showRating={true} />);

            await waitFor(() => {
                expect(screen.getByTestId('business-rating')).toBeInTheDocument();
            });

            expect(screen.getByText('4.8')).toBeInTheDocument();
            expect(screen.getByText('Based on 150 reviews')).toBeInTheDocument();
            expect(screen.getByText('#1 of 50 Tours in Kyoto')).toBeInTheDocument();
        });

        it('should hide business rating when showRating is false', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} showRating={false} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(screen.queryByTestId('business-rating')).not.toBeInTheDocument();
        });

        it('should display TripAdvisor attribution by default', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
            expect(screen.getByText('Powered by')).toBeInTheDocument();
            expect(screen.getByText('View all reviews on TripAdvisor')).toBeInTheDocument();
        });

        it('should hide attribution when showAttribution is false', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} showAttribution={false} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(screen.queryByTestId('tripadvisor-attribution')).not.toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display error state when API call fails', async () => {
            const errorMessage = 'API rate limit exceeded';
            tripAdvisorService.getBusinessReviews.mockRejectedValue(new Error(errorMessage));

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('error-state')).toBeInTheDocument();
            });

            expect(screen.getByText('Unable to Load Reviews')).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.getByTestId('retry-button')).toBeInTheDocument();
        });

        it('should handle retry functionality', async () => {
            const errorMessage = 'Network error';
            tripAdvisorService.getBusinessReviews
                .mockRejectedValueOnce(new Error(errorMessage))
                .mockResolvedValueOnce(mockSuccessResponse);

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            // Wait for error state
            await waitFor(() => {
                expect(screen.getByTestId('error-state')).toBeInTheDocument();
            });

            // Click retry button
            fireEvent.click(screen.getByTestId('retry-button'));

            // Wait for successful load
            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(tripAdvisorService.getBusinessReviews).toHaveBeenCalledTimes(2);
        });
    });

    describe('Empty State', () => {
        it('should display empty state when no reviews are returned', async () => {
            const emptyResponse = {
                reviews: [],
                businessInfo: mockBusinessInfo,
                cached: false,
                fetchedAt: '2024-01-20T10:00:00Z'
            };

            tripAdvisorService.getBusinessReviews.mockResolvedValue(emptyResponse);

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            });

            expect(screen.getByText('No Reviews Available')).toBeInTheDocument();
            expect(screen.getByText('Customer reviews will appear here once they become available.')).toBeInTheDocument();
        });
    });

    describe('Layout Options', () => {
        beforeEach(() => {
            tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);
        });

        it('should apply grid layout by default', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            const reviewsContainer = screen.getAllByTestId('review-card')[0].parentElement.parentElement;
            expect(reviewsContainer).toHaveClass('grid');
        });

        it('should apply carousel layout when specified', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} layout="carousel" />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            const reviewsContainer = screen.getAllByTestId('review-card')[0].parentElement.parentElement;
            expect(reviewsContainer).toHaveClass('flex', 'overflow-x-auto');
        });
    });

    describe('Props and Configuration', () => {
        beforeEach(() => {
            tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);
        });

        it('should apply custom className', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} className="custom-class" />);

            await waitFor(() => {
                const container = screen.getByTestId('tripadvisor-reviews');
                expect(container).toHaveClass('custom-class');
            });
        });

        it('should not render when locationId is not provided', () => {
            render(<TripAdvisorReviews />);

            expect(screen.queryByTestId('tripadvisor-reviews')).not.toBeInTheDocument();
            expect(tripAdvisorService.getBusinessReviews).not.toHaveBeenCalled();
        });

        it('should pass correct parameters to service', async () => {
            render(
                <TripAdvisorReviews
                    locationId={mockLocationId}
                    maxReviews={5}
                />
            );

            await waitFor(() => {
                expect(tripAdvisorService.getBusinessReviews).toHaveBeenCalledWith({
                    locationId: mockLocationId,
                    maxReviews: 5,
                    forceRefresh: false
                });
            });
        });
    });

    describe('Component State Management', () => {
        it('should handle loading state correctly', () => {
            tripAdvisorService.getBusinessReviews.mockReturnValue(new Promise(() => { }));

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            // Should show loading skeletons
            expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
            expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
            expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
        });

        it('should handle successful state correctly', async () => {
            tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
            expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
            expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
        });

        it('should handle error state correctly', async () => {
            tripAdvisorService.getBusinessReviews.mockRejectedValue(new Error('Test error'));

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('error-state')).toBeInTheDocument();
            });

            expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
            expect(screen.queryByTestId('review-card')).not.toBeInTheDocument();
            expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
        });

        it('should handle empty state correctly', async () => {
            const emptyResponse = {
                reviews: [],
                businessInfo: mockBusinessInfo,
                cached: false,
                fetchedAt: '2024-01-20T10:00:00Z'
            };

            tripAdvisorService.getBusinessReviews.mockResolvedValue(emptyResponse);

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            });

            expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
            expect(screen.queryByTestId('review-card')).not.toBeInTheDocument();
            expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
        });
    });

    describe('TripAdvisor Branding and Compliance', () => {
        beforeEach(() => {
            tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);
        });

        describe('Attribution Requirements', () => {
            it('should display "Powered by TripAdvisor" text', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
                });

                expect(screen.getByText('Powered by')).toBeInTheDocument();
                expect(screen.getByText('TripAdvisor')).toBeInTheDocument();
            });

            it('should display TripAdvisor logo in attribution', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
                });

                const logo = screen.getByLabelText('TripAdvisor Logo');
                expect(logo).toBeInTheDocument();
                expect(logo.tagName).toBe('svg');
            });

            it('should include compliance notice text', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
                });

                expect(screen.getByText(/Reviews are provided by TripAdvisor/)).toBeInTheDocument();
                expect(screen.getByText(/TripAdvisor and the TripAdvisor logo are trademarks/)).toBeInTheDocument();
                expect(screen.getByText(/Reviews displayed with permission from TripAdvisor/)).toBeInTheDocument();
            });

            it('should hide attribution when showAttribution is false', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} showAttribution={false} />);

                await waitFor(() => {
                    expect(screen.getAllByTestId('review-card')).toHaveLength(3);
                });

                expect(screen.queryByTestId('tripadvisor-attribution')).not.toBeInTheDocument();
            });
        });

        describe('Business Listing Link', () => {
            it('should display link to TripAdvisor business listing', async () => {
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

            it('should display TripAdvisor link in business rating section', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} showRating={true} />);

                await waitFor(() => {
                    expect(screen.getByTestId('business-rating')).toBeInTheDocument();
                });

                const tripAdvisorLink = screen.getByTestId('tripadvisor-link');
                expect(tripAdvisorLink).toBeInTheDocument();
                expect(tripAdvisorLink).toHaveAttribute('href', mockBusinessInfo.tripAdvisorUrl);
                expect(tripAdvisorLink).toHaveTextContent('View on TripAdvisor');
            });

            it('should not display business link when tripAdvisorUrl is not available', async () => {
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
                    expect(screen.getAllByTestId('review-card')).toHaveLength(3);
                });

                expect(screen.queryByTestId('tripadvisor-business-link')).not.toBeInTheDocument();
                expect(screen.queryByTestId('tripadvisor-link')).not.toBeInTheDocument();
            });
        });

        describe('Brand Color Usage', () => {
            it('should use TripAdvisor green color for branding elements', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getByTestId('business-rating')).toBeInTheDocument();
                });

                // Check that TripAdvisor logo uses the correct color
                const logo = screen.getByLabelText('TripAdvisor');
                expect(logo).toHaveAttribute('fill', '#00AA6C');

                // Check that business rating uses TripAdvisor green
                const ratingElement = screen.getByText('4.8');
                expect(ratingElement).toHaveStyle('color: #00AA6C');
            });

            it('should use TripAdvisor colors in attribution section', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-attribution')).toBeInTheDocument();
                });

                const attributionLogo = screen.getByLabelText('TripAdvisor Logo');
                expect(attributionLogo).toHaveAttribute('fill', '#00AA6C');

                const tripAdvisorText = screen.getByText('TripAdvisor');
                expect(tripAdvisorText).toHaveStyle('color: #00AA6C');
            });
        });

        describe('Overall Business Rating Display', () => {
            it('should display overall rating with TripAdvisor styling', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} showRating={true} />);

                await waitFor(() => {
                    expect(screen.getByTestId('business-rating')).toBeInTheDocument();
                });

                // Check rating value
                expect(screen.getByText('4.8')).toBeInTheDocument();

                // Check review count
                expect(screen.getByText('Based on 150 reviews')).toBeInTheDocument();

                // Check ranking
                expect(screen.getByText('#1 of 50 Tours in Kyoto')).toBeInTheDocument();

                // Check TripAdvisor logo in rating section
                const logo = screen.getByLabelText('TripAdvisor');
                expect(logo).toBeInTheDocument();
            });

            it('should display star rating with TripAdvisor colors', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} showRating={true} />);

                await waitFor(() => {
                    expect(screen.getByTestId('business-rating')).toBeInTheDocument();
                });

                // Check that stars are rendered (5 stars total)
                const businessRating = screen.getByTestId('business-rating');
                const stars = businessRating.querySelectorAll('svg path[fill="#00AA6C"]');
                expect(stars.length).toBeGreaterThan(0); // Should have filled stars
            });

            it('should handle missing business info gracefully', async () => {
                const responseWithoutBusinessInfo = {
                    ...mockSuccessResponse,
                    businessInfo: null
                };
                tripAdvisorService.getBusinessReviews.mockResolvedValue(responseWithoutBusinessInfo);

                render(<TripAdvisorReviews locationId={mockLocationId} showRating={true} />);

                await waitFor(() => {
                    expect(screen.getAllByTestId('review-card')).toHaveLength(3);
                });

                expect(screen.queryByTestId('business-rating')).not.toBeInTheDocument();
            });
        });

        describe('Compliance Validation', () => {
            it('should ensure all required branding elements are present', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getAllByTestId('review-card')).toHaveLength(3);
                });

                // Check all required elements
                expect(screen.getByText('Powered by')).toBeInTheDocument();
                expect(screen.getByLabelText('TripAdvisor Logo')).toBeInTheDocument();
                expect(screen.getByText('TripAdvisor')).toBeInTheDocument();
                expect(screen.getByTestId('tripadvisor-business-link')).toBeInTheDocument();
                expect(screen.getByText(/Reviews are provided by TripAdvisor/)).toBeInTheDocument();
            });

            it('should ensure external links have proper security attributes', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getByTestId('tripadvisor-business-link')).toBeInTheDocument();
                });

                const businessLink = screen.getByTestId('tripadvisor-business-link');
                expect(businessLink).toHaveAttribute('target', '_blank');
                expect(businessLink).toHaveAttribute('rel', 'noopener noreferrer');

                const ratingLink = screen.getByTestId('tripadvisor-link');
                expect(ratingLink).toHaveAttribute('target', '_blank');
                expect(ratingLink).toHaveAttribute('rel', 'noopener noreferrer');
            });

            it('should maintain branding consistency across all components', async () => {
                render(<TripAdvisorReviews locationId={mockLocationId} />);

                await waitFor(() => {
                    expect(screen.getAllByTestId('review-card')).toHaveLength(3);
                });

                // Check that TripAdvisor green color is used consistently
                const logos = screen.getAllByLabelText(/TripAdvisor/);
                logos.forEach(logo => {
                    expect(logo).toHaveAttribute('fill', '#00AA6C');
                });

                // Check that all TripAdvisor text uses consistent styling
                const tripAdvisorTexts = screen.getAllByText('TripAdvisor');
                expect(tripAdvisorTexts.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            tripAdvisorService.getBusinessReviews.mockResolvedValue(mockSuccessResponse);
        });

        it('should have proper test identifiers', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('tripadvisor-reviews')).toBeInTheDocument();
            });

            expect(screen.getByTestId('tripadvisor-reviews')).toHaveClass('tripadvisor-reviews');
        });

        it('should handle retry button accessibility', async () => {
            tripAdvisorService.getBusinessReviews.mockRejectedValue(new Error('Test error'));

            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getByTestId('error-state')).toBeInTheDocument();
            });

            const retryButton = screen.getByTestId('retry-button');
            expect(retryButton).toBeInTheDocument();
            expect(retryButton.tagName).toBe('BUTTON');
        });

        it('should have proper aria labels for TripAdvisor logos', async () => {
            render(<TripAdvisorReviews locationId={mockLocationId} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('review-card')).toHaveLength(3);
            });

            expect(screen.getByLabelText('TripAdvisor Logo')).toBeInTheDocument();
            expect(screen.getByLabelText('TripAdvisor')).toBeInTheDocument();
        });
    });
});
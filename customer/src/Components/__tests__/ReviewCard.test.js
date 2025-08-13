import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewCard from '../ReviewCard';

// Mock review data for testing
const mockReview = {
    id: 'review_1',
    title: 'Amazing tour experience!',
    text: 'Had a wonderful time exploring Kyoto with our knowledgeable guide. The temples were breathtaking and the local insights were invaluable. Would definitely recommend this tour to anyone visiting Kyoto.',
    rating: 5,
    author: 'John Smith',
    authorLocation: 'New York, NY',
    date: '2024-01-15T10:00:00Z',
    helpfulVotes: 3
};

const mockReviewWithoutOptionalFields = {
    id: 'review_2',
    text: 'Great experience overall.',
    rating: 4
};

const mockLongReview = {
    id: 'review_3',
    title: 'Detailed review',
    text: 'This is a very long review that should be truncated when displayed. '.repeat(10) + 'This text should only be visible when expanded.',
    rating: 4.5,
    author: 'Jane Doe',
    authorLocation: 'London, UK',
    date: '2024-01-20T14:30:00Z',
    helpfulVotes: 1
};

describe('ReviewCard Component', () => {
    test('renders review card with all information', () => {
        render(<ReviewCard review={mockReview} />);

        // Check if main elements are present
        expect(screen.getByTestId('review-card')).toBeInTheDocument();
        expect(screen.getByText('Amazing tour experience!')).toBeInTheDocument();
        expect(screen.getByText(/Had a wonderful time exploring Kyoto/)).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
        expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('3 helpful')).toBeInTheDocument();
    });

    test('renders correct star rating display', () => {
        render(<ReviewCard review={mockReview} />);

        // Check rating display
        expect(screen.getByText('5/5')).toBeInTheDocument();
        expect(screen.getByLabelText('Rating: 5 out of 5 stars')).toBeInTheDocument();

        // Check that 5 stars are rendered (all should be filled)
        const stars = screen.getByLabelText('Rating: 5 out of 5 stars').querySelectorAll('svg');
        expect(stars).toHaveLength(5);
    });

    test('renders half star rating correctly', () => {
        render(<ReviewCard review={mockLongReview} />);

        expect(screen.getByText('4.5/5')).toBeInTheDocument();
        expect(screen.getByLabelText('Rating: 4.5 out of 5 stars')).toBeInTheDocument();
    });

    test('handles review without optional fields', () => {
        render(<ReviewCard review={mockReviewWithoutOptionalFields} />);

        expect(screen.getByText('Great experience overall.')).toBeInTheDocument();
        expect(screen.getByText('4/5')).toBeInTheDocument();
        expect(screen.getByText('Anonymous')).toBeInTheDocument();

        // Optional fields should not be present
        expect(screen.queryByText('helpful')).not.toBeInTheDocument();
    });

    test('truncates long text and shows read more button', () => {
        render(<ReviewCard review={mockLongReview} truncateLength={50} />);

        // Should show truncated text
        const reviewText = screen.getByText(/This is a very long review/);
        expect(reviewText.textContent).toContain('...');
        expect(reviewText.textContent).not.toContain('This text should only be visible when expanded');

        // Should show read more button
        expect(screen.getByTestId('toggle-text-button')).toBeInTheDocument();
        expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    test('expands text when read more is clicked', () => {
        render(<ReviewCard review={mockLongReview} truncateLength={50} />);

        const toggleButton = screen.getByTestId('toggle-text-button');

        // Initially should show truncated text
        expect(screen.getByText('Read more')).toBeInTheDocument();

        // Click read more
        fireEvent.click(toggleButton);

        // Should now show full text and read less button
        expect(screen.getByText('Read less')).toBeInTheDocument();
        expect(screen.getByText(/This text should only be visible when expanded/)).toBeInTheDocument();

        // Click read less
        fireEvent.click(toggleButton);

        // Should return to truncated state
        expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    test('does not show read more button for short text', () => {
        const shortReview = {
            ...mockReview,
            text: 'Short review text.'
        };

        render(<ReviewCard review={shortReview} />);

        expect(screen.queryByTestId('toggle-text-button')).not.toBeInTheDocument();
        expect(screen.getByText('Short review text.')).toBeInTheDocument();
    });

    test('respects showDate prop', () => {
        render(<ReviewCard review={mockReview} showDate={false} />);

        expect(screen.queryByText('January 15, 2024')).not.toBeInTheDocument();
    });

    test('respects showHelpfulVotes prop', () => {
        render(<ReviewCard review={mockReview} showHelpfulVotes={false} />);

        expect(screen.queryByText('3 helpful')).not.toBeInTheDocument();
    });

    test('handles invalid date gracefully', () => {
        const reviewWithInvalidDate = {
            ...mockReview,
            date: 'invalid-date'
        };

        render(<ReviewCard review={reviewWithInvalidDate} />);

        // Should display the original invalid date string
        expect(screen.getByText('invalid-date')).toBeInTheDocument();
    });

    test('does not show helpful votes when count is 0', () => {
        const reviewWithNoHelpfulVotes = {
            ...mockReview,
            helpfulVotes: 0
        };

        render(<ReviewCard review={reviewWithNoHelpfulVotes} />);

        expect(screen.queryByText('helpful')).not.toBeInTheDocument();
    });

    test('applies hover effects and transitions', () => {
        render(<ReviewCard review={mockReview} />);

        const card = screen.getByTestId('review-card');

        // Check for transition classes
        expect(card).toHaveClass('transition-shadow', 'duration-200', 'hover:shadow-lg');
    });

    test('toggle button has proper accessibility attributes', () => {
        render(<ReviewCard review={mockLongReview} truncateLength={50} />);

        const toggleButton = screen.getByTestId('toggle-text-button');

        // Should have proper ARIA attributes
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

        // Click to expand
        fireEvent.click(toggleButton);

        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('renders without title when not provided', () => {
        const reviewWithoutTitle = {
            ...mockReview,
            title: undefined
        };

        render(<ReviewCard review={reviewWithoutTitle} />);

        // Should not render title element
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.getByText(/Had a wonderful time exploring Kyoto/)).toBeInTheDocument();
    });

    test('handles zero rating', () => {
        const reviewWithZeroRating = {
            ...mockReview,
            rating: 0
        };

        render(<ReviewCard review={reviewWithZeroRating} />);

        expect(screen.getByText('0/5')).toBeInTheDocument();
        expect(screen.getByLabelText('Rating: 0 out of 5 stars')).toBeInTheDocument();
    });

    test('handles maximum rating', () => {
        const reviewWithMaxRating = {
            ...mockReview,
            rating: 5
        };

        render(<ReviewCard review={reviewWithMaxRating} />);

        expect(screen.getByText('5/5')).toBeInTheDocument();
        expect(screen.getByLabelText('Rating: 5 out of 5 stars')).toBeInTheDocument();
    });

    test('responsive design classes are applied', () => {
        render(<ReviewCard review={mockReview} />);

        // Check for responsive text classes
        const reviewText = screen.getByText(/Had a wonderful time exploring Kyoto/);
        expect(reviewText).toHaveClass('text-sm', 'md:text-base');

        // Check for responsive flex classes in footer
        const card = screen.getByTestId('review-card');
        const footer = card.querySelector('.border-t');
        expect(footer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between');
    });

    test('custom truncate length works correctly', () => {
        const customTruncateLength = 20;
        render(<ReviewCard review={mockLongReview} truncateLength={customTruncateLength} />);

        const reviewText = screen.getByText(/This is a very long/);
        // Text should be truncated at custom length + "..."
        expect(reviewText.textContent.length).toBeLessThan(mockLongReview.text.length);
        expect(reviewText.textContent).toContain('...');
    });

    test('keyboard navigation works for toggle button', () => {
        render(<ReviewCard review={mockLongReview} truncateLength={50} />);

        const toggleButton = screen.getByTestId('toggle-text-button');

        // Should be focusable
        toggleButton.focus();
        expect(toggleButton).toHaveFocus();

        // Should have focus styles
        expect(toggleButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    describe('TripAdvisor Branding', () => {
        test('displays TripAdvisor badge in footer', () => {
            render(<ReviewCard review={mockReview} />);

            const tripAdvisorBadge = screen.getByTestId('tripadvisor-badge');
            expect(tripAdvisorBadge).toBeInTheDocument();
            expect(tripAdvisorBadge).toHaveTextContent('TripAdvisor');
        });

        test('TripAdvisor badge includes logo with correct color', () => {
            render(<ReviewCard review={mockReview} />);

            const tripAdvisorBadge = screen.getByTestId('tripadvisor-badge');
            const logo = tripAdvisorBadge.querySelector('svg');

            expect(logo).toBeInTheDocument();
            expect(logo).toHaveAttribute('fill', '#00AA6C');
            expect(logo).toHaveAttribute('aria-label', 'TripAdvisor');
        });

        test('uses TripAdvisor brand colors for star ratings', () => {
            render(<ReviewCard review={mockReview} />);

            const ratingContainer = screen.getByLabelText('Rating: 5 out of 5 stars');
            const stars = ratingContainer.querySelectorAll('svg path[fill="#FF5722"]');

            // Should have filled stars with TripAdvisor orange color
            expect(stars.length).toBe(5); // All 5 stars should be filled for rating of 5
        });

        test('uses correct colors for empty stars', () => {
            const lowRatingReview = {
                ...mockReview,
                rating: 2
            };

            render(<ReviewCard review={lowRatingReview} />);

            const ratingContainer = screen.getByLabelText('Rating: 2 out of 5 stars');
            const filledStars = ratingContainer.querySelectorAll('svg path[fill="#FF5722"]');
            const emptyStars = ratingContainer.querySelectorAll('svg path[fill="#E5E7EB"]');

            expect(filledStars.length).toBe(2); // 2 filled stars
            expect(emptyStars.length).toBe(3); // 3 empty stars
        });

        test('handles half-star ratings with TripAdvisor colors', () => {
            render(<ReviewCard review={mockLongReview} />); // rating: 4.5

            const ratingContainer = screen.getByLabelText('Rating: 4.5 out of 5 stars');
            const stars = ratingContainer.querySelectorAll('svg');

            expect(stars).toHaveLength(5);

            // Check for gradient definition for half star
            const halfStarGradient = ratingContainer.querySelector('linearGradient');
            expect(halfStarGradient).toBeInTheDocument();
        });

        test('maintains consistent branding across different rating values', () => {
            const ratings = [1, 2.5, 3, 4.5, 5];

            ratings.forEach(rating => {
                const testReview = { ...mockReview, rating, id: `review_${rating}` };
                const { unmount } = render(<ReviewCard review={testReview} />);

                // Check TripAdvisor badge is always present
                expect(screen.getByTestId('tripadvisor-badge')).toBeInTheDocument();

                // Check logo color consistency
                const badge = screen.getByTestId('tripadvisor-badge');
                const logo = badge.querySelector('svg');
                expect(logo).toHaveAttribute('fill', '#00AA6C');

                unmount();
            });
        });

        test('TripAdvisor badge is positioned correctly in footer', () => {
            render(<ReviewCard review={mockReview} />);

            const footer = screen.getByTestId('review-card').querySelector('.border-t');
            const tripAdvisorBadge = screen.getByTestId('tripadvisor-badge');

            // Badge should be in the footer
            expect(footer).toContainElement(tripAdvisorBadge);

            // Badge should be in the right section with other metadata
            const metadataSection = footer.querySelector('.flex.items-center.space-x-4');
            expect(metadataSection).toContainElement(tripAdvisorBadge);
        });

        test('TripAdvisor branding elements have proper accessibility', () => {
            render(<ReviewCard review={mockReview} />);

            const tripAdvisorBadge = screen.getByTestId('tripadvisor-badge');
            const logo = tripAdvisorBadge.querySelector('svg');

            // Logo should have proper aria-label
            expect(logo).toHaveAttribute('aria-label', 'TripAdvisor');

            // Badge should be properly structured for screen readers
            expect(tripAdvisorBadge).toHaveClass('flex', 'items-center');
        });
    });
});
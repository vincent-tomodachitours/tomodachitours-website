import {
    validateAndSanitizeReviewText,
    validateRating,
    validateAndFormatDate,
    formatDateForDisplay,
    truncateReviewText,
    validateUsername,
    validateHelpfulVotes,
    processAndValidateReview,
    processReviewsData,
    processLocationData,
    generateStarRating,
    formatHelpfulVotes
} from '../tripAdvisorDataProcessor';

describe('TripAdvisor Data Processor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateAndSanitizeReviewText', () => {
        test('should sanitize and validate normal text', () => {
            const text = 'This is a great tour! I really enjoyed it.';
            const result = validateAndSanitizeReviewText(text);

            expect(result.isValid).toBe(true);
            expect(result.sanitizedText).toBe(text);
            expect(result.errors).toHaveLength(0);
        });

        test('should sanitize HTML content', () => {
            const text = '<script>alert("xss")</script>Great tour!';

            const result = validateAndSanitizeReviewText(text);

            expect(result.isValid).toBe(true);
            // The sanitization removes script tags but may leave content
            expect(result.sanitizedText).toContain('Great tour!');
            expect(result.sanitizedText).not.toContain('<script>');
            expect(result.sanitizedText).not.toContain('</script>');
            expect(result.errors).toHaveLength(0);
        });

        test('should reject text that is too long', () => {
            const longText = 'a'.repeat(2001);
            const result = validateAndSanitizeReviewText(longText);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Review text must not exceed 2000 characters');
        });

        test('should reject text that is too short', () => {
            const result = validateAndSanitizeReviewText('', { minLength: 1, allowEmptyText: false });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Review text is required');
        });

        test('should detect and sanitize suspicious patterns', () => {
            const maliciousText = 'Great tour! javascript:alert("xss")';
            const result = validateAndSanitizeReviewText(maliciousText);

            expect(result.isValid).toBe(true);
            expect(result.sanitizedText).toContain('Great tour!');
            expect(result.sanitizedText).not.toContain('javascript:');
            expect(result.errors).toHaveLength(0);
        });

        test('should handle null/undefined text', () => {
            const result = validateAndSanitizeReviewText(null);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Review text is required');
        });

        test('should allow empty text when configured', () => {
            const result = validateAndSanitizeReviewText('', { allowEmptyText: true });

            expect(result.isValid).toBe(true);
            expect(result.sanitizedText).toBe('');
        });
    });

    describe('validateRating', () => {
        test('should validate valid ratings', () => {
            const validRatings = [1, 2, 3, 4, 5, '3', '4.5'];

            validRatings.forEach(rating => {
                const result = validateRating(rating);
                expect(result.isValid).toBe(true);
                expect(result.normalizedRating).toBeGreaterThanOrEqual(1);
                expect(result.normalizedRating).toBeLessThanOrEqual(5);
            });
        });

        test('should reject invalid ratings', () => {
            const invalidRatings = [0, 6, -1, 'abc', null, undefined];

            invalidRatings.forEach(rating => {
                const result = validateRating(rating);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });

        test('should normalize decimal ratings to integers', () => {
            const result = validateRating(4.7);
            expect(result.isValid).toBe(true);
            expect(result.normalizedRating).toBe(5);
        });
    });

    describe('validateAndFormatDate', () => {
        test('should validate and format valid dates', () => {
            const validDate = '2024-01-15';
            const result = validateAndFormatDate(validDate);

            expect(result.isValid).toBe(true);
            expect(result.isoDate).toBe('2024-01-15');
            expect(result.formattedDate).toBeTruthy();
        });

        test('should reject future dates', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const result = validateAndFormatDate(futureDate.toISOString());

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Review date cannot be in the future');
        });

        test('should reject very old dates', () => {
            const oldDate = new Date();
            oldDate.setFullYear(oldDate.getFullYear() - 15);

            const result = validateAndFormatDate(oldDate.toISOString());

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Review date is too old');
        });

        test('should reject invalid date formats', () => {
            const invalidDates = ['invalid-date', '2024-13-45', null, undefined];

            invalidDates.forEach(date => {
                const result = validateAndFormatDate(date);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });
    });

    describe('formatDateForDisplay', () => {
        test('should format recent dates relatively', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const result = formatDateForDisplay(yesterday);
            expect(result).toBe('Yesterday');
        });

        test('should format dates within a week', () => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const result = formatDateForDisplay(threeDaysAgo);
            expect(result).toBe('3 days ago');
        });

        test('should format older dates absolutely', () => {
            const oldDate = new Date('2023-01-15');
            const result = formatDateForDisplay(oldDate);

            expect(result).toContain('January');
            expect(result).toContain('2023');
        });

        test('should handle invalid dates', () => {
            const result = formatDateForDisplay(new Date('invalid'));
            expect(result).toBe('');
        });
    });

    describe('truncateReviewText', () => {
        test('should not truncate short text', () => {
            const shortText = 'Short review';
            const result = truncateReviewText(shortText, 150);

            expect(result.isTruncated).toBe(false);
            expect(result.truncated).toBe(shortText);
            expect(result.originalLength).toBe(shortText.length);
        });

        test('should truncate long text at word boundaries', () => {
            const longText = 'This is a very long review that should be truncated at a reasonable word boundary to maintain readability';
            const result = truncateReviewText(longText, 50);

            expect(result.isTruncated).toBe(true);
            expect(result.truncated.length).toBeLessThanOrEqual(54); // 50 + '...'
            expect(result.truncated).toContain('...');
            expect(result.originalLength).toBe(longText.length);
        });

        test('should handle non-string input', () => {
            const result = truncateReviewText(null, 150);

            expect(result.truncated).toBe('');
            expect(result.isTruncated).toBe(false);
            expect(result.originalLength).toBe(0);
        });

        test('should use custom suffix', () => {
            const longText = 'This is a long text that needs truncation';
            const result = truncateReviewText(longText, 20, ' [more]');

            expect(result.truncated).toContain(' [more]');
        });
    });

    describe('validateUsername', () => {
        test('should validate and sanitize normal usernames', () => {
            const username = 'TravelLover123';
            const result = validateUsername(username);

            expect(result.isValid).toBe(true);
            expect(result.sanitizedUsername).toBe(username);
        });

        test('should default to Anonymous for invalid usernames', () => {
            const invalidUsernames = [null, undefined, '', '   '];

            invalidUsernames.forEach(username => {
                const result = validateUsername(username);
                expect(result.sanitizedUsername).toBe('Anonymous');
            });
        });

        test('should truncate very long usernames', () => {
            const longUsername = 'a'.repeat(60);
            const result = validateUsername(longUsername);

            expect(result.sanitizedUsername.length).toBeLessThanOrEqual(50);
        });

        test('should sanitize HTML in usernames', () => {
            const maliciousUsername = '<script>alert("xss")</script>User';

            const result = validateUsername(maliciousUsername);
            expect(result.sanitizedUsername).toContain('User');
            expect(result.sanitizedUsername).not.toContain('<script>');
            expect(result.sanitizedUsername).not.toContain('</script>');
        });
    });

    describe('validateHelpfulVotes', () => {
        test('should validate positive vote counts', () => {
            const validVotes = [0, 1, 5, 100, '25'];

            validVotes.forEach(votes => {
                const result = validateHelpfulVotes(votes);
                expect(result.isValid).toBe(true);
                expect(result.normalizedVotes).toBeGreaterThanOrEqual(0);
            });
        });

        test('should reject negative votes', () => {
            const result = validateHelpfulVotes(-5);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Helpful votes cannot be negative');
        });

        test('should handle null/undefined votes', () => {
            const result = validateHelpfulVotes(null);
            expect(result.isValid).toBe(true);
            expect(result.normalizedVotes).toBe(0);
        });

        test('should cap votes at maximum', () => {
            const result = validateHelpfulVotes(99999);
            expect(result.normalizedVotes).toBe(9999);
        });
    });

    describe('processAndValidateReview', () => {
        const validApiReview = {
            id: 'review123',
            title: 'Amazing tour!',
            text: 'Had a wonderful time exploring Kyoto with our guide.',
            rating: 5,
            published_date: '2024-01-15',
            user: {
                username: 'TravelLover',
                user_location: { name: 'New York, NY' }
            },
            helpful_votes: 3,
            lang: 'en'
        };

        test('should process valid review successfully', () => {
            const result = processAndValidateReview(validApiReview);

            expect(result).not.toBeNull();
            expect(result.id).toBe('review123');
            expect(result.title).toBe('Amazing tour!');
            expect(result.text).toBe('Had a wonderful time exploring Kyoto with our guide.');
            expect(result.rating).toBe(5);
            expect(result.author).toBe('TravelLover');
            expect(result.authorLocation).toBe('New York, NY');
            expect(result.helpfulVotes).toBe(3);
            expect(result.isVerified).toBe(true);
            expect(result.language).toBe('en');
        });

        test('should return null for invalid review', () => {
            const invalidReview = {
                id: 'review123',
                text: '', // Empty text
                rating: 10, // Invalid rating
                published_date: 'invalid-date'
            };

            const result = processAndValidateReview(invalidReview);
            expect(result).toBeNull();
        });

        test('should handle missing optional fields', () => {
            const minimalReview = {
                id: 'review123',
                text: 'Good tour',
                rating: 4,
                published_date: '2024-01-15'
            };

            const result = processAndValidateReview(minimalReview);

            expect(result).not.toBeNull();
            expect(result.title).toBe('');
            expect(result.author).toBe('Anonymous');
            expect(result.authorLocation).toBe('');
            expect(result.helpfulVotes).toBe(0);
        });

        test('should sanitize malicious content', () => {
            const maliciousReview = {
                ...validApiReview,
                text: '<script>alert("xss")</script>Great tour!',
                title: '<img src="x" onerror="alert(1)">Amazing'
            };

            const result = processAndValidateReview(maliciousReview);

            expect(result).not.toBeNull();
            expect(result.text).toContain('Great tour!');
            expect(result.text).not.toContain('<script>');
            expect(result.text).not.toContain('</script>');
            expect(result.title).toContain('Amazing');
            expect(result.title).not.toContain('<img');
            expect(result.title).not.toContain('onerror');
        });
    });

    describe('processReviewsData', () => {
        const validApiResponse = {
            data: [
                {
                    id: 'review1',
                    title: 'Great tour',
                    text: 'Really enjoyed the experience',
                    rating: 5,
                    published_date: '2024-01-15',
                    user: { username: 'User1' },
                    helpful_votes: 2
                },
                {
                    id: 'review2',
                    title: 'Good experience',
                    text: 'Nice guide and locations',
                    rating: 4,
                    published_date: '2024-01-10',
                    user: { username: 'User2' },
                    helpful_votes: 1
                }
            ]
        };

        test('should process valid API response', () => {
            const result = processReviewsData(validApiResponse);

            expect(result.reviews).toHaveLength(2);
            expect(result.statistics.totalReceived).toBe(2);
            expect(result.statistics.validReviews).toBe(2);
            expect(result.statistics.invalidReviews).toBe(0);
            expect(result.statistics.errors).toHaveLength(0);
        });

        test('should handle invalid API response', () => {
            const invalidResponse = { invalid: 'data' };
            const result = processReviewsData(invalidResponse);

            expect(result.reviews).toHaveLength(0);
            expect(result.statistics.errors).toContain('API response missing reviews data array');
        });

        test('should filter out invalid reviews', () => {
            const mixedResponse = {
                data: [
                    validApiResponse.data[0], // Valid
                    { id: 'invalid', rating: 10 }, // Invalid rating
                    validApiResponse.data[1] // Valid
                ]
            };

            const result = processReviewsData(mixedResponse);

            expect(result.statistics.totalReceived).toBe(3);
            expect(result.statistics.validReviews).toBe(2);
            expect(result.statistics.invalidReviews).toBe(1);
            expect(result.reviews).toHaveLength(2);
        });

        test('should handle null/undefined response', () => {
            const result = processReviewsData(null);

            expect(result.reviews).toHaveLength(0);
            expect(result.statistics.errors).toContain('Invalid API response format');
        });
    });

    describe('processLocationData', () => {
        const validLocationResponse = {
            location_id: 'loc123',
            name: 'Tomodachi Tours',
            rating: '4.8',
            num_reviews: '150',
            ranking_data: {
                ranking_string: '#1 of 50 Tours in Kyoto'
            },
            web_url: 'https://www.tripadvisor.com/business/loc123',
            address_obj: {
                street1: '123 Main St',
                city: 'Kyoto',
                country: 'Japan'
            }
        };

        test('should process valid location data', () => {
            const result = processLocationData(validLocationResponse);

            expect(result).not.toBeNull();
            expect(result.locationId).toBe('loc123');
            expect(result.name).toBe('Tomodachi Tours');
            expect(result.overallRating).toBe(5); // Rounded from 4.8
            expect(result.totalReviews).toBe(150);
            expect(result.ranking).toBe('#1 of 50 Tours in Kyoto');
            expect(result.tripAdvisorUrl).toBe('https://www.tripadvisor.com/business/loc123');
            expect(result.address).toEqual({
                street1: '123 Main St',
                city: 'Kyoto',
                country: 'Japan'
            });
        });

        test('should handle missing optional fields', () => {
            const minimalLocation = {
                location_id: 'loc123',
                name: 'Test Business'
            };

            const result = processLocationData(minimalLocation);

            expect(result).not.toBeNull();
            expect(result.locationId).toBe('loc123');
            expect(result.name).toBe('Test Business');
            expect(result.overallRating).toBe(0);
            expect(result.totalReviews).toBe(0);
            expect(result.ranking).toBe('');
            expect(result.tripAdvisorUrl).toBe('');
            expect(result.address).toBeNull();
        });

        test('should return null for invalid location data', () => {
            const invalidData = { invalid: 'data' };
            const result = processLocationData(invalidData);

            expect(result).toBeNull();
        });

        test('should validate TripAdvisor URLs', () => {
            const locationWithInvalidUrl = {
                ...validLocationResponse,
                web_url: 'https://malicious-site.com/fake'
            };

            const result = processLocationData(locationWithInvalidUrl);

            expect(result.tripAdvisorUrl).toBe(''); // Should be empty due to invalid URL
        });
    });

    describe('generateStarRating', () => {
        test('should generate star rating string', () => {
            const result = generateStarRating(4);
            expect(result).toBe('★★★★☆');
        });

        test('should handle decimal ratings', () => {
            const result = generateStarRating(4.7);
            expect(result).toBe('★★★★★'); // Rounded to 5
        });

        test('should show numeric rating when requested', () => {
            const result = generateStarRating(4.5, { showNumeric: true });
            expect(result).toContain('★★★★★');
            expect(result).toContain('(4.5)');
        });

        test('should handle invalid ratings', () => {
            const invalidRatings = [0, 6, -1, 'abc', null];

            invalidRatings.forEach(rating => {
                const result = generateStarRating(rating);
                expect(result).toBe('');
            });
        });

        test('should use custom star characters', () => {
            const result = generateStarRating(3, {
                filledStar: '●',
                emptyStar: '○'
            });
            expect(result).toBe('●●●○○');
        });
    });

    describe('formatHelpfulVotes', () => {
        test('should format single vote', () => {
            const result = formatHelpfulVotes(1);
            expect(result).toBe('1 person found this helpful');
        });

        test('should format multiple votes', () => {
            const result = formatHelpfulVotes(5);
            expect(result).toBe('5 people found this helpful');
        });

        test('should handle zero or negative votes', () => {
            expect(formatHelpfulVotes(0)).toBe('');
            expect(formatHelpfulVotes(-1)).toBe('');
        });

        test('should handle invalid input', () => {
            const invalidInputs = ['abc', null, undefined];

            invalidInputs.forEach(input => {
                const result = formatHelpfulVotes(input);
                expect(result).toBe('');
            });
        });
    });
});
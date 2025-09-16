/**
 * TripAdvisor Data Processing and Validation Module
 * 
 * This module handles data transformation, validation, and sanitization
 * for TripAdvisor API responses to ensure data integrity and security.
 */

interface ValidationResult {
    isValid: boolean;
    sanitizedText?: string;
    normalizedRating?: number;
    formattedDate?: string;
    isoDate?: string;
    sanitizedUsername?: string;
    normalizedVotes?: number;
    errors: string[];
}

interface ValidationOptions {
    maxLength?: number;
    minLength?: number;
    allowEmptyText?: boolean;
    requireText?: boolean;
    maxTextLength?: number;
    minTextLength?: number;
}

interface ProcessedReview {
    id: string;
    title: string;
    text: string;
    rating: number;
    author: string;
    authorLocation: string;
    date: string;
    formattedDate: string;
    helpfulVotes: number;
    isVerified: boolean;
    language: string;
    _metadata: {
        processedAt: string;
        originalTextLength: number;
        hasWarnings: boolean;
        warnings: string[];
    };
}

interface ProcessingResult {
    reviews: ProcessedReview[];
    statistics: {
        totalReceived: number;
        validReviews: number;
        invalidReviews: number;
        errors: string[];
        warnings: string[];
    };
}

interface TruncationResult {
    truncated: string;
    isTruncated: boolean;
    originalLength: number;
}

interface ProcessedLocation {
    locationId: string;
    name: string;
    overallRating: number;
    totalReviews: number;
    ranking: string;
    tripAdvisorUrl: string;
    address: {
        street1: string;
        city: string;
        country: string;
    } | null;
}

interface StarRatingOptions {
    filledStar?: string;
    emptyStar?: string;
    showNumeric?: boolean;
}

interface ApiReview {
    id?: string | number;
    text?: string;
    title?: string;
    rating?: number;
    published_date?: string;
    user?: {
        username?: string;
        user_location?: {
            name?: string;
        };
    };
    helpful_votes?: number;
    lang?: string;
}

interface ApiResponse {
    data?: ApiReview[];
}

interface LocationResponse {
    location_id?: string | number;
    name?: string;
    rating?: number;
    num_reviews?: number;
    ranking_data?: {
        ranking_string?: string;
    };
    web_url?: string;
    address_obj?: {
        street1?: string;
        city?: string;
        country?: string;
    };
}

/**
 * HTML sanitization utility to prevent XSS attacks
 */
function sanitizeHtml(text: string): string {
    if (typeof text !== 'string') {
        return '';
    }

    // For test environment or when DOM is not available, use regex-based sanitization
    if (typeof document === 'undefined' || !document.createElement) {
        let sanitized = text;

        // Remove script tags and their content
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

        // Remove all HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');

        // Decode and remove HTML entities
        sanitized = sanitized.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        sanitized = sanitized.replace(/&[^;]+;/g, '');

        // Remove dangerous content
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/[<>]/g, '');

        return sanitized.trim();
    }

    try {
        // Remove HTML tags and decode HTML entities
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const sanitized = tempDiv.textContent || tempDiv.innerText || '';

        // Additional sanitization - remove potentially dangerous characters
        return sanitized
            .replace(/[<>]/g, '') // Remove any remaining angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    } catch (error) {
        // Fallback to regex-based sanitization
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&[^;]+;/g, '') // Remove HTML entities
            .replace(/[<>]/g, '') // Remove any remaining angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    }
}

/**
 * Validate and sanitize review text content
 */
export function validateAndSanitizeReviewText(text: string, options: ValidationOptions = {}): ValidationResult {
    const {
        maxLength = 2000,
        minLength = 1,
        allowEmptyText = false
    } = options;

    const result: ValidationResult = {
        isValid: true,
        sanitizedText: '',
        errors: []
    };

    // Check if text exists
    if (!text || typeof text !== 'string') {
        if (!allowEmptyText) {
            result.isValid = false;
            result.errors.push('Review text is required');
        }
        return result;
    }

    // Sanitize the text
    const sanitized = sanitizeHtml(text);

    // Validate length
    if (sanitized.length < minLength) {
        result.isValid = false;
        result.errors.push(`Review text must be at least ${minLength} characters long`);
    }

    if (sanitized.length > maxLength) {
        result.isValid = false;
        result.errors.push(`Review text must not exceed ${maxLength} characters`);
    }

    // Check for suspicious patterns in the original text
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i,
        /vbscript:/i
    ];

    let hasSuspiciousContent = false;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(text)) {
            hasSuspiciousContent = true;
            break;
        }
    }

    // If suspicious content is found, apply additional sanitization
    if (hasSuspiciousContent) {
        // Additional aggressive sanitization for suspicious content
        result.sanitizedText = sanitized
            .replace(/script/gi, '')
            .replace(/javascript/gi, '')
            .replace(/vbscript/gi, '')
            .replace(/on\w+/gi, '');
    } else {
        result.sanitizedText = sanitized;
    }
    return result;
}

/**
 * Validate rating value
 */
export function validateRating(rating: any): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        normalizedRating: 0,
        errors: []
    };

    // Convert to number
    const numRating = Number(rating);

    // Check if it's a valid number
    if (isNaN(numRating)) {
        result.isValid = false;
        result.errors.push('Rating must be a valid number');
        return result;
    }

    // Check range (TripAdvisor uses 1-5 scale)
    if (numRating < 1 || numRating > 5) {
        result.isValid = false;
        result.errors.push('Rating must be between 1 and 5');
        return result;
    }

    // Normalize to integer (TripAdvisor ratings are whole numbers)
    result.normalizedRating = Math.round(numRating);
    return result;
}

/**
 * Validate and format date string
 */
export function validateAndFormatDate(date: any): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        formattedDate: '',
        isoDate: '',
        errors: []
    };

    if (!date) {
        result.isValid = false;
        result.errors.push('Date is required');
        return result;
    }

    let dateObj: Date;

    // Try to parse the date
    try {
        dateObj = new Date(date);

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date');
        }

        // Check if date is not in the future (reviews can't be from future)
        const now = new Date();
        if (dateObj > now) {
            result.isValid = false;
            result.errors.push('Review date cannot be in the future');
            return result;
        }

        // Check if date is not too old (reasonable limit)
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        if (dateObj < tenYearsAgo) {
            result.isValid = false;
            result.errors.push('Review date is too old');
            return result;
        }

    } catch (error) {
        result.isValid = false;
        result.errors.push('Invalid date format');
        return result;
    }

    // Format the date
    result.isoDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    result.formattedDate = formatDateForDisplay(dateObj);

    return result;
}

/**
 * Format date for user display
 */
export function formatDateForDisplay(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Show relative dates for recent reviews
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
    } else if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays <= 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        // For older reviews, show the actual date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Truncate review text with proper word boundaries
 */
export function truncateReviewText(text: string, maxLength: number = 150, suffix: string = '...'): TruncationResult {
    if (typeof text !== 'string') {
        return {
            truncated: '',
            isTruncated: false,
            originalLength: 0
        };
    }

    const originalLength = text.length;

    if (originalLength <= maxLength) {
        return {
            truncated: text,
            isTruncated: false,
            originalLength
        };
    }

    // Find the last space before the max length to avoid cutting words
    let truncateAt = maxLength;
    const lastSpace = text.lastIndexOf(' ', maxLength);

    if (lastSpace > maxLength * 0.8) { // Only use space if it's not too far back
        truncateAt = lastSpace;
    }

    const truncated = text.substring(0, truncateAt).trim() + suffix;

    return {
        truncated,
        isTruncated: true,
        originalLength
    };
}

/**
 * Validate username/author name
 */
export function validateUsername(username: any): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        sanitizedUsername: 'Anonymous',
        errors: []
    };

    if (!username || typeof username !== 'string') {
        return result; // Default to Anonymous
    }

    // Sanitize the username
    const sanitized = sanitizeHtml(username.trim());

    // Check length
    if (sanitized.length > 50) {
        result.sanitizedUsername = sanitized.substring(0, 50).trim();
    } else if (sanitized.length > 0) {
        result.sanitizedUsername = sanitized;
    }

    return result;
}

/**
 * Validate helpful votes count
 */
export function validateHelpfulVotes(votes: any): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        normalizedVotes: 0,
        errors: []
    };

    if (votes === null || votes === undefined) {
        return result; // Default to 0
    }

    const numVotes = Number(votes);

    if (isNaN(numVotes)) {
        result.isValid = false;
        result.errors.push('Helpful votes must be a number');
        return result;
    }

    if (numVotes < 0) {
        result.isValid = false;
        result.errors.push('Helpful votes cannot be negative');
        return result;
    }

    // Cap at reasonable maximum
    result.normalizedVotes = Math.min(Math.floor(numVotes), 9999);
    return result;
}

/**
 * Transform and validate a single review from TripAdvisor API response
 */
export function processAndValidateReview(apiReview: ApiReview, options: ValidationOptions = {}): ProcessedReview | null {
    if (!apiReview || typeof apiReview !== 'object') {
        return null;
    }

    const {
        requireText = true,
        maxTextLength = 2000,
        minTextLength = 1
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate and process review text
    const textValidation = validateAndSanitizeReviewText(apiReview.text || '', {
        maxLength: maxTextLength,
        minLength: minTextLength,
        allowEmptyText: !requireText
    });

    if (!textValidation.isValid) {
        errors.push(...textValidation.errors);
        if (requireText) {
            return null; // Skip reviews without valid text
        }
    }

    // Validate and process title
    const titleValidation = validateAndSanitizeReviewText(apiReview.title || '', {
        maxLength: 200,
        minLength: 0,
        allowEmptyText: true
    });

    if (!titleValidation.isValid) {
        warnings.push(...titleValidation.errors);
    }

    // Validate rating
    const ratingValidation = validateRating(apiReview.rating);
    if (!ratingValidation.isValid) {
        errors.push(...ratingValidation.errors);
        return null; // Rating is required
    }

    // Validate date
    const dateValidation = validateAndFormatDate(apiReview.published_date);
    if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors);
        return null; // Date is required
    }

    // Validate username
    const usernameValidation = validateUsername(apiReview.user?.username);

    // Validate author location
    const authorLocation = sanitizeHtml(apiReview.user?.user_location?.name || '');

    // Validate helpful votes
    const votesValidation = validateHelpfulVotes(apiReview.helpful_votes);

    // Create the processed review object
    const processedReview: ProcessedReview = {
        id: String(apiReview.id || ''),
        title: titleValidation.sanitizedText || '',
        text: textValidation.sanitizedText || '',
        rating: ratingValidation.normalizedRating || 0,
        author: usernameValidation.sanitizedUsername || 'Anonymous',
        authorLocation: authorLocation,
        date: dateValidation.isoDate || '',
        formattedDate: dateValidation.formattedDate || '',
        helpfulVotes: votesValidation.normalizedVotes || 0,
        isVerified: true, // TripAdvisor reviews are considered verified
        language: String(apiReview.lang || 'en'),

        // Metadata for debugging/monitoring
        _metadata: {
            processedAt: new Date().toISOString(),
            originalTextLength: (apiReview.text || '').length,
            hasWarnings: warnings.length > 0,
            warnings: warnings
        }
    };

    // Final validation - ensure required fields are present
    if (!processedReview.id || !processedReview.text || !processedReview.rating || !processedReview.date) {
        return null;
    }

    return processedReview;
}

/**
 * Process and validate multiple reviews from TripAdvisor API response
 */
export function processReviewsData(apiResponse: ApiResponse, options: ValidationOptions = {}): ProcessingResult {
    const result: ProcessingResult = {
        reviews: [],
        statistics: {
            totalReceived: 0,
            validReviews: 0,
            invalidReviews: 0,
            errors: [],
            warnings: []
        }
    };

    // Validate API response structure
    if (!apiResponse || typeof apiResponse !== 'object') {
        result.statistics.errors.push('Invalid API response format');
        return result;
    }

    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        result.statistics.errors.push('API response missing reviews data array');
        return result;
    }

    result.statistics.totalReceived = apiResponse.data.length;

    // Process each review
    for (let i = 0; i < apiResponse.data.length; i++) {
        const apiReview = apiResponse.data[i];

        try {
            const processedReview = processAndValidateReview(apiReview, options);

            if (processedReview) {
                result.reviews.push(processedReview);
                result.statistics.validReviews++;

                // Collect warnings
                if (processedReview._metadata.hasWarnings) {
                    result.statistics.warnings.push(...processedReview._metadata.warnings);
                }
            } else {
                result.statistics.invalidReviews++;
            }
        } catch (error) {
            result.statistics.invalidReviews++;
            result.statistics.errors.push(`Error processing review ${i}: ${(error as Error).message}`);
        }
    }

    return result;
}

/**
 * Process and validate location data from TripAdvisor API
 */
export function processLocationData(locationResponse: LocationResponse): ProcessedLocation | null {
    if (!locationResponse || typeof locationResponse !== 'object') {
        return null;
    }

    const result: ProcessedLocation = {
        locationId: String(locationResponse.location_id || ''),
        name: sanitizeHtml(locationResponse.name || ''),
        overallRating: 0,
        totalReviews: 0,
        ranking: '',
        tripAdvisorUrl: '',
        address: null
    };

    // Validate and process rating
    if (locationResponse.rating) {
        const ratingValidation = validateRating(locationResponse.rating);
        if (ratingValidation.isValid) {
            result.overallRating = ratingValidation.normalizedRating || 0;
        }
    }

    // Validate and process review count
    const reviewCount = Number(locationResponse.num_reviews);
    if (!isNaN(reviewCount) && reviewCount >= 0) {
        result.totalReviews = Math.floor(reviewCount);
    }

    // Process ranking information
    if (locationResponse.ranking_data?.ranking_string) {
        result.ranking = sanitizeHtml(locationResponse.ranking_data.ranking_string);
    }

    // Process URL
    if (locationResponse.web_url && typeof locationResponse.web_url === 'string') {
        // Basic URL validation
        try {
            const url = new URL(locationResponse.web_url);
            if (url.protocol === 'https:' && url.hostname.includes('tripadvisor.com')) {
                result.tripAdvisorUrl = locationResponse.web_url;
            }
        } catch (error) {
            // Invalid URL, leave empty
        }
    }

    // Process address
    if (locationResponse.address_obj && typeof locationResponse.address_obj === 'object') {
        result.address = {
            street1: sanitizeHtml(locationResponse.address_obj.street1 || ''),
            city: sanitizeHtml(locationResponse.address_obj.city || ''),
            country: sanitizeHtml(locationResponse.address_obj.country || '')
        };
    }

    // Ensure required fields are present
    if (!result.locationId || !result.name) {
        return null;
    }

    return result;
}

/**
 * Generate star rating display string
 */
export function generateStarRating(rating: number, options: StarRatingOptions = {}): string {
    const {
        filledStar = '★',
        emptyStar = '☆',
        showNumeric = false
    } = options;

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return '';
    }

    const roundedRating = Math.round(numRating);
    const stars = filledStar.repeat(roundedRating) + emptyStar.repeat(5 - roundedRating);

    return showNumeric ? `${stars} (${numRating})` : stars;
}

/**
 * Format helpful votes count for display
 */
export function formatHelpfulVotes(votes: number): string {
    const numVotes = Number(votes);
    if (isNaN(numVotes) || numVotes <= 0) {
        return '';
    }

    if (numVotes === 1) {
        return '1 person found this helpful';
    } else {
        return `${numVotes} people found this helpful`;
    }
}
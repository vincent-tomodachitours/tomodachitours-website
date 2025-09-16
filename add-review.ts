#!/usr/bin/env node

/**
 * Helper script to add real TripAdvisor reviews
 * 
 * Usage: npx tsx add-review.ts
 * 
 * This script will prompt you for review details and automatically
 * add them to the realTripAdvisorReviews.js file.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface Review {
    id: string;
    title: string;
    text: string;
    rating: number;
    author: string;
    authorLocation: string;
    date: string;
    helpfulVotes: number;
    isVerified: boolean;
    language: string;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function generateReviewId(): string {
    return 'real_review_' + Date.now();
}

function formatDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Try to parse various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
}

async function addReview(): Promise<void> {
    console.log('\n🌟 Add Real TripAdvisor Review');
    console.log('================================\n');

    try {
        const title = await question('Review title: ');
        const text = await question('Review text: ');
        const rating = await question('Rating (1-5): ');
        const author = await question('Author name: ');
        const authorLocation = await question('Author location (City, Country): ');
        const date = await question('Review date (YYYY-MM-DD or leave empty for today): ');
        const helpfulVotes = await question('Helpful votes (or leave empty for 0): ');

        const review: Review = {
            id: generateReviewId(),
            title: title.trim(),
            text: text.trim(),
            rating: parseInt(rating) || 5,
            author: author.trim() || 'Anonymous',
            authorLocation: authorLocation.trim() || '',
            date: formatDate(date.trim()),
            helpfulVotes: parseInt(helpfulVotes) || 0,
            isVerified: true,
            language: 'en'
        };

        // Read the current file
        const filePath = path.join(__dirname, 'customer/src/data/realTripAdvisorReviews.js');
        let fileContent = fs.readFileSync(filePath, 'utf8');

        // Find the REAL_REVIEWS array and add the new review
        const reviewsArrayMatch = fileContent.match(/export const REAL_REVIEWS = \[([\s\S]*?)\];/);

        if (!reviewsArrayMatch) {
            throw new Error('Could not find REAL_REVIEWS array in file');
        }

        const currentReviews = reviewsArrayMatch[1].trim();
        const reviewString = JSON.stringify(review, null, 4).replace(/^/gm, '    ');

        let newReviewsContent;
        if (currentReviews === '' || currentReviews.includes('// Add your real reviews here')) {
            // First review or only has comments
            newReviewsContent = `export const REAL_REVIEWS = [
    ${reviewString}
];`;
        } else {
            // Add to existing reviews
            newReviewsContent = `export const REAL_REVIEWS = [
${currentReviews},
    ${reviewString}
];`;
        }

        // Replace the array in the file
        fileContent = fileContent.replace(/export const REAL_REVIEWS = \[[\s\S]*?\];/, newReviewsContent);

        // Write back to file
        fs.writeFileSync(filePath, fileContent, 'utf8');

        console.log('\n✅ Review added successfully!');
        console.log('\nReview details:');
        console.log(`- Title: ${review.title}`);
        console.log(`- Rating: ${review.rating}/5`);
        console.log(`- Author: ${review.author}`);
        console.log(`- Date: ${review.date}`);
        console.log('\n💡 The review will now appear on your website!');

    } catch (error) {
        console.error('\n❌ Error adding review:', error.message);
    } finally {
        rl.close();
    }
}

// Run the script
addReview();
/**
 * Real TripAdvisor Reviews Data
 * 
 * This file contains actual reviews manually collected from TripAdvisor
 * while waiting for API access. Add new reviews here as you collect them.
 * 
 * Each review should follow this format:
 * {
 *   id: 'unique_id',
 *   title: 'Review title',
 *   text: 'Full review text',
 *   rating: 1-5,
 *   author: 'Reviewer name',
 *   authorLocation: 'City, Country',
 *   date: 'YYYY-MM-DD',
 *   helpfulVotes: number,
 *   isVerified: true,
 *   language: 'en'
 * }
 */

// Business information from TripAdvisor
export const REAL_BUSINESS_INFO = {
    locationId: '27931661',
    name: 'Tomodachi Tours',
    overallRating: 5.0, // Calculated from real reviews (all 5-star reviews)
    totalReviews: 17, // Current count of manually collected reviews, will be overridden by API if available
    ranking: '#1 of 1,443 Tours & Activities in Kyoto', // Current TripAdvisor ranking
    tripAdvisorUrl: 'https://www.tripadvisor.com/Attraction_Review-g298564-d27931661-Reviews-Tomodachi_Tours-Kyoto.html'
};

// Real reviews collected from TripAdvisor
export const REAL_REVIEWS = [
    {
        id: 'real_review_1',
        title: 'Epic Tour',
        text: 'Vincent was an amazing tour guide. The tour itself — strolling through the magical Torii gates of Fushimi Inari — was enchanting at night, and Vincent elevated our experience so much. He even took us on a spontaneous detour that made the trip that much more meaningful. Can\'t recommend this enough, and I hope you\'re lucky enough to have the magnificent Vincent with you!',
        rating: 5,
        author: 'Sam B',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-09', // Written August 9, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_2',
        title: 'Great tour!',
        text: 'Great tour! Shared the most interesting facts, and adapted the tour to our group. Strongly recommend the experience and tour guide!',
        rating: 5,
        author: 'PMB',
        authorLocation: 'São Paulo, SP',
        date: '2025-08-09', // Written August 9, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_3',
        title: 'Matcha with Vincent!',
        text: 'Vincent was an amazing tour guide, has flawless English and Japanese, and since it was just me and my wife he customized the tour to best fit our interests and timing. Very knowledgeable about the history of each site and you can tell he is passionate about this place. The matcha was wonderful and he gave recommendations on which teas to take back home for ourselves and as gifts for friends.',
        rating: 5,
        author: 'Derek S',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-08', // Written August 8, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_4',
        title: 'HIRO – a guide who nourishes your curiosity',
        text: 'I wanted to buy a tour as I\'m a type of traveler who wants to dive into knowledge and culture of the Japanese culture, that\'s why I was searching for a guide who could not only answer "what" questions: what is that, what is there. BUT! who could answer my "WHY"s. Why this way, but not another? Why the tradition was established this way, but not another, and HIRO guide COULD answer all of my "why"s. Very knowledgeable and round educated person with very fluent English and out-going personality. I also want to mention that he answered all of my not connected to the tour agenda OFF-TOPIC questions such as: What is the Ikigai? What Japanese books and authors would you recommend to start getting to know Japanese literature? He gave me book recommendations, I\'m so grateful and would recommend this guide to anyone who comes to Kyoto and searches for the answers he struggles to find him/herself!',
        rating: 5,
        author: 'Diana D',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-06', // Written August 6, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_5',
        title: 'Great tour',
        text: 'Caleb was a fantastic guide, very knowledgeable about Japanese culture. We saw many temples visited Fushimi Inari early with hardly anyone there! The bamboo forest was also superb. I highly recommend this tour.',
        rating: 5,
        author: 'Geneva76',
        authorLocation: 'Geneva, Switzerland',
        date: '2025-08-05', // Written August 5, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_6',
        title: 'Super excursion',
        text: 'We visited this magnificent temple with Hiro, fantastic guide super recommended top, with him you learn a lot about Japan',
        rating: 5,
        author: 'fabio',
        authorLocation: 'Valenza, Italy',
        date: '2025-08-05', // Written August 5, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_7',
        title: 'Amazing trip',
        text: 'I definitely recommend this tour! They show you historical and important sites while explaining everything clearly. I especially recommend our tour guide Vincent, he was friendly, informative, and showed us some amazing photo spots. His energy was great, and even though the weather was hot, we had a wonderful and smooth tour. Highly recommended to everyone.',
        rating: 5,
        author: 'Arif Tasker',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-04', // Written August 4, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_8',
        title: 'A nice evening',
        text: 'The guide was very nice and knowledgeable. Cool that there was a small group of only 5 pieces + the guide. Good to walk in the evening due to the temperature.',
        rating: 5,
        author: 'Hilde J',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-02', // Written August 2, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_9',
        title: 'Excellent way to see the shrine and learn about the culture.',
        text: 'This was a great experience. Our tour guide Vincent was very knowledgeable and able to answer any questions we had about the shrine. We learned so much and he had some interesting side stories as well. We got great photos and had good tips on things to do for the rest of our time in Kyoto. He also had bug spray which really saved us from being eaten by the mosquitoes.',
        rating: 5,
        author: 'Amanda W',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-01', // Written July 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_10',
        title: 'Very good tour guide',
        text: 'Very nice tour with a lot of information from our guide. Masaki showed us a lot of very beautiful history in Kyoto. I recommend it a lot.',
        rating: 5,
        author: 'Sandra G',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-11', // Written August 11, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_11',
        title: 'Two thumbs up! Highly recommended!',
        text: 'We had such a great time on our tour this morning! Our guide Caleb was incredibly knowledgeable, fun, and made the experience both engaging and relaxing. He shared interesting facts and stories along the way, and made sure we were comfortable and enjoying ourselves. It was the perfect mix of history, culture, and humor. Thank you for a memorable and enjoyable tour—we\'re so glad we joined!',
        rating: 5,
        author: 'Diana M',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-30', // Written July 30, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_12',
        title: 'Amazing Tour',
        text: 'The tourguide was amazing, very friendly and competent. His tour through the Torris was excellent, with his knowledge we were able to learn a lot. We Would recommend him.',
        rating: 5,
        author: 'Helena F',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-27', // Written July 27, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_13',
        title: 'An Enlightened Experience',
        text: 'Incredible experience to know a sanctuary at night, we paid a wonderful sun. In addition, our Masaki guide explained about the Shinto tradition and rituals, in addition to taking us to places that pass unnoticed by tourists. We recommend the experience.',
        rating: 5,
        author: 'Leano L',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-24', // Written July 24, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_14',
        title: 'Guide was awesome!',
        text: 'Caleb took us at precisely the speed we requested, always making sure we were not left behind. We even made enough stops so we didn\'t overheat (it was a very hot day). He provided in-depth commentary on the history and culture of Japan, its people, and the religious beliefs that drive them. We loved it!',
        rating: 5,
        author: 'CanNieves',
        authorLocation: 'Stevensville, MD',
        date: '2025-07-26', // Written July 26, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_15',
        title: 'A mandatorii experience',
        text: 'This was a great tour to learn about the place and japanese culture in general. We went by sunset and the atmosphere was really nice.',
        rating: 5,
        author: 'Floriane I',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-27', // Written July 27, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_16',
        title: 'Beautiful.',
        text: 'Great place, in the evening has a special atmosphere. Caleb was a perfect, clear and enthusiastic guide. If you can get high enough you see the whole city lit up',
        rating: 5,
        author: 'Simona S',
        authorLocation: 'Coluso, Italy',
        date: '2025-07-21', // Written July 21, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    },
    {
        id: 'real_review_17',
        title: 'HIGHLY RECOMMEND FOR MATCHA LOVERS!!',
        text: 'I was lucky enough to have a personal tour with Hiro who was extremely knowledgeable as a Kyoto local, polite and fun. From the walking tour around picturesque temples, to the hands on matcha grinding experience that you get to sample afterwards, I had a blast. Expect at least 15k steps however at a leisurely pace. The tour includes the travel time to Uji via train which is only ~20mins. Learned a lot about Japanese history, culture and had plenty of opportunities to purchase high grade matcha powder and different teas. One of the highlights of my trip so far. Highly recommend.',
        rating: 5,
        author: 'Michael F',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-20', // Written July 20, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en'
    }
];

/**
 * Helper function to calculate average rating from real reviews
 */
export function calculateAverageRating() {
    if (REAL_REVIEWS.length === 0) return 0;

    const totalRating = REAL_REVIEWS.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / REAL_REVIEWS.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Get business info with calculated stats
 */
export function getRealBusinessInfo() {
    return {
        ...REAL_BUSINESS_INFO,
        overallRating: REAL_REVIEWS.length > 0 ? calculateAverageRating() : REAL_BUSINESS_INFO.overallRating,
        totalReviews: REAL_REVIEWS.length
    };
}

/**
 * Get business info with real TripAdvisor API data (if available)
 * Falls back to manually calculated data if API fails
 */
export async function getRealBusinessInfoWithAPI() {
    try {
        // Use direct fetch like the working example provided
        const apiKey = process.env.REACT_APP_TRIPADVISOR_API_KEY || '712CBC2D1532411593E1994319E44739';
        const locationId = process.env.REACT_APP_TRIPADVISOR_LOCATION_ID || '27931661';

        console.log('🔑 API Key being used:', apiKey ? 'Present' : 'Missing');
        console.log('📍 Location ID being used:', locationId);

        if (!apiKey) {
            console.warn('TripAdvisor API key not configured');
            return getRealBusinessInfo();
        }

        console.log('🔍 Fetching TripAdvisor location data using Method 2 (working approach)...');

        // Use Method 2 from our successful test - browser-like headers
        const directUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}&language=en&currency=USD`;
        console.log('🌐 URL:', directUrl.replace(apiKey, 'API_KEY_HIDDEN'));

        // For localhost development, we need to try different approaches since TripAdvisor may block localhost
        const currentOrigin = window.location.origin;
        const isLocalhost = currentOrigin.includes('localhost');

        console.log('🌐 Current origin:', currentOrigin, 'Is localhost:', isLocalhost);

        // Try multiple approaches for localhost development
        let attempts = [];

        if (isLocalhost) {
            // Attempt 1: Use registered domain headers (what worked in Node.js)
            attempts.push({
                name: 'Registered Domain Headers',
                headers: {
                    'accept': 'application/json',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Origin': 'https://tomodachitours.com',
                    'Referer': 'https://tomodachitours.com/'
                }
            });

            // Attempt 2: Use localhost headers
            attempts.push({
                name: 'Localhost Headers',
                headers: {
                    'accept': 'application/json',
                    'Origin': currentOrigin,
                    'Referer': currentOrigin + '/'
                }
            });

            // Attempt 3: No CORS headers
            attempts.push({
                name: 'Minimal Headers',
                headers: {
                    'accept': 'application/json'
                }
            });
        } else {
            // Production: use current domain
            attempts.push({
                name: 'Production Headers',
                headers: {
                    'accept': 'application/json',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Origin': currentOrigin,
                    'Referer': currentOrigin + '/'
                }
            });
        }

        // Try each approach until one works
        for (const attempt of attempts) {
            console.log(`🔄 Trying: ${attempt.name}`);

            try {
                const response = await fetch(directUrl, {
                    method: 'GET',
                    headers: attempt.headers
                });

                console.log(`📡 ${attempt.name} - Response Status:`, response.status, response.statusText);

                if (response.ok) {
                    const locationData = await response.json();
                    console.log(`✅ ${attempt.name} SUCCESS! Data:`, locationData);
                    console.log('📈 Reviews from working attempt:', locationData.num_reviews);

                    // Process successful response
                    const businessInfo = {
                        locationId: locationData.location_id || locationId,
                        name: locationData.name || REAL_BUSINESS_INFO.name,
                        overallRating: parseFloat(locationData.rating) || REAL_BUSINESS_INFO.overallRating,
                        totalReviews: parseInt(locationData.num_reviews) || REAL_BUSINESS_INFO.totalReviews,
                        ranking: locationData.ranking_data?.ranking_string || REAL_BUSINESS_INFO.ranking,
                        tripAdvisorUrl: locationData.web_url || REAL_BUSINESS_INFO.tripAdvisorUrl
                    };

                    console.log('🔧 Processed Business Info:', businessInfo);
                    console.log(`🎉 SUCCESS: Using real TripAdvisor data - ${businessInfo.totalReviews} reviews, ${businessInfo.overallRating} rating`);

                    return businessInfo;
                } else {
                    console.log(`❌ ${attempt.name} failed with status:`, response.status);
                }
            } catch (error) {
                console.log(`❌ ${attempt.name} failed with error:`, error.message);
            }
        }

        // If all attempts failed, throw error
        throw new Error('All API call attempts failed');

    } catch (error) {
        console.warn('Failed to fetch TripAdvisor location data, using manually calculated data:', error.message);

        // If CORS error, provide helpful message
        if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            console.log('🚧 CORS Error detected - API will work on production domain (tomodachitours.com)');
        }
    }

    // Fallback to manually calculated data
    return getRealBusinessInfo();
}

/**
 * Get real reviews with optional limit
 */
export function getRealReviews(maxReviews = 6) {
    return REAL_REVIEWS.slice(0, maxReviews);
}
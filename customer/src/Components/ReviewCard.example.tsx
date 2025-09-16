import React from 'react';
import ReviewCard from './ReviewCard';

// Example usage of the ReviewCard component
const ReviewCardExample: React.FC = () => {
    const sampleReviews = [
        {
            id: 'review_1',
            title: 'Amazing Kyoto Experience!',
            text: 'Had a wonderful time exploring Kyoto with our knowledgeable guide. The temples were breathtaking and the local insights were invaluable. Would definitely recommend this tour to anyone visiting Kyoto. The guide was very friendly and spoke excellent English.',
            rating: 5,
            author: 'John Smith',
            authorLocation: 'New York, NY',
            date: '2024-01-15T10:00:00Z',
            helpfulVotes: 3
        },
        {
            id: 'review_2',
            title: 'Great tour, highly recommended',
            text: 'This was our first time in Kyoto and the tour exceeded our expectations. The bamboo forest was magical and the tea ceremony was a unique cultural experience.',
            rating: 4.5,
            author: 'Sarah Johnson',
            authorLocation: 'London, UK',
            date: '2024-01-20T14:30:00Z',
            helpfulVotes: 1
        },
        {
            id: 'review_3',
            title: 'Good value for money',
            text: 'Nice tour with good coverage of main attractions. Guide was informative.',
            rating: 4,
            author: 'Mike Chen',
            authorLocation: 'Toronto, Canada',
            date: '2024-01-25T09:15:00Z',
            helpfulVotes: 0
        }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                ReviewCard Component Examples
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sampleReviews.map((review) => (
                    <ReviewCard
                        key={review.id}
                        review={review}
                        truncateLength={100}
                        showDate={true}
                        showHelpfulVotes={true}
                    />
                ))}
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Component Variations
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Without helpful votes */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-700 mb-3">
                            Without Helpful Votes
                        </h3>
                        <ReviewCard
                            review={sampleReviews[0]}
                            showHelpfulVotes={false}
                        />
                    </div>

                    {/* Without date */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-700 mb-3">
                            Without Date
                        </h3>
                        <ReviewCard
                            review={sampleReviews[1]}
                            showDate={false}
                        />
                    </div>

                    {/* Custom truncate length */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-700 mb-3">
                            Short Truncate Length (50 chars)
                        </h3>
                        <ReviewCard
                            review={sampleReviews[0]}
                            truncateLength={50}
                        />
                    </div>

                    {/* Minimal review */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-700 mb-3">
                            Minimal Review Data
                        </h3>
                        <ReviewCard
                            review={{
                                id: 'minimal',
                                text: 'Great experience!',
                                rating: 5
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewCardExample;
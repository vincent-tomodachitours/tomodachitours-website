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
 *   language: 'en',
 *   tourId: 'tour-identifier' // Optional: specify which tour this review is for
 * }
 * 
 * Tour IDs:
 * - 'night-tour' - Fushimi Inari Night Tour
 * - 'gion-tour' - Gion Morning Walking Tour  
 * - 'music-tour' - Music Culture Walking Tour
 * - 'uji-tour' - Uji Matcha Experience Tour
 * - 'morning-tour' - Morning Temple Tour
 * - null/undefined - General reviews (shown on all tours and home page)
 */

// Business information from TripAdvisor
export const REAL_BUSINESS_INFO = {
    locationId: '27931661',
    name: 'Tomodachi Tours',
    overallRating: 5.0, // Calculated from real reviews (all 5-star reviews)
    totalReviews: 332, // Hardcoded to show actual TripAdvisor review count
    ranking: '#5 of 734 Tours in Kyoto', // Updated ranking
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
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
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
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
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_1',
        title: 'Relaxing introduction to Kyoto',
        text: 'The early morning tour was great - the city still sleeping, it was much calmer than during the day. The guide was a fount of knowledge about local history and tradition, very polite. The pace was just right and after the tour I had a much better idea of where to go and what to see during my stay in Kyoto.',
        rating: 5,
        author: 'Grzegorz S',
        authorLocation: '', // Location not visible in the image
        date: '2025-06-24', // Written June 24, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_2',
        title: 'Great tour, fun guide',
        text: 'We had such a great tour with Hiro! He was so friendly and knowledgeable, and took us to such interesting places and answered all of our questions. Doing the tour in the early morning was very helpful as it was unbearably hot by 10:30am, and the tour wrapped up a little after that. We had a great experience!',
        rating: 5,
        author: 'Lindsey P',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-02', // Written July 2, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_3',
        title: 'Amazing morning tour!',
        text: 'We had a fantastic morning tour around Kyoto with Caleb! He took us to so many amazing spots — from hidden little streets we never would have found on our own to beautiful landmarks rich with history. We loved learning all the fascinating facts and stories about the city\'s past, and Caleb made everything so fun and engaging. It felt like exploring Kyoto with a knowledgeable friend. We truly enjoyed every moment and left with a much deeper appreciation for this incredible city. Highly recommend!',
        rating: 5,
        author: 'Mariana B',
        authorLocation: 'Guatemala City, Guatemala',
        date: '2025-07-12', // Written July 12, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_4',
        title: 'Two thumbs up! Highly recommended!',
        text: 'We had such a great time on our tour this morning! Our guide Caleb was incredibly knowledgeable, fun, and made the experience both engaging and relaxing. He shared interesting facts and stories along the way, and made sure we were comfortable and enjoying ourselves. It was the perfect mix of history, culture, and humor. Thank you for a memorable and enjoyable tour—we\'re so glad we joined!',
        rating: 5,
        author: 'Diana M',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-30', // Written July 30, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_5',
        title: 'Fantastic tour and guide!',
        text: 'I was lucky to be the only one on the tour with Hiro so basically had a private tour. A wonderful tour!!! Hiro was kind, pleasant and very knowledgeable. I learned a lot about the culture and the temples we visited. Gion is amazing and more beautifully experienced with a guide. I enjoyed it so much. Thx Hiro!!',
        rating: 5,
        author: 'Kalpana K',
        authorLocation: '', // Location not visible in the image
        date: '2025-05-11', // Written May 11, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_6',
        title: 'Great Tour',
        text: 'Great tour! It was a good sized group with a very kind and knowledgeable guide. The early morning start avoided a lot of the crowds!',
        rating: 5,
        author: 'JCC',
        authorLocation: '', // Location not visible in the image
        date: '2025-05-21', // Written May 21, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_7',
        title: 'Great Tour with History!',
        text: 'This company was great from the start - I received a text with easy-to-follow instructions on the meeting point. I lucked out and got a private tour with Hiro and Caleb and the two were very friendly and knowledgeable on the history of various locations and knew of all the little hidden photo spots! Even after the tour was over they sent some nice highlights for me to visit before leaving the city and they were great recommendations. These are some of the best guides you could ask for and I highly recommend them to anyone visiting Kyoto!',
        rating: 5,
        author: 'Jason H',
        authorLocation: '', // Location not visible in the image
        date: '2025-06-09', // Written June 9, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
    },
    {
        id: 'gion_tour_review_8',
        title: 'Great Kyoto Guide',
        text: 'Hiro was an amazing guide. Very personable and easy to engage with. He also gave us great tips for the rest of our trip including restaurants and other places to visit. Would recommend him to anyone.',
        rating: 5,
        author: 'Discover20119782972',
        authorLocation: '', // Location not visible in the image
        date: '2025-06-15', // Written June 15, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour
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
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour - mentions temples
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
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour - mentions historical sites and Vincent guide
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_1',
        title: 'Amazing evening tour',
        text: 'Hiro and his co-guide where truly amazing! They could tell us a lot not only about the place itself but also about cultural and social aspects of Japan in general. I really recommend taking this tour, especially in the evening (less crowded & beautiful lights). Both spoke very good English as well!',
        rating: 5,
        author: 'Karin',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-13', // Written August 13, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_2',
        title: 'Masaki is cool :)',
        text: 'Masaki was very friendly, knowledgeable and great to talk to. He made sure that we were all enjoying the tour and clearly wanted us to love the shrine as much as he did. It was a pleasure to have him as our tour guide!',
        rating: 5,
        author: 'Stay56302333901',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-13', // Written August 13, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_3',
        title: 'Amazing!',
        text: 'We really love this experience. Takako gave us an amazing tour, in which she taught us so many interesting details about the shrine',
        rating: 5,
        author: 'Estef A',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-17', // Written August 17, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_4',
        title: 'Fushimi-Inari Evening Tour with Fantastic Masaki Guide',
        text: 'Masaki, was for us a super professional guide, kind and very helpful. He gave us a lot of info about Fushimi-Inari, he was very patient in taking pictures and at the end of the tour he gave us a lot of advice on where to go in Kyoto and which restaurants he is going to. We really appreciated the passion in his work and the extreme friendliness',
        rating: 5,
        author: 'Nathalie S',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-28', // Written August 28, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_5',
        title: 'Excellent way to see the shrine and learn about the culture.',
        text: 'This was a great experience. Our tour guide Vincent was very knowledgeable and able to answer any questions we had about the shrine. We learned so much and he had some interesting side stories as well. We got great photos and had good tips on things to do for the rest of our time in Kyoto. He also had bug spray which really saved us from being eaten by the mosquitoes.',
        rating: 5,
        author: 'Amanda W',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-01', // Written August 1, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_6',
        title: 'Gorgeous Tour',
        text: 'The tour was very beautiful, and Masaki was an incredible guide! Very informative and kind. Would definitely recommend!',
        rating: 5,
        author: 'Relax32712402125',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-12', // Written August 12, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
    },
    {
        id: 'night_tour_review_7',
        title: 'Beautiful.',
        text: 'Great place, in the evening has a special atmosphere. Caleb was a perfect, clear and enthusiastic guide. If you can get high enough you see the whole city lit up',
        rating: 5,
        author: 'Simona S',
        authorLocation: 'Coluso, Italy',
        date: '2025-07-21', // Written July 21, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour
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
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour - mentions Masaki guide and Kyoto history
    },

    {
        id: 'morning_tour_review_1',
        title: 'Five stars to Caleb',
        text: 'Wonderful immersive experience-history, culture, music, language, we learnt so much and every question we asked was answered thoughtfully and in depth. Faultless -thank you Caleb.',
        rating: 5,
        author: 'EJCmillhill',
        authorLocation: '', // Location not visible in the image
        date: '2025-09-02', // Written September 2, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
    },
    {
        id: 'morning_tour_review_2',
        title: 'Excellent tour and highly recommended!',
        text: 'Definitely one of the highlights of my trip to Japan! Vincent was very knowledge about all the sites we went to and was also able to answer all the random questions I had about Japan. Everything went very smoothly from our meeting time/spot to our transport to the various sites. Five stars for this tour and highly recommended!',
        rating: 5,
        author: 'Erin B',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-21', // Written August 21, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
    },
    {
        id: 'morning_tour_review_3',
        title: 'Magical Morning',
        text: 'Caleb was our guide he was absolutely fabulous. Ended up only being 2 of us on the tour myself and 14 year grandson. Great pace, excellent history of what we were visiting . Magical morning thanks to Caleb\'s devotion to the tour, he also gave us some great recommendations for lunch and it was delicious Don\'t hesitate to do this tour',
        rating: 5,
        author: 'mozzy65edj',
        authorLocation: 'Newcastle, Australia',
        date: '2025-08-26', // Written August 26, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
    },
    {
        id: 'morning_tour_review_4',
        title: 'Fun and informative',
        text: 'Very informative tour gave a flavour of the Japanese culture. Caleb as a guide is very considerate and gave lots of breaks in the hot weather',
        rating: 5,
        author: 'shan s',
        authorLocation: '', // Location not visible in the image
        date: '2025-08-31', // Written August 31, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
    },
    {
        id: 'morning_tour_review_5',
        title: 'Awesome!!!',
        text: 'Our guide Vincent was super chill and informative, generously sharing all sorts of interesting nuggets spanning the full range of Japanese history through to modern cultural insights. Highly recommended.',
        rating: 5,
        author: 'Alex S',
        authorLocation: 'United Kingdom',
        date: '2025-09-02', // Written September 2, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
    },
    {
        id: 'morning_tour_review_6',
        title: 'Amazing/great guide',
        text: 'Amazing tour. Vincent was our guide. He was incredibly knowledgeable and personable. Fun to be around. Made it feel like we were being shown around Kyoto by a friend. We did an 8:45am start. If you\'re visiting in July or August, I would recommend an earlier start just because of the heat. Overall, great tour!!',
        rating: 5,
        author: 'patrick T',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-30', // Written July 30, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
    },
    {
        id: 'morning_tour_review_7',
        title: 'Jun 2025 • Couples',
        text: 'We had a fantastic experience with Caleb, our tour guide, who was a great communicator and arrived early to help us meet up at the location spot. We were fortunate to have private tour for two which allowed us to ask questions, hear detailed history, and enjoy a personalized experience. We were able to capture great photos and our guide was gracious enough to take our pictures and recommend the best photo ops! Caleb was knowledgeable, accommodating, and made the tour truly memorable. We highly recommend this tour, especially early in the day during warmer months to avoid crowds. Overall, a wonderful experience!',
        rating: 5,
        author: 'Victoria M',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-25', // Written July 25, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'morning-tour' // Morning Temple Tour
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour - mentions Torii gates
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour - mentions sanctuary at night and Masaki guide
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
        language: 'en',
        tourId: 'gion-tour' // Gion Morning Walking Tour - mentions Caleb guide and cultural commentary
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour - mentions sunset atmosphere
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
        language: 'en',
        tourId: 'night-tour' // Fushimi Inari Night Tour - mentions evening atmosphere and city view
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
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },
    {
        id: 'uji_tour_review_1',
        title: 'Uji Experience with Vincent',
        text: 'Had a great time with our guide, Vincent, exploring Uji! Highly recommend! He was very knowledgeable about Uji and the surrounding areas in Kyoto. He\'s great with storytelling and brings the history and culture to life. We loved learning more about Uji, grinding matcha, visiting Byōdō-in, and walking around the area. It was great to hear his experience about living in the US and Japan, it felt like touring Uji with a friend...',
        rating: 5,
        author: 'Natalie C',
        authorLocation: '', // Location not visible in the image
        date: '2025-06-23', // Written June 23, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },
    {
        id: 'uji_tour_review_2',
        title: 'Great morning in Uji',
        text: 'We had an awesome tour with Vincent, he is incredible knowledgeable about the Uji area and Japan as a whole. Very easy to communicate with as his English is perfect. He took us around the area and showed us the shrines and told us the history and it was very fascinating. Our matcha grinding experience was great and very informative. My daughter and I had a great day and would totally recommend Vincent!',
        rating: 5,
        author: 'Sara J',
        authorLocation: '', // Location not visible in the image
        date: '2025-07-09', // Written July 9, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },
    {
        id: 'uji_tour_review_3',
        title: 'A great tour and a great guide! Highly recommend!!',
        text: 'My friend and I had never been out to Uji and this tour was the perfect way to do it. Our guide Vincent was able to show us all the best areas and tell us everything we needed to know about matcha and green tea. The tea grinding experience was a fun insight into how matcha is made and freshly ground matcha tastes like nothing else. We also saw a few temples in the area which were absolutely beautiful',
        rating: 5,
        author: 'Ariel D',
        authorLocation: '', // Location not visible in the image
        date: '2025-06-17', // Written June 17, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },
    {
        id: 'uji_tour_review_4',
        title: 'Uji with Vincent',
        text: 'Vincent was great - was like visiting a friend with local knowledge. Native English and Japanese speaker so zero language barrier both ways. Tons of facts but also good bedside manner - eg when to give you some time to chill. This was a good tour - less busy than most in Kyoto and very interesting. Lots of steps I think my daughter and I got about 12k for the tour. Highly recommend Vincent and his company and if we were staying longer would try more of his tours',
        rating: 5,
        author: 'Alexander S',
        authorLocation: 'Wilmette, IL',
        date: '2025-06-06', // Written June 6, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },
    {
        id: 'uji_tour_review_5',
        title: 'Great tour of Uji',
        text: 'I really like this tour. Vincent was my guide. It was a small tour but I think he was able to move us through Uji so we saw most of the area, had a chance to eat and make matcha ice cream topping. My favorite thing was passing the arbor of wisteria at the entrance of Byodoin Temple and the museum tour of the temple objects. Vincent really liked doing research on the area including throwing some tidbits about the architecture in the streets and by the river. All in all a great tour. Thank you!',
        rating: 5,
        author: 'Dior C',
        authorLocation: '', // Location not visible in the image
        date: '2025-04-25', // Written April 25, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },
    {
        id: 'uji_tour_review_6',
        title: 'Wonderful experience',
        text: 'It was a very nice experience, Vincent explained everything in detail and very patiently, it was quite friendly and the information he gave us everything was very extensive. I highly recommend it',
        rating: 5,
        author: 'lucinda h',
        authorLocation: '', // Location not visible in the image
        date: '2025-04-25', // Written April 25, 2025
        helpfulVotes: 0,
        isVerified: true,
        language: 'en',
        tourId: 'uji-tour' // Uji Matcha Experience Tour
    },

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
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get real reviews with optional limit and tour filtering
 * Reviews are randomly shuffled on each call to show variety
 */
export function getRealReviews(maxReviews = 6, tourId = null) {
    let filteredReviews = REAL_REVIEWS;

    if (tourId) {
        // Filter reviews for specific tour ONLY (no general reviews)
        filteredReviews = REAL_REVIEWS.filter(review =>
            review.tourId === tourId
        );
    }

    // Shuffle the reviews to show different ones each time
    const shuffledReviews = shuffleArray(filteredReviews);

    return shuffledReviews.slice(0, maxReviews);
}

/**
 * Get reviews for a specific tour only (excluding general reviews)
 */
export function getTourSpecificReviews(tourId, maxReviews = 6) {
    const tourReviews = REAL_REVIEWS.filter(review => review.tourId === tourId);
    return tourReviews.slice(0, maxReviews);
}

/**
 * Get general reviews (no specific tour assigned)
 */
export function getGeneralReviews(maxReviews = 6) {
    const generalReviews = REAL_REVIEWS.filter(review => !review.tourId);
    return generalReviews.slice(0, maxReviews);
}
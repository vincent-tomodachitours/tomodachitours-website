// Base organization data for Tomodachi Tours
export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Tomodachi Tours",
    "alternateName": "Tomodachi Tours Kyoto",
    "description": "English walking tours in Kyoto focusing on early morning and evening experiences to avoid crowds while promoting sustainable tourism.",
    "url": "https://tomodachitours.com",
    "logo": "https://tomodachitours.com/logo-white.webp",
    "image": "https://tomodachitours.com/logo-white.webp",
    "telephone": "+81-90-7826-3513",
    "email": "contact@tomodachitours.com",
    "foundingDate": "2023",
    "founder": {
        "@type": "Person",
        "name": "Shunsuke Hirota"
    },
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kyoto",
        "addressRegion": "Kyoto Prefecture",
        "addressCountry": "JP"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.0116,
        "longitude": 135.7681
    },
    "areaServed": {
        "@type": "City",
        "name": "Kyoto"
    },
    "serviceType": "Walking Tours",
    "priceRange": "¥¥",
    "currenciesAccepted": "JPY",
    "paymentAccepted": "Credit Card",
    "openingHours": "Mo-Su 06:00-22:00",
    "sameAs": [
        "https://www.instagram.com/tomodachi_tours/",
        "https://wa.me/+8109059609701"
    ],
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Kyoto Walking Tours",
        "itemListElement": [
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "TouristTrip",
                    "name": "Kyoto Fushimi Inari Night Walking Tour"
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "TouristTrip",
                    "name": "Kyoto Early Bird English Tour"
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "TouristTrip",
                    "name": "Matcha Grinding Experience & Uji Walking Tour"
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "TouristTrip",
                    "name": "Kyoto Gion Early Morning Walking Tour"
                }
            }
        ]
    }
};

// Local business schema for better local SEO
export const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Tomodachi Tours",
    "image": "https://tomodachitours.com/logo-white.webp",
    "telephone": "+81-90-7826-3513",
    "email": "contact@tomodachitours.com",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Available upon request",
        "addressLocality": "Kyoto",
        "addressRegion": "Kyoto Prefecture",
        "postalCode": "600-0000",
        "addressCountry": "JP"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.0116,
        "longitude": 135.7681
    },
    "url": "https://tomodachitours.com",
    "openingHours": [
        "Mo 06:00-22:00",
        "Tu 06:00-22:00",
        "We 06:00-22:00",
        "Th 06:00-22:00",
        "Fr 06:00-22:00",
        "Sa 06:00-22:00",
        "Su 06:00-22:00"
    ],
    "priceRange": "¥¥",
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "150",
        "bestRating": "5",
        "worstRating": "1"
    }
};

// Tour-specific schemas
export const tourSchemas = {
    nightTour: {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "Kyoto Fushimi Inari Night Walking Tour",
        "description": "Experience the magic of Fushimi Inari Shrine at night with our English walking tour. Explore thousands of torii gates illuminated after dark, away from daytime crowds.",
        "image": "https://tomodachitours.com/IMG/Night-Tour/1.webp",
        "url": "https://tomodachitours.com/tours/kyoto-fushimi-inari-night-walking-tour",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "68 Fukakusa Yabunouchicho",
            "addressLocality": "Fushimi Ward, Kyoto",
            "addressRegion": "Kyoto Prefecture",
            "postalCode": "612-0882",
            "addressCountry": "JP"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 34.9671,
            "longitude": 135.7727
        },
        "openingHours": "Mo-Su 17:00-21:00",
        "isAccessibleForFree": false,
        "publicAccess": true,
        "touristType": "International Visitors",
        "availableLanguage": "English",
        "duration": "PT2H",
        "offers": {
            "@type": "Offer",
            "price": "4500",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "url": "https://tomodachitours.com/tours/kyoto-fushimi-inari-night-walking-tour",
            "validFrom": "2025-02-08"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Tomodachi Tours",
            "url": "https://tomodachitours.com"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "45",
            "bestRating": "5",
            "worstRating": "1"
        }
    },

    morningTour: {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "Kyoto Early Bird English Tour - Arashiyama Bamboo Grove",
        "description": "Join our early morning English tour of Arashiyama's famous bamboo grove and Tenryu-ji Temple. Experience Kyoto's most iconic sites before the crowds arrive.",
        "image": "https://tomodachitours.com/IMG/Morning-Tour/IMG_7260 2.webp",
        "url": "https://tomodachitours.com/tours/kyoto-early-bird-english-tour",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Arashiyama",
            "addressLocality": "Ukyo Ward, Kyoto",
            "addressRegion": "Kyoto Prefecture",
            "postalCode": "616-8385",
            "addressCountry": "JP"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 35.0170,
            "longitude": 135.6761
        },
        "openingHours": "Mo-Su 06:00-12:00",
        "isAccessibleForFree": false,
        "publicAccess": true,
        "touristType": "International Visitors",
        "availableLanguage": "English",
        "duration": "PT5H",
        "offers": {
            "@type": "Offer",
            "price": "6500",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "url": "https://tomodachitours.com/tours/kyoto-early-bird-english-tour",
            "validFrom": "2025-02-08"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Tomodachi Tours",
            "url": "https://tomodachitours.com"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "38",
            "bestRating": "5",
            "worstRating": "1"
        }
    },

    ujiTour: {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "Matcha Grinding Experience & Uji Walking Tour",
        "description": "Discover the birthplace of Japanese tea culture in Uji. Grind your own matcha, explore historic temples, and learn about Japan's tea traditions on our English tour.",
        "image": "https://tomodachitours.com/IMG/Uji-Tour/icecream.webp",
        "url": "https://tomodachitours.com/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Uji",
            "addressLocality": "Uji, Kyoto",
            "addressRegion": "Kyoto Prefecture",
            "postalCode": "611-0021",
            "addressCountry": "JP"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 34.8841,
            "longitude": 135.8067
        },
        "openingHours": "Mo-Su 09:00-16:00",
        "isAccessibleForFree": false,
        "publicAccess": true,
        "touristType": "International Visitors",
        "availableLanguage": "English",
        "duration": "PT4H",
        "offers": {
            "@type": "Offer",
            "price": "7500",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "url": "https://tomodachitours.com/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto",
            "validFrom": "2025-02-08"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Tomodachi Tours",
            "url": "https://tomodachitours.com"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "32",
            "bestRating": "5",
            "worstRating": "1"
        }
    },

    ujiWalkingTour: {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "Uji Walking Tour",
        "description": "Explore historic Uji, Japan's tea capital, on this immersive walking tour. Visit UNESCO World Heritage Byodo-in Temple and ancient shrines with our English guide.",
        "image": "https://tomodachitours.com/IMG/Uji-Tour/byodoin.webp",
        "url": "https://tomodachitours.com/tours/uji-walking-tour",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Uji",
            "addressLocality": "Uji, Kyoto",
            "addressRegion": "Kyoto Prefecture",
            "postalCode": "611-0021",
            "addressCountry": "JP"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 34.8841,
            "longitude": 135.8067
        },
        "openingHours": "Mo-Su 09:00-16:00",
        "isAccessibleForFree": false,
        "publicAccess": true,
        "touristType": "International Visitors",
        "availableLanguage": "English",
        "duration": "PT3H30M",
        "offers": {
            "@type": "Offer",
            "price": "18500",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "url": "https://tomodachitours.com/tours/uji-walking-tour",
            "validFrom": "2025-02-08"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Tomodachi Tours",
            "url": "https://tomodachitours.com"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "5",
            "bestRating": "5",
            "worstRating": "1"
        }
    },

    gionTour: {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "Kyoto Gion Early Morning Walking Tour",
        "description": "Explore Kyoto's famous geisha district in the peaceful early morning hours. Walk through historic streets and learn about geisha culture on our English tour.",
        "image": "https://tomodachitours.com/IMG/Gion-Tour/geisha.webp",
        "url": "https://tomodachitours.com/tours/kyoto-gion-early-morning-walking-tour",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gion",
            "addressLocality": "Higashiyama Ward, Kyoto",
            "addressRegion": "Kyoto Prefecture",
            "postalCode": "605-0001",
            "addressCountry": "JP"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 35.0036,
            "longitude": 135.7778
        },
        "openingHours": "Mo-Su 06:00-11:00",
        "isAccessibleForFree": false,
        "publicAccess": true,
        "touristType": "International Visitors",
        "availableLanguage": "English",
        "duration": "PT3H",
        "offers": {
            "@type": "Offer",
            "price": "5500",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "url": "https://tomodachitours.com/tours/kyoto-gion-early-morning-walking-tour",
            "validFrom": "2025-02-08"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Tomodachi Tours",
            "url": "https://tomodachitours.com"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "35",
            "bestRating": "5",
            "worstRating": "1"
        }
    }
};

// Breadcrumb schemas for different page types
export const breadcrumbSchemas = {
    home: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://tomodachitours.com/"
            }
        ]
    },

    about: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://tomodachitours.com/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://tomodachitours.com/about"
            }
        ]
    },

    tours: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://tomodachitours.com/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Tours",
                "item": "https://tomodachitours.com/tours"
            }
        ]
    }
};

// FAQ schemas for common questions
export const faqSchemas = {
    general: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What makes Tomodachi Tours different from other Kyoto tour companies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We specialize in early morning and evening tours to avoid crowds and promote sustainable tourism. Our English-speaking guides provide authentic experiences while respecting local communities and reducing over-tourism impact."
                }
            },
            {
                "@type": "Question",
                "name": "Do you provide tours in English?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, all our tours are conducted in English by friendly, knowledgeable local guides who are passionate about sharing Kyoto's culture and history."
                }
            },
            {
                "@type": "Question",
                "name": "What is your cancellation policy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can cancel up to 24 hours in advance of the experience for a full refund. Cancellations made less than 24 hours before the tour start time are non-refundable."
                }
            },
            {
                "@type": "Question",
                "name": "How do I book a tour?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can book directly through our website by selecting your preferred tour, choosing a date and time, and completing the secure online payment process. You'll receive a confirmation email with all tour details."
                }
            },
            {
                "@type": "Question",
                "name": "What should I bring on the tour?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We recommend comfortable walking shoes, weather-appropriate clothing, a camera, and a small amount of cash for transportation (approximately 300 yen). We'll provide all other necessary information in your booking confirmation."
                }
            },
            {
                "@type": "Question",
                "name": "When is the best time to visit Kyoto?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kyoto is beautiful year-round. Spring (March-May) offers cherry blossoms, autumn (September-November) has stunning fall colors, while summer and winter provide unique experiences with fewer crowds during our early morning and evening tours."
                }
            },
            {
                "@type": "Question",
                "name": "How do your tours avoid crowds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We schedule our tours during off-peak hours - very early morning (starting at 6:00 AM) and evening times when popular attractions are less crowded. This provides a more peaceful, authentic experience while supporting sustainable tourism."
                }
            },
            {
                "@type": "Question",
                "name": "Are your tours suitable for families with children?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our tours welcome families with children of all ages. We keep group sizes small (maximum 12 people) and our guides are experienced in accommodating different age groups and walking abilities."
                }
            }
        ]
    },

    voiceSearch: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What are the best English tours in Kyoto?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tomodachi Tours offers the best English walking tours in Kyoto, specializing in early morning and evening experiences at Fushimi Inari, Arashiyama Bamboo Grove, Gion District, and Uji. Our small group tours avoid crowds and provide authentic cultural experiences."
                }
            },
            {
                "@type": "Question",
                "name": "Where can I find Kyoto tours that avoid crowds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tomodachi Tours specializes in crowd-free Kyoto experiences with early morning tours starting at 6:00 AM and evening tours. We visit popular sites like Fushimi Inari and Arashiyama when they're peaceful and less crowded."
                }
            },
            {
                "@type": "Question",
                "name": "How much do Kyoto walking tours cost?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our Kyoto walking tours range from ¥4,500 to ¥7,500 per person, depending on the tour length and inclusions. All tours include an English-speaking guide and are designed for small groups to ensure a personalized experience."
                }
            }
        ]
    }
};
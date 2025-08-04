// Location-based content for Kyoto districts and attractions
export const kyotoDistricts = {
    gion: {
        name: "Gion District",
        description: "Kyoto's most famous geisha district, known for traditional architecture and cultural experiences",
        keywords: ["Gion district", "Kyoto geisha", "traditional Kyoto", "Hanami-koji", "geisha spotting"],
        attractions: [
            "Yasaka Shrine",
            "Hanami-koji Street",
            "Shirakawa Area",
            "Kennin-ji Temple",
            "Maruyama Park"
        ],
        bestTimeToVisit: "Early morning (6:00-8:00 AM) to avoid crowds and see geisha heading to appointments",
        transportation: "Keihan Main Line to Gion-Shijo Station or Kyoto City Bus to Gion bus stop",
        culturalTips: [
            "Photography of geisha requires permission and respect",
            "Walk quietly in the historic preservation district",
            "Many tea houses are private and require introductions"
        ]
    },

    arashiyama: {
        name: "Arashiyama",
        description: "Western Kyoto district famous for bamboo groves and mountain scenery",
        keywords: ["Arashiyama bamboo", "bamboo grove Kyoto", "Tenryu-ji temple", "Togetsukyo bridge"],
        attractions: [
            "Bamboo Grove",
            "Tenryu-ji Temple",
            "Togetsukyo Bridge",
            "Monkey Park Iwatayama",
            "Adashino Nenbutsu-ji Temple"
        ],
        bestTimeToVisit: "Early morning (7:00-9:00 AM) for peaceful bamboo grove experience",
        transportation: "JR Sagano Line to Saga-Arashiyama Station or Keifuku Electric Railroad",
        culturalTips: [
            "Bamboo grove is most beautiful with morning light filtering through",
            "Tenryu-ji has beautiful gardens worth the entrance fee",
            "Avoid weekends and holidays for better experience"
        ]
    },

    fushimi: {
        name: "Fushimi",
        description: "Southern Kyoto district known for Fushimi Inari Shrine and sake brewing",
        keywords: ["Fushimi Inari", "thousand torii gates", "Inari shrine", "sake district Kyoto"],
        attractions: [
            "Fushimi Inari Taisha",
            "Fushimi Sake District",
            "Teradaya Inn",
            "Kizakura Kappa Country",
            "Fushimi Momoyama Castle"
        ],
        bestTimeToVisit: "Very early morning (5:30-7:00 AM) or evening (after 6:00 PM) to avoid crowds",
        transportation: "JR Nara Line to Inari Station or Keihan Main Line to Fushimi-Inari Station",
        culturalTips: [
            "The full hike to the summit takes 2-3 hours",
            "Torii gates are donated by individuals and businesses",
            "Evening illumination creates magical atmosphere"
        ]
    },

    uji: {
        name: "Uji",
        description: "Historic city south of Kyoto, birthplace of Japanese tea culture",
        keywords: ["Uji matcha", "Japanese tea culture", "Byodo-in temple", "matcha experience"],
        attractions: [
            "Byodo-in Temple (Phoenix Hall)",
            "Ujigami Shrine",
            "Uji River",
            "Tea shops and museums",
            "Tale of Genji Museum"
        ],
        bestTimeToVisit: "Morning (9:00-11:00 AM) for fresh matcha experiences",
        transportation: "JR Nara Line to Uji Station or Keihan Uji Line to Keihan Uji Station",
        culturalTips: [
            "Uji is the setting for the final chapters of Tale of Genji",
            "Try authentic matcha at traditional tea houses",
            "Byodo-in appears on the 10-yen coin"
        ]
    }
};

// Tourism-specific keywords and content
export const tourismKeywords = {
    primary: [
        "Kyoto tours",
        "English tours Kyoto",
        "Kyoto walking tours",
        "Kyoto tour guide",
        "Japan tours English"
    ],

    longTail: [
        "early morning Kyoto tours",
        "avoid crowds Kyoto",
        "small group Kyoto tours",
        "authentic Kyoto experience",
        "sustainable tourism Kyoto",
        "English speaking guide Kyoto",
        "private Kyoto tours",
        "cultural tours Kyoto"
    ],

    seasonal: {
        spring: [
            "Kyoto cherry blossom tours",
            "sakura season Kyoto",
            "spring tours Kyoto",
            "hanami tours"
        ],
        summer: [
            "early morning Kyoto summer",
            "beat the heat Kyoto tours",
            "summer festival tours Kyoto"
        ],
        autumn: [
            "Kyoto autumn colors",
            "fall foliage tours Kyoto",
            "momiji season Kyoto",
            "autumn temple tours"
        ],
        winter: [
            "winter Kyoto tours",
            "snow temple tours",
            "quiet season Kyoto",
            "winter illumination tours"
        ]
    },

    activityBased: [
        "temple tours Kyoto",
        "shrine tours Kyoto",
        "bamboo forest tours",
        "geisha district tours",
        "matcha experience tours",
        "cultural immersion Kyoto",
        "photography tours Kyoto",
        "food tours Kyoto"
    ]
};

// Local business information for consistency
export const businessInfo = {
    name: "Tomodachi Tours",
    address: {
        street: "Available upon request",
        city: "Kyoto",
        prefecture: "Kyoto Prefecture",
        postalCode: "600-0000",
        country: "Japan"
    },
    contact: {
        phone: "+81-90-7826-3513",
        email: "contact@tomodachitours.com",
        whatsapp: "+81-90-5960-9701"
    },
    coordinates: {
        latitude: 35.0116,
        longitude: 135.7681
    },
    serviceArea: [
        "Kyoto City",
        "Gion District",
        "Arashiyama",
        "Fushimi",
        "Uji",
        "Higashiyama",
        "Central Kyoto"
    ],
    languages: ["English", "Japanese"],
    operatingHours: {
        monday: "06:00-22:00",
        tuesday: "06:00-22:00",
        wednesday: "06:00-22:00",
        thursday: "06:00-22:00",
        friday: "06:00-22:00",
        saturday: "06:00-22:00",
        sunday: "06:00-22:00"
    }
};
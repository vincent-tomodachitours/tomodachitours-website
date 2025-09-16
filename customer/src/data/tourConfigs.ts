import type { TourConfigs, TourDetails } from '../types/data';

// Tour configuration data for reusable components
export const tourConfigs: TourConfigs = {
    'gion-tour': {
        overviewContent: [
            "Experience Kyoto's most iconic sights before the crowds arrive! Our early morning walking tour takes you through the historic streets of Gion, visiting Kiyomizu-dera Temple, Yasaka Shrine, Hanamikoji Street, and Sannenzaka & Ninenzaka with a knowledgeable and friendly English-speaking guide.",
            "⚠️ Prior to the tour, please ensure that WhatsApp is available for easy communication. Our guide will contact you through these platforms.",
            "✅ English Guided Walking Tour – Walking through Kyoto's most scenic streets.",
            "✅ Visit Five Must-See Locations – Explore Kiyomizu Temple, Yasaka Shrine, Gion's historic streets, and Sannenzaka & Ninenzaka.",
            "✅ Learn Kyoto's History & Culture – Discover the stories behind Kyoto's geisha district, samurai history, and old temples with our expert guide.",
            "✅ Capture Stunning Photos – Enjoy a crowd-free Kyoto and take beautiful photos in its most picturesque locations.",
            "✅ Get Local Tips & Recommendations – Our guide will share insider tips to explore after the tour."
        ],
        tourDetails: {
            included: ["English Speaking Guide", "Approximately 180 Minutes"],
            notIncluded: ["Public Transportation Fare (300 yen)"],
            accessibility: ["Not wheelchair accessible", "Service animals allowed", "Near public transportation"]
        },
        itineraryStops: [
            { name: "Gion Shirakawa", duration: "15 minutes" },
            { name: "Hanamikoji Street", duration: "20 minutes" },
            { name: "Yasaka Shrine", duration: "20 minutes" },
            { name: "Sannenzaka & Ninenzaka", duration: "30 minutes" },
            { name: "Kiyomizu-dera Temple", duration: "60 minutes" }
        ],
        meetingPointData: {
            location: "Statue of Izumo-no-Okuni",
            googleMapsUrl: "https://maps.app.goo.gl/NzbvEwt3GUjKoXFz9",
            instructions: "Look for your guide near the statue holding a sign with the tour company logo."
        }
    },

    'music-tour': {
        overviewContent: [
            "Join us for an enchanting musical journey through Kyoto's rich cultural heritage. Discover the sounds that have shaped this ancient city for over a thousand years.",
            "⚠️ This tour includes visits to traditional music venues and may include live performances depending on availability.",
            "⚠️ Prior to the tour, please ensure WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.",
            "✅ This is an English Guided Walking Tour. Explore the musical traditions and cultural significance of Kyoto's soundscape with a knowledgeable and passionate guide.",
            "✅ A Unique Cultural Experience: Immerse yourself in traditional Japanese music, from ancient court music to folk songs and modern interpretations.",
            "✅ Historic Music Venues: Visit traditional tea houses, temples, and cultural centers where music has been performed for centuries.",
            "*This tour focuses on cultural appreciation and may include opportunities to try traditional instruments."
        ],
        tourDetails: {
            included: ["English Speaking Guide", "Cultural Music Experience", "Traditional Instrument Demonstration"],
            notIncluded: ["Public Transportation Fare (300 yen)", "Food and Beverages"],
            accessibility: ["Not wheelchair accessible", "Service animals allowed", "Near public transportation"]
        },
        itineraryStops: [
            { name: "Traditional Music Hall", duration: "30 minutes", description: "Experience traditional Japanese court music" },
            { name: "Historic Tea House", duration: "25 minutes", description: "Listen to shamisen and koto performances" },
            { name: "Temple Music Experience", duration: "20 minutes", description: "Buddhist chanting and temple bells" },
            { name: "Folk Music Venue", duration: "25 minutes", description: "Traditional folk songs and storytelling" }
        ],
        meetingPointData: {
            location: "Kyoto Station Central Exit",
            googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
            instructions: "Meet near the central information desk inside Kyoto Station."
        }
    }
};

export const getCommonTourDetails = (): Partial<TourDetails> => ({
    accessibility: [
        "Not wheelchair accessible",
        "Service animals allowed",
        "Near public transportation"
    ],
    commonIncluded: ["English Speaking Guide"],
    commonNotIncluded: ["Public Transportation Fare (300 yen)"]
});
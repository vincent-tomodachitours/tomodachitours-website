import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import { seoData } from '../data/seoData';

//Images
import photo1 from '../IMG/Gion-Tour/kiyomizu.webp'
import photo2 from '../IMG/Gion-Tour/geisha.webp'
import photo3 from '../IMG/Gion-Tour/yasaka4.webp'
import photo4 from '../IMG/Gion-Tour/kiyomizu-fall.webp'
import photo5 from '../IMG/Gion-Tour/yasaka-lanterns.webp'

const GionTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

    const overviewContent = [
        "Experience Kyoto's most iconic sights before the crowds arrive! Our early morning walking tour takes you through the historic streets of Gion, visiting Kiyomizu-dera Temple, Yasaka Shrine, Hanamikoji Street, and Sannenzaka & Ninenzaka with a knowledgeable and friendly English-speaking guide.",
        "⚠️ Prior to the tour, please ensure that WhatsApp is available for easy communication. Our guide will contact you through these platforms.",
        "✅ English Guided Walking Tour – Walking through Kyoto's most scenic streets.",
        "✅ Visit Five Must-See Locations – Explore Kiyomizu Temple, Yasaka Shrine, Gion's historic streets, and Sannenzaka & Ninenzaka.",
        "✅ Learn Kyoto's History & Culture – Discover the stories behind Kyoto's geisha district, samurai history, and old temples with our expert guide.",
        "✅ Capture Stunning Photos – Enjoy a crowd-free Kyoto and take beautiful photos in its most picturesque locations.",
        "✅ Get Local Tips & Recommendations – Our guide will share insider tips to explore after the tour."
    ];

    const tourDetails = {
        included: [
            "English Speaking Guide",
            "Approximately 180 Minutes"
        ],
        notIncluded: [
            "Public Transportation Fare (300 yen)"
        ],
        accessibility: [
            "Not wheelchair accessible",
            "Service animals allowed",
            "Near public transportation"
        ]
    };

    const itineraryStops = [
        { name: "Gion Shirakawa", duration: "15 minutes" },
        { name: "Hanamikoji Street", duration: "20 minutes" },
        { name: "Yasaka Shrine", duration: "20 minutes" },
        { name: "Sannenzaka & Ninenzaka", duration: "30 minutes" },
        { name: "Kiyomizu-dera Temple", duration: "60 minutes" }
    ];

    const meetingPointData = {
        location: "Statue of Izumo-no-Okuni",
        googleMapsUrl: "https://maps.app.goo.gl/NzbvEwt3GUjKoXFz9",
        instructions: "Look for your guide near the statue holding a sign with the tour company logo."
    };

    const SEOComponent = (
        <SEO
            title={seoData.gionTour.title}
            description={seoData.gionTour.description}
            keywords={seoData.gionTour.keywords}
        />
    );

    return (
        <BaseTourPage
            tourId="gion-tour"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
        />
    );
};

export default GionTour;
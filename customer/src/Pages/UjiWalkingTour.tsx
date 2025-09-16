import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import { seoData } from '../data/seoData';

//Images - reusing the same images from UjiTour but excluding matcha grinding specific ones
import photo1 from '../IMG/Uji-Tour/byodoin.webp'
import photo2 from '../IMG/Uji-Tour/museum-angels.webp'
import photo3 from '../IMG/Uji-Tour/usucha.webp'

const UjiWalkingTour: React.FC = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
    ];

    const overviewContent = [
        "Explore the historic town of Uji, the birthplace of Japanese tea culture, on this immersive walking tour. Visit the famous Byodo-in temple, known for its appearance on the 10-yen coin, and discover the rich history and traditions of Japan's tea capital.",
        "⚠️ Prior to the tour, please ensure that WhatsApp is available for easy communication. Our tour guide will use these platforms to contact you.",
        "✅ English Guided Tour – Explore Uji City with our friendly and knowledgeable guide.",
        "✅ Visit Byodo-in Temple – A UNESCO World Heritage Site, famous for its stunning architecture featured on the 10-yen coin.",
        "✅ Learn the History of Uji Tea – Discover why Uji is known as Japan's top region for high-quality green tea.",
        "✅ Explore Historic Shrines – Visit Uji Shrine and Ujigami Shrine, both steeped in centuries of history.",
        "✅ Scenic Walking Routes – Enjoy beautiful views along the Uji River and historic bridges."
    ];

    const tourDetails = {
        included: [
            "English Speaking Guide",
            "Approximately 150 Minutes"
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
        { title: "Statue of Murasaki Shikibu", duration: "15 minutes", description: "Monument to the famous author of The Tale of Genji" },
        { title: "Byodo-in Temple", duration: "60 minutes", description: "UNESCO World Heritage Site with beautiful architecture" },
        { title: "Uji River & Historic Bridges", duration: "20 minutes", description: "Scenic river views and traditional bridges" },
        { title: "Uji Shrine", duration: "25 minutes", description: "Historic Shinto shrine" },
        { title: "Tea Street Walking", duration: "30 minutes", description: "Explore traditional tea shops and local culture" }
    ];

    const meetingPointData = {
        location: "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
        googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
        instructions: "Meet at the 7-Eleven inside Kyoto Station central entrance."
    };

    const SEOComponent = (
        <SEO
            title={seoData.ujiWalkingTour.title}
            description={seoData.ujiWalkingTour.description}
            keywords={seoData.ujiWalkingTour.keywords}
        />
    );

    return (
        <BaseTourPage
            tourId="uji-walking-tour"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
        />
    );
};

export default UjiWalkingTour;
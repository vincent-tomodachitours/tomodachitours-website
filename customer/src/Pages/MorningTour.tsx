import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import { seoData } from '../data/seoData';

//Images
import photo1 from '../IMG/Morning-Tour/IMG_7260 2.webp'
import photo2 from '../IMG/Morning-Tour/arashiyama1.webp'
import photo3 from '../IMG/Morning-Tour/tenryuji.webp'
import photo4 from '../IMG/Morning-Tour/bridgelong.webp'
import photo5 from '../IMG/Morning-Tour/small-gates.webp'

const MorningTour: React.FC = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

    const overviewContent = [
        "Early morning is the key to avoid the crowds during peak tourist seasons! Hit three of the top historical attractions, Fushimi-Inari Shrine, Bamboo Grove, and Tenryu-ji Temple with our English speaking tour guide!",
        "⚠️ Prior to the tour, please ensure that WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.",
        "⚠️ Please note: The earlier the start time, the fewer crowds we will encounter—if you value a peaceful, uncrowded experience, we recommend booking the earliest time slots available.",
        "✅ This is an English Guided Walking Tour which requires about 9,000 steps. We will use public transportation to visit each location(transportation fee NOT included).",
        "✅ Visit Three Highlights, Fushimi-Inari-Shrine, Arashiyama Bamboo Groove, Tenryu-ji Zen-Buddhism Temple.",
        "✅ Learn about the rich history of each location with our friendly and knowledgeable guide.",
        "✅ Receive travel tips and good restaurant recommendations from our guide."
    ];

    const tourDetails = {
        included: [
            "English Speaking Guide",
            "Temple and Shrine Visits"
        ],
        notIncluded: [
            "Public Transportation Fare (300 yen)",
            "Temple Entrance Fees"
        ],
        accessibility: [
            "Not wheelchair accessible",
            "Service animals allowed",
            "Near public transportation"
        ]
    };

    const itineraryStops = [
        { title: "Fushimi Inari Taisha Shrine", duration: "90 minutes", description: "Famous for thousands of vermillion torii gates" },
        { title: "Arashiyama Bamboo Grove", duration: "45 minutes", description: "Walk through the enchanting bamboo forest" },
        { title: "Tenryu-ji Temple", duration: "60 minutes", description: "UNESCO World Heritage Zen temple with beautiful gardens" }
    ];

    const meetingPointData = {
        location: "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
        googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
        instructions: "Meet at the 7-Eleven inside Kyoto Station central entrance."
    };

    const SEOComponent = (
        <SEO
            title={seoData.morningTour.title}
            description={seoData.morningTour.description}
            keywords={seoData.morningTour.keywords}
        />
    );

    return (
        <BaseTourPage
            tourId="morning-tour"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
        />
    );
};

export default MorningTour;
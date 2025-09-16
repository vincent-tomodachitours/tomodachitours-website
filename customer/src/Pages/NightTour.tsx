import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import { seoData } from '../data/seoData';

//Images
import photo1 from '../IMG/Night-Tour/1.webp'
import photo2 from '../IMG/Night-Tour/2.webp'
import photo3 from '../IMG/Night-Tour/3.webp'
import photo4 from '../IMG/Night-Tour/4.webp'
import photo5 from '../IMG/Night-Tour/5.webp'

const NightTour: React.FC = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

    const overviewContent = [
        "Join us an unforgettable evening walking tour of the Fushimi-Inari Shrine, one of Kyoto's most iconic and enchanting sites away from the daytime crowds and immerse yourselves in the beautiful lantern light up.",
        "⚠️ Sunset is around 5PM. During the winter season, we also offer a daytime option.",
        "⚠️ Prior to the tour, please ensure WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.",
        "✅ This is an English Guided Walking Tour. Explore the rich history and cultural significance of the shrine with a knowledgeable and friendly guide.",
        "✅ A Unique Experience of the Shrine: Enjoy a serene and less crowded experience as we visit the shrine during the quieter evening hours.",
        "✅ Breathtaking Sights: Witness the stunning transformation of the shrine after dark, when the vermilion gates and the surrounding buildings are illuminated with a soft orange glow.",
        "*This tour will not hike the entire Fushimi-Inari mountain."
    ];

    const tourDetails = {
        included: [
            "English Speaking Guide",
            "Approximately 2 Hours"
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
        { title: "Fushimi Inari Taisha Shrine", duration: "2 hours", description: "Explore the famous vermillion torii gates in the evening atmosphere" }
    ];

    const meetingPointData = {
        location: "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
        googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
        instructions: "Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station."
    };
    const SEOComponent = (
        <SEO
            title={seoData.nightTour.title}
            description={seoData.nightTour.description}
            keywords={seoData.nightTour.keywords}
        />
    );

    return (
        <BaseTourPage
            tourId="night-tour"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
        />
    );
};

export default NightTour;
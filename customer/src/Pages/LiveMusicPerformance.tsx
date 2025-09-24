import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { breadcrumbSchemas } from '../data/schemaData';
import { seoData } from '../data/seoData';

//Images - Using the same images as music tour for now
import photo1 from '../IMG/Music-Tour/1.webp'
import photo2 from '../IMG/Music-Tour/2.webp'
import photo3 from '../IMG/Music-Tour/3.webp'
import photo4 from '../IMG/Music-Tour/4.webp'
import photo5 from '../IMG/Music-Tour/5.webp'
import photo6 from '../IMG/Music-Tour/6.webp'
import photo7 from '../IMG/Music-Tour/7.webp'

const LiveMusicPerformance: React.FC = () => {
    const images = [
        { src: photo5 },
        { src: photo2 },
        { src: photo7 },
        { src: photo1 },
        { src: photo4 },
        { src: photo6 },
        { src: photo3 },
    ];

    // Overview content will now come from the API (tour description)
    // Keeping this as fallback in case API fails
    const overviewContent = [
        "Experience the vibrant live music scene of Kyoto on this immersive cultural journey. Discover intimate venues, traditional performances, and the modern music culture that thrives in Japan's ancient capital."
    ];

    const tourDetails = {
        included: [
            "English speaking guide",
            "Traditional Music Performance"
        ],
        notIncluded: [
            "Food and Beverages",
            "Tofukuji Entrance Fare (1000 yen)"
        ],
        accessibility: [
            "Not wheelchair accessible",
            "Service animals not allowed",
            "Near public transportation"
        ]
    };

    const itineraryStops = [
        { title: "Live Performance", duration: "1 hour", description: "Enjoy an intimate live music performance featuring local artists" }
    ];

    // Meeting point data will be fetched from the database via BaseTourPage
    const meetingPointData = {
        location: "Kyoto Station Central Exit", // Fallback only
        googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9", // Fallback only
        instructions: "Meet near the central information desk inside Kyoto Station." // Fallback only
    };

    const SEOComponent = (
        <SEO
            title={seoData.musicPerformance.title}
            description={seoData.musicPerformance.description}
            keywords={seoData.musicPerformance.keywords}
            image="/IMG/Music-Tour/1.webp"
        />
    );

    const StructuredDataComponent = (
        <>
            <StructuredData data={{
                "@context": "https://schema.org",
                "@type": "TouristAttraction",
                "name": "Kyoto Live Music Performance",
                "description": "Experience Kyoto's vibrant live music scene with intimate performances and cultural venues",
                "url": "https://tomodachitours.com/tours/kyoto-live-music-performance",
                "image": "https://tomodachitours.com/IMG/Music-Tour/1.webp"
            }} />
            <StructuredData data={{
                ...breadcrumbSchemas.tours,
                itemListElement: [
                    ...breadcrumbSchemas.tours.itemListElement,
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "Kyoto Live Music Performance",
                        "item": "https://tomodachitours.com/tours/kyoto-live-music-performance"
                    }
                ]
            }} />
        </>
    );

    return (
        <BaseTourPage
            tourId="music-performance"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
            StructuredDataComponent={StructuredDataComponent}
            showReviews={false}
            customHeaderMessage="New Live Music Experience - Limited Availability!"
        />
    );
};

export default LiveMusicPerformance;
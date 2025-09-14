import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { breadcrumbSchemas } from '../data/schemaData';
import { seoData } from '../data/seoData';

//Images
import photo1 from '../IMG/Music-Tour/1.webp'
import photo2 from '../IMG/Music-Tour/2.webp'
import photo3 from '../IMG/Music-Tour/3.webp'
import photo4 from '../IMG/Music-Tour/4.webp'
import photo5 from '../IMG/Music-Tour/5.webp'
import photo6 from '../IMG/Music-Tour/6.webp'
import photo7 from '../IMG/Music-Tour/7.webp'

const MusicTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
        { src: photo6 },
        { src: photo7 },
    ];

    // Overview content will now come from the API (tour description)
    // Keeping this as fallback in case API fails
    const overviewContent = [
        "Join us for an enchanting musical journey through Kyoto's rich cultural heritage. Discover the sounds that have shaped this ancient city for over a thousand years."
    ];

    const tourDetails = {
        included: [
            "English speaking guide",
            "Traditional Music Performance",
            "Japanese Tea Ceremony Experience",
            "Tofukuji Entrance Fare (1000 yen)"
        ],
        notIncluded: [
            "Food and Beverages"
        ],
        accessibility: [
            "Not wheelchair accessible",
            "Service animals not allowed",
            "Near public transportation"
        ]
    };

    const itineraryStops = [
        { name: "Tofukuji Walking Tour", duration: "2 hours", description: "Explore the historic Tofukuji Temple grounds and surrounding areas" },
        { name: "Traditional Music Performance", duration: "1 hour", description: "Experience authentic Japanese musical traditions with live performances" },
        { name: "Authentic Tea Ceremony", duration: "1 hour", description: "Participate in a traditional Japanese tea ceremony experience" }
    ];

    const meetingPointData = {
        location: "Kyoto Station Central Exit",
        googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
        instructions: "Meet near the central information desk inside Kyoto Station."
    };

    const SEOComponent = (
        <SEO
            title={seoData.musicTour.title}
            description={seoData.musicTour.description}
            keywords={seoData.musicTour.keywords}
            image="/IMG/Music-Tour/1.webp"
        />
    );

    const StructuredDataComponent = (
        <>
            <StructuredData data={{
                "@context": "https://schema.org",
                "@type": "TouristAttraction",
                "name": "Kyoto Music Culture Walking Tour",
                "description": "Discover Kyoto's rich musical heritage on this immersive walking tour",
                "url": "https://tomodachitours.com/tours/kyoto-music-culture-walking-tour",
                "image": "https://tomodachitours.com/IMG/Music-Tour/1.webp"
            }} />
            <StructuredData data={{
                ...breadcrumbSchemas.tours,
                itemListElement: [
                    ...breadcrumbSchemas.tours.itemListElement,
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "Kyoto Music Culture Walking Tour",
                        "item": "https://tomodachitours.com/tours/kyoto-music-culture-walking-tour"
                    }
                ]
            }} />
        </>
    );

    return (
        <BaseTourPage
            tourId="music-tour"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
            StructuredDataComponent={StructuredDataComponent}
            showReviews={false}
            customHeaderMessage="Exclusive debut October 2nd - Only 12 spots available!"
        />
    );
};

export default MusicTour;
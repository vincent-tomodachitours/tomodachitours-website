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

const MusicTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

    const overviewContent = [
        "Join us for an enchanting musical journey through Kyoto's rich cultural heritage. Discover the sounds that have shaped this ancient city for over a thousand years.",
        "⚠️ This tour includes visits to traditional music venues and may include live performances depending on availability.",
        "⚠️ Prior to the tour, please ensure WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.",
        "✅ This is an English Guided Walking Tour. Explore the musical traditions and cultural significance of Kyoto's soundscape with a knowledgeable and passionate guide.",
        "✅ A Unique Cultural Experience: Immerse yourself in traditional Japanese music, from ancient court music to folk songs and modern interpretations.",
        "✅ Historic Music Venues: Visit traditional tea houses, temples, and cultural centers where music has been performed for centuries.",
        "*This tour focuses on cultural appreciation and may include opportunities to try traditional instruments."
    ];

    const tourDetails = {
        included: [
            "English Speaking Guide",
            "Cultural Music Experience",
            "Traditional Instrument Demonstration"
        ],
        notIncluded: [
            "Public Transportation Fare (300 yen)",
            "Food and Beverages"
        ],
        accessibility: [
            "Not wheelchair accessible",
            "Service animals allowed",
            "Near public transportation"
        ]
    };

    const itineraryStops = [
        { name: "Traditional Music Hall", duration: "30 minutes", description: "Experience traditional Japanese court music" },
        { name: "Historic Tea House", duration: "25 minutes", description: "Listen to shamisen and koto performances" },
        { name: "Temple Music Experience", duration: "20 minutes", description: "Buddhist chanting and temple bells" },
        { name: "Folk Music Venue", duration: "25 minutes", description: "Traditional folk songs and storytelling" }
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
        />
    );
};

export default MusicTour;
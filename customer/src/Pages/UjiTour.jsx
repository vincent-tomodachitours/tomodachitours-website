import React from 'react';
import BaseTourPage from '../Components/TourPages/BaseTourPage';
import SEO from '../components/SEO';
import { seoData } from '../data/seoData';

//Images
import photo1 from '../IMG/Uji-Tour/icecream.webp'
import photo2 from '../IMG/Uji-Tour/byodoin.webp'
import photo3 from '../IMG/Uji-Tour/museum-angels.webp'
import photo4 from '../IMG/Uji-Tour/usucha.webp'
import photo5 from '../IMG/Uji-Tour/experience.webp'

const UjiTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

    const overviewContent = [
        "Step into the Matcha capital, Uji, and experience the heart of Japan's finest green tea. Walking through the famous Byodo-in temple, known for its appearance on the 10-yen coin, you will grind tea leaves into matcha powder and drink your fresh matcha tea. A must-try experience for matcha lovers!",
        "⚠️ Prior to the tour, please ensure that WhatsApp is available for easy communication. Our tour guide will use these platforms to contact you.",
        "⚠️ Please wear a mask during the Matcha making workshop.",
        "✅ English Guided Tour – Explore Uji City with our friendly and knowledgeable guide.",
        "✅ Hands-on Matcha Experience – Grind your own matcha powder using a traditional stone mill, then enjoy your freshly made tea with your choice of Japanese sweets or matcha ice cream.",
        "✅ Visit Byodo-in Temple – A UNESCO World Heritage Site, famous for its stunning architecture featured on the 10-yen coin.",
        "✅ Learn the History of Uji Tea – Discover why Uji is known as Japan's top region for high-quality green tea."
    ];

    const tourDetails = {
        included: [
            "English Speaking Guide",
            "Matcha Making Experience",
            "Traditional Japanese Sweets"
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
        { name: "Statue of Murasaki Shikibu", duration: "15 minutes" },
        { name: "Byodo-in Temple", duration: "60 minutes", description: "UNESCO World Heritage Site" },
        { name: "Matcha Workshop", duration: "45 minutes", description: "Hands-on matcha grinding experience" },
        { name: "Tea Tasting", duration: "30 minutes", description: "Enjoy your freshly made matcha" },
        { name: "Uji Tea Street", duration: "20 minutes", description: "Explore traditional tea shops" }
    ];

    const meetingPointData = {
        location: "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
        googleMapsUrl: "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
        instructions: "Meet at the 7-Eleven inside Kyoto Station central entrance."
    };

    const SEOComponent = (
        <SEO
            title={seoData.ujiTour.title}
            description={seoData.ujiTour.description}
            keywords={seoData.ujiTour.keywords}
        />
    );

    return (
        <BaseTourPage
            tourId="uji-tour"
            images={images}
            overviewContent={overviewContent}
            tourDetails={tourDetails}
            itineraryStops={itineraryStops}
            meetingPointData={meetingPointData}
            SEOComponent={SEOComponent}
        />
    );
};

export default UjiTour;
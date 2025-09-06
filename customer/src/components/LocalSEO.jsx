import React from 'react';
import StructuredData from './StructuredData';
import { businessInfo } from '../data/locationData';

const LocalSEO = ({
    location = null,
    tourType = null,
    additionalKeywords = []
}) => {
    // Generate location-specific structured data
    const generateLocationSchema = () => {
        const baseSchema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": businessInfo.name,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": businessInfo.address.street,
                "addressLocality": businessInfo.address.city,
                "addressRegion": businessInfo.address.prefecture,
                "postalCode": businessInfo.address.postalCode,
                "addressCountry": businessInfo.address.country
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": businessInfo.coordinates.latitude,
                "longitude": businessInfo.coordinates.longitude
            },
            "telephone": businessInfo.contact.phone,
            "email": businessInfo.contact.email,
            "url": "https://tomodachitours.com",
            "areaServed": businessInfo.serviceArea.map(area => ({
                "@type": "City",
                "name": area
            })),
            "serviceType": "Walking Tours",
            "availableLanguage": businessInfo.languages
        };

        // Add location-specific information if provided
        if (location) {
            baseSchema.description = `English walking tours in ${location}, Kyoto. ${tourType ? `Specializing in ${tourType}.` : ''}`;
            baseSchema.keywords = [
                `${location} tours`,
                `English tours ${location}`,
                `${location} walking tours`,
                ...additionalKeywords
            ].join(', ');
        }

        return baseSchema;
    };

    // Generate service area schema for specific locations
    const generateServiceAreaSchema = () => {
        if (!location) return null;

        return {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": `English Walking Tours in ${location}`,
            "provider": {
                "@type": "LocalBusiness",
                "name": businessInfo.name
            },
            "areaServed": {
                "@type": "City",
                "name": location,
                "containedInPlace": {
                    "@type": "City",
                    "name": "Kyoto"
                }
            },
            "serviceType": "Walking Tours",
            "availableLanguage": "English"
        };
    };

    return (
        <>
            <StructuredData data={generateLocationSchema()} />
            {generateServiceAreaSchema() && (
                <StructuredData data={generateServiceAreaSchema()} />
            )}
        </>
    );
};

export default LocalSEO;
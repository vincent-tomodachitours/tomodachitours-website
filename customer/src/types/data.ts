// Type definitions for data files

export interface KyotoDistrict {
    name: string;
    description: string;
    keywords: string[];
    attractions: string[];
    bestTimeToVisit: string;
    transportation: string;
    culturalTips: string[];
}

export interface KyotoDistricts {
    gion: KyotoDistrict;
    arashiyama: KyotoDistrict;
    fushimi: KyotoDistrict;
    uji: KyotoDistrict;
}

export interface SeasonalKeywords {
    spring: string[];
    summer: string[];
    autumn: string[];
    winter: string[];
}

export interface TourismKeywords {
    primary: string[];
    longTail: string[];
    seasonal: SeasonalKeywords;
    activityBased: string[];
}

export interface Address {
    street: string;
    city: string;
    prefecture: string;
    postalCode: string;
    country: string;
}

export interface Contact {
    phone: string;
    email: string;
    whatsapp: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface OperatingHours {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}

export interface BusinessInfo {
    name: string;
    address: Address;
    contact: Contact;
    coordinates: Coordinates;
    serviceArea: string[];
    languages: string[];
    operatingHours: OperatingHours;
}

// TripAdvisor Reviews Types
export interface RealBusinessInfo {
    locationId: string;
    name: string;
    overallRating: number;
    totalReviews: number;
    ranking: string;
    tripAdvisorUrl: string;
}

export interface Review {
    id: string;
    title: string;
    text: string;
    rating: number;
    author: string;
    authorLocation: string;
    date: string;
    helpfulVotes: number;
    isVerified: boolean;
    language: string;
    tourId?: string;
}

// Tour Configuration Types
export interface ItineraryStop {
    name: string;
    duration: string;
    description?: string;
}

export interface TourDetails {
    included: string[];
    notIncluded: string[];
    accessibility: string[];
    commonIncluded?: string[];
    commonNotIncluded?: string[];
}

export interface MeetingPointData {
    location: string;
    googleMapsUrl: string;
    instructions: string;
}

export interface TourConfig {
    overviewContent: string[];
    tourDetails: TourDetails;
    itineraryStops: ItineraryStop[];
    meetingPointData: MeetingPointData;
}

export interface TourConfigs {
    [key: string]: TourConfig;
}

// SEO Data Types
export interface SeoPageData {
    title: string;
    description: string;
    keywords: string;
}

export interface SeoData {
    [key: string]: SeoPageData;
}

// Schema Data Types
export interface SchemaAddress {
    "@type": string;
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
}

export interface SchemaGeo {
    "@type": string;
    latitude: number;
    longitude: number;
}

export interface SchemaOffer {
    "@type": string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
    validFrom: string;
}

export interface SchemaAggregateRating {
    "@type": string;
    ratingValue: string;
    reviewCount: string;
    bestRating: string;
    worstRating: string;
}

export interface SchemaProvider {
    "@type": string;
    name: string;
    url: string;
}

export interface TourSchema {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    image: string;
    url: string;
    address: SchemaAddress;
    geo: SchemaGeo;
    openingHours: string;
    isAccessibleForFree: boolean;
    publicAccess: boolean;
    touristType: string;
    availableLanguage: string;
    duration: string;
    offers: SchemaOffer;
    provider: SchemaProvider;
    aggregateRating: SchemaAggregateRating;
}

export interface BreadcrumbItem {
    "@type": string;
    position: number;
    name: string;
    item: string;
}

export interface BreadcrumbSchema {
    "@context": string;
    "@type": string;
    itemListElement: BreadcrumbItem[];
}

export interface FAQAnswer {
    "@type": string;
    text: string;
}

export interface FAQQuestion {
    "@type": string;
    name: string;
    acceptedAnswer: FAQAnswer;
}

export interface FAQSchema {
    "@context": string;
    "@type": string;
    mainEntity: FAQQuestion[];
}
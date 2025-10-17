import React, { useState, useEffect } from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import TripAdvisorReviews from '../Components/TripAdvisorReviews'

import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import LocalSEO from '../components/LocalSEO'
import { seoData } from '../data/seoData'
import { organizationSchema, localBusinessSchema, breadcrumbSchemas, faqSchemas } from '../data/schemaData'
import { TourData } from '../types'

// Import tour services
import { fetchTours } from '../services/toursService';

//Analytics
import attributionService from '../services/attributionService';

// Import images
import main1 from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import nightTour from "../IMG/Night-Tour/1.webp"
import morningTour from "../IMG/Morning-Tour/IMG_7260 2.webp"
import ujiTour from "../IMG/Uji-Tour/icecream.webp"
import gionTour from "../IMG/Gion-Tour/geisha.webp"
import musicTour from "../IMG/Music-Tour/1.webp"


interface LoadingOrErrorStateProps {
    isLoading: boolean;
    heroImage: string;
}

const LoadingOrErrorState: React.FC<LoadingOrErrorStateProps> = ({ isLoading, heroImage }) => (
    <div className='min-h-screen flex flex-col' style={{ backgroundColor: 'oklch(90% 0 0)' }}>
        <Header />

        {/* Hero Section */}
        <div className='relative h-[70vh] lg:h-[85vh] overflow-hidden'>
            <div className='absolute inset-0 bg-black/30 z-10'></div>
            <img
                src={heroImage}
                alt="Bamboo forest"
                className='absolute inset-0 w-full h-full object-cover transform scale-105 animate-ken-burns'
            />
            <div className='relative z-20 h-full flex flex-col items-center justify-center px-4'>
                <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-ubuntu font-bold text-center text-white max-w-5xl mx-auto leading-tight mb-8'>
                    Discover Kyoto Beyond the Guidebooks
                </h1>

                {/* Animated Down Arrows */}
                <div className='absolute bottom-8 left-0 right-0 flex justify-center animate-bounce'>
                    <div className='flex flex-col items-center cursor-pointer group' onClick={() => {
                        document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        <svg
                            className='w-24 h-6 text-white group-hover:text-blue-300 transition-colors duration-300'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 48 12'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M36 3l-12 6m0 0l-12-6' />
                        </svg>
                        <svg
                            className='w-24 h-6 text-white group-hover:text-blue-300 transition-colors duration-300'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 48 12'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M36 3l-12 6m0 0l-12-6' />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Section */}
        <main className='container mx-auto px-4 py-16 max-w-7xl'>
            <div className='space-y-8'>
                <div className='text-center mb-12'>
                    <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                        Our Tours
                    </h2>
                    <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full'></div>
                </div>

                <div className='flex items-center justify-center min-h-[200px]'>
                    <div className={`text-xl ${isLoading ? 'text-gray-600' : 'text-red-600'}`}>
                        {isLoading ? 'Loading tours...' : 'Unable to load tours. Please try again later.'}
                    </div>
                </div>
            </div>
        </main>

        {/* Customer Reviews Section */}
        <section className='py-16' style={{ backgroundColor: 'oklch(90% 0 0)' }}>
            <div className='container mx-auto px-4 max-w-7xl'>
                <div className='text-center mb-12'>
                    <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold mb-4' style={{ color: 'oklch(5% 0 0)' }}>
                        Customer Reviews
                    </h2>
                    <div className='w-24 h-1 mx-auto rounded-full mb-6' style={{ backgroundColor: 'oklch(55% 0.22 250)' }}></div>
                    <p className='text-xl max-w-3xl mx-auto' style={{ color: 'oklch(40% 0 0)' }}>
                        See what our guests are saying about their unforgettable experiences exploring Kyoto with us.
                    </p>
                </div>

                <div className='transform transition-all duration-700 ease-out opacity-100 translate-y-0'>
                    <TripAdvisorReviews
                        locationId={process.env.REACT_APP_TRIPADVISOR_LOCATION_ID}
                        maxReviews={6}
                        showRating={true}
                        layout="grid"
                        className="animate-fade-in-up"
                        showAttribution={true}
                    />
                </div>
            </div>
        </section>

        <Footer />
    </div>
);

interface TourCardProps {
    image: string;
    imageAlt: string;
    title: string;
    description: string;
    price: string;
    originalPrice?: number;
    link: string;
    badge?: string;
    showOriginalPrice: boolean;
    duration?: string;
}

const TourCard: React.FC<TourCardProps> = ({ image, imageAlt, title, description, price, originalPrice, link, badge, showOriginalPrice, duration }) => {
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .tour-card-test:hover {
                background-color: oklch(100% 0 0) !important;
            }
            .tour-card-content-test {
                background-color: oklch(95% 0 0);
                transition: background-color 0.3s ease;
            }
            .tour-card-test:hover .tour-card-content-test {
                background-color: oklch(100% 0 0) !important;
            }
            .book-now-button-test {
                transition: box-shadow 0.3s ease;
            }
            .tour-card-test:hover .book-now-button-test {
                box-shadow: 0px 2px 2px hsla(0, 0%, 5%, 0.07), 0px 4px 4px hsla(0, 0%, 0%, 0.15) !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <Link
            to={link}
            className='tour-card-test group rounded-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-1 flex flex-col h-full'
            style={{
                backgroundColor: 'oklch(95% 0 0)',
                border: '1px solid oklch(95% 0 0)',
                borderTop: '1px solid oklch(100% 0 0)',
                boxShadow: '0px 2px 2px hsla(0, 0%, 5%, 0.07), 0px 4px 4px hsla(0, 0%, 0%, 0.15)'
            }}
        >
        <div className='aspect-[16/9] overflow-hidden relative'>
            <img
                src={image}
                alt={imageAlt}
                className='w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110'
            />
            {badge && (
                <div className='absolute top-4 right-4 z-10'>
                    <span className={`px-3 py-1.5 rounded-full text-base font-bold shadow-lg ${badge === 'NEW TOUR'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-white text-emerald-700'
                        }`}>
                        {badge}
                    </span>
                </div>
            )}
        </div>
        <div className='tour-card-content-test p-6 flex flex-col flex-grow'>
            <div className='flex-grow'>
                <h3 className='text-2xl font-bold group-hover:text-blue-600 transition-colors duration-300 mb-4' style={{ color: 'oklch(5% 0 0)' }}>
                    {title}
                </h3>
                <p className='text-gray-600 line-clamp-3 mb-4'>
                    {description}
                </p>

                {duration && (
                    <div className='flex items-center text-sm text-gray-600 mb-2'>
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className='font-medium'>Duration:</span>
                        <span className='ml-1'>{duration}</span>
                    </div>
                )}
            </div>

            <div className='mt-2'>
                {showOriginalPrice && originalPrice && originalPrice > 0 && (
                    <div className='mb-1'>
                        <span className='text-lg text-red-500 line-through'>
                            ¥ {originalPrice.toLocaleString('en-US')}
                        </span>
                    </div>
                )}
                <div className='flex items-center justify-between'>
                    <span className='text-2xl font-bold text-blue-600'>
                        {price}
                    </span>
                    <span 
                        className='book-now-button-test inline-flex items-center font-semibold transition-all duration-300 px-4 py-2 rounded-lg text-blue-600'
                        style={{
                            backgroundColor: 'oklch(100% 0 0)',
                            border: '1px solid oklch(100% 0 0)',
                            borderTop: '1px solid oklch(100% 0 0)'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        Book Now
                    </span>
                </div>
            </div>
        </div>
    </Link>
    );
};

const UITest: React.FC = () => {
    const [tours, setTours] = useState<Record<string, TourData> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Initialize attribution tracking for UTM parameters
        attributionService.initialize();

        const loadTours = async () => {
            try {
                setLoading(true);
                const data = await fetchTours();
                setTours(data);
                console.log('✅ Home tours data loaded:', Object.keys(data));
            } catch (error) {
                console.error('❌ Failed to load home tours data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTours();
    }, []);

    if (loading || !tours) {
        return <LoadingOrErrorState isLoading={loading} heroImage={main1} />;
    }

    return (
        <div className='min-h-screen flex flex-col' style={{ backgroundColor: 'oklch(90% 0 0)' }}>
            <SEO
                title={seoData.home.title}
                description={seoData.home.description}
                keywords={seoData.home.keywords}
            />

            {/* Structured Data */}
            <StructuredData data={organizationSchema} />
            <StructuredData data={localBusinessSchema} />
            <StructuredData data={breadcrumbSchemas.home} />
            <StructuredData data={faqSchemas.general} />

            {/* Local SEO */}
            <LocalSEO
                location="Kyoto"
                tourType="English Walking Tours"
                additionalKeywords={['avoid crowds', 'early morning tours', 'sustainable tourism']}
            />

            <Header />

            {/* Hero Section */}
            <div className='relative h-[70vh] lg:h-[85vh] overflow-hidden'>
                <div className='absolute inset-0 bg-black/30 z-10'></div>
                <img
                    src={main1}
                    alt="Bamboo forest"
                    className='absolute inset-0 w-full h-full object-cover transform scale-105 animate-ken-burns'
                />
                <div className='relative z-20 h-full flex flex-col items-center justify-center px-4'>
                    <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-ubuntu font-bold text-center text-white max-w-5xl mx-auto leading-tight mb-8'>
                        Discover Kyoto Beyond the Guidebooks
                    </h1>

                    {/* Animated Down Arrows */}
                    <div className='absolute bottom-8 left-0 right-0 flex justify-center animate-bounce'>
                        <div className='flex flex-col items-center cursor-pointer group' onClick={() => {
                            document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            <svg
                                className='w-24 h-6 text-white group-hover:text-blue-300 transition-colors duration-300'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 48 12'
                            >
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M36 3l-12 6m0 0l-12-6' />
                            </svg>
                            <svg
                                className='w-24 h-6 text-white group-hover:text-blue-300 transition-colors duration-300'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 48 12'
                            >
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M36 3l-12 6m0 0l-12-6' />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tours Section */}
            <main className='container mx-auto px-4 py-16'>
                <div className='space-y-16'>
                    <div className='text-center'>
                        <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                            Our Tours
                        </h2>
                        <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full mb-6'></div>
                        <div className='flex flex-col md:flex-row items-center md:items-start justify-center gap-6 max-w-5xl mx-auto'>
                            <div className='flex items-center gap-3 px-6 py-4 rounded-lg flex-shrink-0' style={{ backgroundColor: 'oklch(98% 0.02 145)', border: '1px solid oklch(85% 0.04 145)', boxShadow: '0px 2px 2px hsla(0, 0%, 5%, 0.07), 0px 4px 4px hsla(0, 0%, 0%, 0.15)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="oklch(66% 0.17 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                                    <path d="m9 8 3 3v7"/>
                                    <path d="m12 11 3-3"/>
                                    <path d="M9 12h6"/>
                                    <path d="M9 16h6"/>
                                </svg>
                                <p className='text-lg font-semibold text-left' style={{ color: 'oklch(66% 0.17 145)' }}>
                                    10% cheaper than major booking platforms
                                </p>
                            </div>
                            <p className='text-xl text-gray-600 flex-1 text-left'>
                                Experience the magic of Kyoto with our carefully curated tours, each designed to show you a unique perspective of this ancient city.
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto'>
                        {tours['night-tour'] && (
                            <TourCard
                                image={nightTour}
                                imageAlt="Couple walking through torii gates"
                                title={tours['night-tour']['tour-title']}
                                description={tours['night-tour']['tour-description']}
                                price={`¥ ${tours['night-tour']['tour-price'].toLocaleString('en-US')}`}
                                originalPrice={tours['night-tour']['original-price']}
                                showOriginalPrice={true}
                                link="/tours/kyoto-fushimi-inari-night-walking-tour"
                                duration={tours['night-tour']['tour-duration']}
                            />
                        )}
                        {tours['morning-tour'] && (
                            <TourCard
                                image={morningTour}
                                imageAlt="Couple posing in front of torii gates"
                                title={tours['morning-tour']['tour-title']}
                                description={tours['morning-tour']['tour-description']}
                                price={`¥ ${tours['morning-tour']['tour-price'].toLocaleString('en-US')}`}
                                originalPrice={tours['morning-tour']['original-price']}
                                showOriginalPrice={true}
                                link="/tours/kyoto-early-bird-english-tour"
                                badge="Best Seller"
                                duration={tours['morning-tour']['tour-duration']}
                            />
                        )}

                        {tours['uji-tour'] && (
                            <TourCard
                                image={ujiTour}
                                imageAlt="Matcha on ice cream"
                                title={tours['uji-tour']['tour-title']}
                                description={tours['uji-tour']['tour-description']}
                                price={`¥ ${tours['uji-tour']['tour-price'].toLocaleString('en-US')}`}
                                originalPrice={tours['uji-tour']['original-price']}
                                showOriginalPrice={false}
                                link="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto"
                                duration={tours['uji-tour']['tour-duration']}
                            />
                        )}
                        {tours['gion-tour'] && (
                            <TourCard
                                image={gionTour}
                                imageAlt="Geisha walking through hanamichi"
                                title={tours['gion-tour']['tour-title']}
                                description={tours['gion-tour']['tour-description']}
                                price={`¥ ${tours['gion-tour']['tour-price'].toLocaleString('en-US')}`}
                                originalPrice={tours['gion-tour']['original-price']}
                                showOriginalPrice={false}
                                link="/tours/kyoto-gion-early-morning-walking-tour"
                                duration={tours['gion-tour']['tour-duration']}
                            />
                        )}
                        {/* TEST: This tour card should NOT appear since 'music-tour' doesn't exist in the database */}
                        {tours['music-tour'] && (
                            <TourCard
                                image={musicTour}
                                imageAlt="Traditional Japanese music performance"
                                title={tours['music-tour']['tour-title']}
                                description={tours['music-tour']['tour-description']}
                                price={`¥ ${tours['music-tour']['tour-price'].toLocaleString('en-US')}`}
                                originalPrice={tours['music-tour']['original-price']}
                                showOriginalPrice={false}
                                link="/tours/kyoto-traditional-music-experience"
                                duration={tours['music-tour']['tour-duration']}
                                badge="NEW TOUR"
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Customer Reviews Section */}
            <section className='py-16' style={{ backgroundColor: 'oklch(90% 0 0)' }}>
                <div className='container mx-auto px-4 max-w-7xl'>
                    <div className='text-center mb-12'>
                        <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold mb-4' style={{ color: 'oklch(5% 0 0)' }}>
                            Customer Reviews
                        </h2>
                        <div className='w-24 h-1 mx-auto rounded-full mb-6' style={{ backgroundColor: 'oklch(55% 0.22 250)' }}></div>
                        <p className='text-xl max-w-3xl mx-auto' style={{ color: 'oklch(40% 0 0)' }}>
                            See what our guests are saying about their unforgettable experiences exploring Kyoto with us.
                        </p>
                    </div>

                    <div className='transform transition-all duration-700 ease-out opacity-100 translate-y-0'>
                        <TripAdvisorReviews
                            locationId={process.env.REACT_APP_TRIPADVISOR_LOCATION_ID}
                            maxReviews={6}
                            showRating={true}
                            layout="grid"
                            className="animate-fade-in-up"
                            showAttribution={true}
                        />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default UITest

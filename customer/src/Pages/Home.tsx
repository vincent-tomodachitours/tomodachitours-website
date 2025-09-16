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
    <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
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
        <section className='bg-white py-16 border-t border-gray-100'>
            <div className='container mx-auto px-4 max-w-7xl'>
                <div className='text-center mb-12'>
                    <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                        Customer Reviews
                    </h2>
                    <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full mb-6'></div>
                    <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
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
}

const TourCard: React.FC<TourCardProps> = ({ image, imageAlt, title, description, price, originalPrice, link, badge, showOriginalPrice }) => (
    <Link
        to={link}
        className='group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full'
    >
        <div className='aspect-[16/9] overflow-hidden relative'>
            <img
                src={image}
                alt={imageAlt}
                className='w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110'
            />
            {badge && (
                <div className='absolute top-4 left-4 z-10'>
                    <span className={`px-3 py-1.5 rounded-full text-base font-bold shadow-lg ${badge === 'NEW TOUR'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-white text-emerald-700'
                        }`}>
                        {badge}
                    </span>
                </div>
            )}
        </div>
        <div className='p-6 flex flex-col flex-grow'>
            <h3 className='text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-4'>
                {title}
            </h3>
            <p className='text-gray-600 line-clamp-3 mb-6'>
                {description}
            </p>
            <div className='flex items-center justify-between mt-auto'>
                <div className='flex flex-col'>
                    {showOriginalPrice && originalPrice && originalPrice > 0 && (
                        <span className='text-lg text-red-500 line-through mb-1'>
                            ¥ {originalPrice.toLocaleString('en-US')}
                        </span>
                    )}
                    <span className='text-2xl font-bold text-blue-600'>
                        {price}
                    </span>
                </div>
                <span className='inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform duration-300'>
                    Learn More
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </div>
    </Link>
);

const Home: React.FC = () => {
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
        <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
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
                        <p className='text-xl text-gray-600 max-w-3xl mx-auto mb-4'>
                            Experience the magic of Kyoto with our carefully curated tours, each designed to show you a unique perspective of this ancient city.
                        </p>
                        <div className='bg-emerald-50 border border-emerald-200 rounded-lg px-6 py-4 max-w-md mx-auto'>
                            <p className='text-lg font-semibold text-emerald-800'>
                                💰 10% cheaper than major booking platforms
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto'>
                        <TourCard
                            image={nightTour}
                            imageAlt="Couple walking through torii gates"
                            title={tours['night-tour']['tour-title']}
                            description={tours['night-tour']['tour-description']}
                            price={`¥ ${tours['night-tour']['tour-price'].toLocaleString('en-US')}`}
                            originalPrice={tours['night-tour']['original-price']}
                            showOriginalPrice={true}
                            link="/tours/kyoto-fushimi-inari-night-walking-tour"
                        />
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
                        />
                        <TourCard
                            image={musicTour}
                            imageAlt="Traditional music performance in Kyoto"
                            title={tours['music-tour']['tour-title']}
                            description={tours['music-tour']['tour-description']}
                            price={`¥ ${tours['music-tour']['tour-price'].toLocaleString('en-US')}`}
                            originalPrice={tours['music-tour']['original-price']}
                            showOriginalPrice={tours['music-tour']['original-price'] !== tours['music-tour']['tour-price']}
                            link="/tours/kyoto-music-culture-walking-tour"
                            badge="NEW TOUR"
                        />
                        <TourCard
                            image={ujiTour}
                            imageAlt="Matcha on ice cream"
                            title={tours['uji-tour']['tour-title']}
                            description={tours['uji-tour']['tour-description']}
                            price={`¥ ${tours['uji-tour']['tour-price'].toLocaleString('en-US')}`}
                            originalPrice={tours['uji-tour']['original-price']}
                            showOriginalPrice={false}
                            link="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto"
                        />
                        <TourCard
                            image={gionTour}
                            imageAlt="Geisha walking through hanamichi"
                            title={tours['gion-tour']['tour-title']}
                            description={tours['gion-tour']['tour-description']}
                            price={`¥ ${tours['gion-tour']['tour-price'].toLocaleString('en-US')}`}
                            originalPrice={tours['gion-tour']['original-price']}
                            showOriginalPrice={false}
                            link="/tours/kyoto-gion-early-morning-walking-tour"
                        />
                    </div>
                </div>
            </main>

            {/* Customer Reviews Section */}
            <section className='bg-white py-16 border-t border-gray-100'>
                <div className='container mx-auto px-4 max-w-7xl'>
                    <div className='text-center mb-12'>
                        <h2 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                            Customer Reviews
                        </h2>
                        <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full mb-6'></div>
                        <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
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

export default Home
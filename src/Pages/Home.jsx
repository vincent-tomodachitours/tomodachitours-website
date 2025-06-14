import React, { useState, useEffect } from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { Link } from 'react-router-dom'

// Import tour services
import { fetchTours } from '../services/toursService';

// Import images
import main1 from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import nightTour from "../IMG/Night-Tour/1.webp"
import morningTour from "../IMG/Morning-Tour/IMG_7260 2.webp"
import ujiTour from "../IMG/Uji-Tour/icecream.webp"
import gionTour from "../IMG/Gion-Tour/geisha.webp"

const LoadingOrErrorState = ({ isLoading, heroImage }) => (
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
            <div className='relative z-20 h-full flex items-center justify-center px-4'>
                <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-ubuntu font-bold text-center text-white max-w-5xl mx-auto leading-tight'>
                    Discover Kyoto Beyond the Guidebooks
                </h1>
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

        <Footer />
    </div>
);

const TourCard = ({ image, imageAlt, title, description, price, link }) => (
    <Link
        to={link}
        className='group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full'
    >
        <div className='aspect-[16/9] overflow-hidden'>
            <img
                src={image}
                alt={imageAlt}
                className='w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110'
            />
        </div>
        <div className='p-6 flex flex-col flex-grow'>
            <h3 className='text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-4'>
                {title}
            </h3>
            <p className='text-gray-600 line-clamp-3 mb-6'>
                {description}
            </p>
            <div className='flex items-center justify-between mt-auto'>
                <span className='text-2xl font-bold text-blue-600'>
                    {price}
                </span>
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

const Home = () => {
    const [tours, setTours] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
            <Header />

            {/* Hero Section */}
            <div className='relative h-[70vh] lg:h-[85vh] overflow-hidden'>
                <div className='absolute inset-0 bg-black/30 z-10'></div>
                <img
                    src={main1}
                    alt="Bamboo forest"
                    className='absolute inset-0 w-full h-full object-cover transform scale-105 animate-ken-burns'
                />
                <div className='relative z-20 h-full flex items-center justify-center px-4'>
                    <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-ubuntu font-bold text-center text-white max-w-5xl mx-auto leading-tight'>
                        Discover Kyoto Beyond the Guidebooks
                    </h1>
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
                        <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                            Experience the magic of Kyoto with our carefully curated tours, each designed to show you a unique perspective of this ancient city.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto'>
                        <TourCard
                            image={nightTour}
                            imageAlt="Couple walking through torii gates"
                            title={tours['night-tour']['tour-title']}
                            description={tours['night-tour']['tour-description']}
                            price={`¥ ${tours['night-tour']['tour-price'].toLocaleString('en-US')}`}
                            link="/tours/kyoto-fushimi-inari-night-walking-tour"
                        />
                        <TourCard
                            image={morningTour}
                            imageAlt="Couple posing in front of torii gates"
                            title={tours['morning-tour']['tour-title']}
                            description={tours['morning-tour']['tour-description']}
                            price={`¥ ${tours['morning-tour']['tour-price'].toLocaleString('en-US')}`}
                            link="/tours/kyoto-early-bird-english-tour"
                        />
                        <TourCard
                            image={ujiTour}
                            imageAlt="Matcha on ice cream"
                            title={tours['uji-tour']['tour-title']}
                            description={tours['uji-tour']['tour-description']}
                            price={`¥ ${tours['uji-tour']['tour-price'].toLocaleString('en-US')}`}
                            link="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto"
                        />
                        <TourCard
                            image={gionTour}
                            imageAlt="Geisha walking through hanamachi"
                            title={tours['gion-tour']['tour-title']}
                            description={tours['gion-tour']['tour-description']}
                            price={`¥ ${tours['gion-tour']['tour-price'].toLocaleString('en-US')}`}
                            link="/tours/kyoto-gion-early-morning-walking-tour"
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Home
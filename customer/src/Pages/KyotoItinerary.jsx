import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Components
import Header from '../Components/Headers/Header1';
import Footer from '../Components/Footer';
import SEO from '../components/SEO';
import { seoData } from '../data/seoData';

// Import tour services
import { getTour } from '../services/toursService';

// Images - using the same images from MorningTour for consistency
import bambooGrove from '../IMG/Morning-Tour/arashiyama1.webp';
import tenryuji from '../IMG/Morning-Tour/tenryuji.webp';
import bridge from '../IMG/Morning-Tour/bridgelong.webp';
import gates from '../IMG/Morning-Tour/small-gates.webp';
import yasakaPagoda from '../IMG/Gion-Tour/yasaka-pagoda.webp';

// Additional images for Gion area and nightlife
import yasakaShrine from '../IMG/Gion-Tour/yasaka-lanterns.webp';
import kiyomizu from '../IMG/Gion-Tour/kiyomizu.webp';
import rockingBar from '../IMG/Recommendations/rockingbar.webp';

// Additional placeholder images for other activities
const pontochoStreet = yasakaPagoda; // placeholder

const KyotoItinerary = () => {
    const [tourData, setTourData] = useState(null);

    // Load tour data from Supabase
    useEffect(() => {
        const loadTourData = async () => {
            try {
                const data = await getTour('morning-tour');
                setTourData(data);
                console.log('✅ Morning tour data loaded for itinerary:', data);
            } catch (error) {
                console.error('❌ Failed to load morning tour data:', error);
            }
        };

        loadTourData();
    }, []);

    const itineraryItems = [
        {
            time: "7:00 AM",
            title: "Fushimi Inari Shrine",
            description: "Walk through thousands of vermillion torii gates in peaceful morning silence. The iconic tunnel of gates is magical at sunrise.",
            image: gates,
            highlight: true,
            tourLink: true
        },
        {
            time: "8:30 AM",
            title: "Arashiyama Bamboo Grove",
            description: "Experience the ethereal bamboo forest when morning light filters through towering stalks. The sound of rustling bamboo is pure meditation.",
            image: bambooGrove,
            highlight: true,
            tourLink: true
        },
        {
            time: "9:30 AM",
            title: "Tenryu-ji Zen Temple",
            description: "Explore this UNESCO World Heritage temple and its stunning rock gardens. The morning mist often adds mystical beauty to the landscape.",
            image: tenryuji,
            highlight: true,
            tourLink: true
        },
        {
            time: "10:30 AM",
            title: "Arashiyama District",
            description: "Wander through this historic area with mountain views. Visit Togetsukyo Bridge and browse traditional shops.",
            image: bridge,
            highlight: true,
            tourLink: true
        },
        {
            time: "11:30 AM",
            title: "Lunch Break",
            description: "",
            image: null,
            highlight: false,
            isDivider: true
        },

        {
            time: "",
            title: "Explore Historic Gion District",
            description: "",
            image: null,
            highlight: false,
            isGroupHeader: true
        },
        {
            time: "1:00 PM",
            title: "Yasaka Shrine",
            description: "Visit this vibrant shrine with its iconic red lanterns. The contrast of colors makes for stunning photography.",
            image: yasakaShrine,
            highlight: false,
            isGrouped: true
        },
        {
            time: "2:00 PM",
            title: "Ninenzaka & Sannenzaka",
            description: "Climb these historic stone-paved streets lined with traditional shops. Perfect for souvenir hunting and matcha treats.",
            image: yasakaPagoda,
            highlight: false,
            isGrouped: true
        },
        {
            time: "3:00 PM",
            title: "Kiyomizu-dera Temple",
            description: "Marvel at this wooden temple's famous stage offering panoramic city views. The afternoon light creates perfect photo conditions.",
            image: kiyomizu,
            highlight: false,
            isGrouped: true
        },
        {
            time: "6:00 PM",
            title: "Dinner in Pontocho Alley",
            description: "Dine in this narrow alley filled with traditional restaurants. Try kaiseki cuisine or yakitori while overlooking the Kamogawa River.",
            image: pontochoStreet,
            highlight: false
        },
        {
            time: "8:00 PM",
            title: "Rocking Bar ING",
            description: "End your night at this hidden dive bar in Pontocho. The friendly owner plays rock music while you enjoy drinks and play jenga!",
            image: rockingBar,
            highlight: false
        }
    ];

    return (
        <div id='app-container' className='w-full min-h-screen flex flex-col overflow-y-auto'>
            <SEO
                title={seoData.kyotoItinerary.title}
                description={seoData.kyotoItinerary.description}
                keywords={seoData.kyotoItinerary.keywords}
            />
            <Header />

            {/* Hero Section */}
            <div className='relative h-[60vh] bg-cover bg-center' style={{ backgroundImage: `url(${yasakaPagoda})` }}>
                <div className='absolute inset-0 bg-black bg-opacity-40'></div>
                <div className='relative z-10 h-full flex items-center justify-center text-center text-white px-4'>
                    <div className='max-w-4xl'>
                        <h1 className='text-4xl md:text-6xl font-bold mb-4'>Perfect 1 Day in Kyoto</h1>
                        <p className='text-xl md:text-2xl mb-8'>From ancient temples to hidden bars - your complete Kyoto guide</p>
                    </div>
                </div>
            </div>

            <div className='w-[95%] sm:w-4/5 md:w-3/4 mx-auto py-12'>
                {/* Introduction */}
                <div className='text-center mb-12'>
                    <h2 className='text-3xl font-bold text-gray-900 mb-4'>The Ultimate Kyoto Experience</h2>
                    <p className='text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed'>
                        Experience Kyoto's spiritual morning temples, historic geisha districts, and vibrant nightlife all in one perfect day.
                        This itinerary takes you from sacred bamboo groves to hidden bars in Pontocho.
                    </p>
                </div>

                {/* Itinerary Timeline */}
                <div className='space-y-8'>
                    {itineraryItems.map((item, index) => (
                        item.isDivider ? (
                            <div key={index} className='flex items-center justify-center py-8'>
                                <div className='flex items-center gap-4 text-gray-500'>
                                    <div className='h-px bg-gray-300 w-20'></div>
                                    <span className='text-lg font-semibold'>{item.title}</span>
                                    <div className='h-px bg-gray-300 w-20'></div>
                                </div>
                            </div>
                        ) : item.isGroupHeader ? (
                            <div key={index} className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg'>
                                <h3 className='text-xl font-bold text-blue-900 mb-2'>{item.title}</h3>
                                <p className='text-blue-700'>Walk through Kyoto's famous geisha district where traditional culture comes alive</p>
                            </div>
                        ) : (
                            <div className={`flex gap-6 ${item.isGrouped ? 'ml-4' : ''}`}>
                                {item.isGrouped && (
                                    <div className='w-1 bg-blue-500 rounded-full flex-shrink-0'></div>
                                )}
                                <div className={`flex flex-col md:flex-row gap-6 flex-1 ${item.highlight ? 'bg-red-50 p-6 rounded-lg border-l-4 border-red-500' : item.isGrouped ? 'bg-blue-50 p-4 rounded-lg' : 'p-4'}`}>
                                    <div className='md:w-1/3'>
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className='w-full h-48 md:h-32 object-cover rounded-lg shadow-md'
                                        />
                                    </div>
                                    <div className='md:w-2/3 flex flex-col justify-center'>
                                        <div className='flex items-center gap-4 mb-2'>
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${item.highlight ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                {item.time}
                                            </span>
                                            {item.highlight && (
                                                <span className='text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-semibold'>
                                                    GUIDED TOUR
                                                </span>
                                            )}
                                        </div>
                                        <h3 className='text-xl font-bold text-gray-900 mb-2'>{item.title}</h3>
                                        <p className='text-gray-600 leading-relaxed'>{item.description}</p>
                                        {item.tourLink && (
                                            <Link
                                                to="/tours/kyoto-early-bird-english-tour"
                                                className='text-red-600 hover:text-red-700 font-semibold mt-2 inline-block'
                                            >
                                                Included in our morning tour →
                                            </Link>
                                        )}

                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Guided Tour Option */}
                < div className='bg-red-50 border-l-4 border-red-500 p-8 mt-16 rounded-lg' >
                    <h2 className='text-2xl font-bold mb-4 text-gray-900'>Want a Local Guide for the Morning?</h2>
                    <p className='text-gray-700 mb-6'>
                        The morning portion of this itinerary (Fushimi Inari, Bamboo Grove, and Tenryu-ji) can be experienced with a knowledgeable English-speaking guide.
                        You'll learn fascinating history, avoid tourist traps, and get insider tips for the rest of your day.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 items-start'>
                        <Link
                            to="/tours/kyoto-early-bird-english-tour"
                            className='bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors'
                        >
                            Learn More About Our Morning Tour
                        </Link>
                        <div className='text-sm text-gray-600'>
                            <p>• Small groups (max {tourData?.['max-participants'] || 8} people)</p>
                            <p>• Free cancellation up to {tourData?.['cancellation-cutoff-hours'] || 24} hours</p>
                            <p>• ¥{tourData?.['tour-price'] || '4,500'} per person</p>
                        </div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className='mt-16'>
                    <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>Pro Tips for Your Kyoto Day</h2>
                    <div className='grid md:grid-cols-2 gap-8'>
                        <div className='bg-blue-50 p-6 rounded-lg'>
                            <h3 className='text-xl font-bold text-blue-900 mb-3'>🚇 Getting Around</h3>
                            <p className='text-blue-800'>
                                Get the SUICA or ICOCA cards to make train travel easier. If you have an iPhone you can get it on your wallet app for free.
                                These cards also work with buses and most vending machines throughout Japan.
                            </p>
                        </div>
                        <div className='bg-green-50 p-6 rounded-lg'>
                            <h3 className='text-xl font-bold text-green-900 mb-3'>📸 Photography</h3>
                            <p className='text-green-800'>
                                Early morning light is golden! The first few hours after sunrise give you the best photos
                                with soft, warm lighting and minimal crowds.
                            </p>
                        </div>
                        <div className='bg-purple-50 p-6 rounded-lg'>
                            <h3 className='text-xl font-bold text-purple-900 mb-3'>🍜 Food Timing</h3>
                            <p className='text-purple-800'>
                                Many traditional restaurants open late morning. Plan your breakfast after the tour,
                                and don't miss trying kaiseki dinner for an authentic experience.
                            </p>
                        </div>
                        <div className='bg-orange-50 p-6 rounded-lg'>
                            <h3 className='text-xl font-bold text-orange-900 mb-3'>👘 Cultural Respect</h3>
                            <p className='text-orange-800'>
                                Bow slightly when entering temples, don't touch artifacts, and keep voices low.
                                Your guide will teach you proper etiquette during the morning tour.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default KyotoItinerary;
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import { seoData } from '../data/seoData'
import { tourSchemas, breadcrumbSchemas } from '../data/schemaData'

//Import tour services
import { getTour } from '../services/toursService';

//Analytics
import { trackTourView } from '../services/analytics';

//SVG
import { ReactComponent as Location } from '../SVG/Location.svg'
import { ReactComponent as One } from '../SVG/One-circle.svg'
import { ReactComponent as Share } from '../SVG/Share.svg'
import { ReactComponent as FilledCircle } from '../SVG/FilledCircle.svg'
import { ReactComponent as InfoCircle } from '../SVG/info-circle.svg'
import { ReactComponent as ClockRewind } from '../SVG/clock-rewind.svg'

//Images
import photo1 from '../IMG/Music-Tour/1.webp'
import photo2 from '../IMG/Music-Tour/2.webp'
import photo3 from '../IMG/Music-Tour/3.webp'
import photo4 from '../IMG/Music-Tour/4.webp'
import photo5 from '../IMG/Music-Tour/5.webp'

//Custom Components
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import DatePicker from '../Components/DatePicker'
import ImageShowcase from '../Components/TourPages/ImageShowcase'

const MusicTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

    // Tour data state
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);

    // Load tour data from Supabase
    useEffect(() => {
        const loadTourData = async () => {
            try {
                setLoading(true);
                const data = await getTour('music-tour');
                if (data) {
                    setTourData(data);
                    console.log('✅ Music tour data loaded:', data);
                } else {
                    // Use default data if not found in database
                    console.log('⚠️ Music tour not found in database, using default data');
                    setTourData({
                        'tour-title': 'Kyoto Music Culture Walking Tour',
                        'tour-price': 5000,
                        'reviews': 0,
                        'time-slots': [],
                        'max-participants': 12,
                        'cancellation-cutoff-hours': 24,
                        'cancellation-cutoff-hours-with-participant': 24,
                        'specific-cutoff-times': {}
                    });
                }
            } catch (error) {
                console.error('❌ Failed to load music tour data:', error);
                // Use default data on error
                setTourData({
                    'tour-title': 'Kyoto Music Culture Walking Tour',
                    'tour-price': 5000,
                    'reviews': 0,
                    'time-slots': [],
                    'max-participants': 12,
                    'cancellation-cutoff-hours': 24,
                    'cancellation-cutoff-hours-with-participant': 24,
                    'specific-cutoff-times': {}
                });
            } finally {
                setLoading(false);
            }
        };

        loadTourData();
    }, []);

    // Analytics tracking - track tour view when tour data loads
    useEffect(() => {
        if (tourData) {
            trackTourView({
                tourId: 'music_tour',
                tourName: tourData['tour-title'],
                price: tourData['tour-price'],
                currency: 'JPY'
            });
        }
    }, [tourData]);

    //Mobile resizing logic
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [activeContent, setActiveContent] = useState(1);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShowSharePopup(true);
            setTimeout(() => setShowSharePopup(false), 2000); // Hide after 2 seconds
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div id='app-container' className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
                <Header />
                <div className='w-4/5 md:w-3/4 mx-auto flex justify-center items-center py-20'>
                    <div className='text-xl text-gray-600'>Loading tour information...</div>
                </div>
                <Footer />
            </div>
        );
    }

    // Show error state if tour data couldn't be loaded
    if (!tourData) {
        return (
            <div id='app-container' className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
                <Header />
                <div className='w-4/5 md:w-3/4 mx-auto flex justify-center items-center py-20'>
                    <div className='text-xl text-red-600'>Unable to load tour information. Please try again later.</div>
                </div>
                <Footer />
            </div>
        );
    }

    // Extract tour data
    const tourTitle = tourData['tour-title'];
    const tourPrice = tourData['tour-price'];
    const tourReviews = tourData['reviews'];
    const availableTimes = tourData['time-slots'];
    const maxSlots = tourData['max-participants'];
    return (
        <div id='app-container' className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
            <SEO
                title="Kyoto Music Culture Walking Tour | Traditional & Modern Music Experience"
                description="Discover Kyoto's rich musical heritage on this immersive walking tour. Experience traditional Japanese music, visit historic venues, and learn about the city's musical culture."
                keywords="Kyoto music tour, traditional Japanese music, cultural tour, music walking tour, Kyoto entertainment"
                image="/IMG/Music-Tour/1.webp"
            />

            {/* Structured Data */}
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

            <Header />
            <div className='w-[95%] sm:w-4/5 md:w-3/4 mx-auto flex flex-col text-gray-700 mt-6 sm:mt-12'>
                <div className='mb-6 sm:mb-8'>
                    <div className='flex flex-col md:flex-row justify-between items-start gap-4 md:gap-10'>
                        <div className='flex-1'>
                            <h1 className='text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold break-words mb-4 text-gray-900 tracking-tight font-sans leading-tight'>{tourTitle}</h1>
                            <div className='flex flex-col gap-2'>
                                <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xl font-semibold'>5.0</span>
                                        <div className='flex items-center'>
                                            {[...Array(5)].map((_, i) => (
                                                <FilledCircle key={i} className='w-4 h-4 text-green-500' />
                                            ))}
                                        </div>
                                        <span className='text-gray-600'>({tourReviews} reviews)</span>
                                        <a
                                            href="https://www.tripadvisor.com/UserReviewEdit-g298564-d28033450"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className='text-gray-600 underline hover:text-blue-600 ml-2'
                                        >
                                            Write a review
                                        </a>
                                    </div>
                                </div>
                                <div className='flex items-center justify-between gap-2'>
                                    <div className='flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md'>
                                        <span className='text-red-500'>♥</span>
                                        <span className='text-sm'>Recommended by 100% of travelers</span>
                                        <div className="relative">
                                            <InfoCircle
                                                className='w-4 h-4 text-gray-400 cursor-default ml-1'
                                                onMouseEnter={() => setShowInfoTooltip(true)}
                                                onMouseLeave={() => setShowInfoTooltip(false)}
                                            />
                                            {showInfoTooltip && (
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-sm py-2 px-3 rounded shadow-lg whitespace-nowrap z-10">
                                                    Based on reviews from verified customers on TripAdvisor
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleShare}
                                        className='flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md text-gray-700 hover:bg-blue-100 transition-colors relative ml-auto'
                                    >
                                        <Share className='w-4 h-4' />
                                        <span className='font-ubuntu text-sm'>Share</span>
                                        {showSharePopup && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-sm py-2 px-3 rounded shadow-lg whitespace-nowrap">
                                                Link copied to clipboard
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ImageShowcase isMobile={isMobile} images={images} />

                {/* Mobile DatePicker - appears after image, before nav tabs */}
                {isMobile && (
                    <div className="mt-6">
                        <DatePicker
                            className="h-fit"
                            tourName={tourTitle}
                            maxSlots={maxSlots}
                            availableTimes={availableTimes}
                            sheetId="MUSIC_TOUR"
                            price={tourPrice}
                            cancellationCutoffHours={tourData['cancellation-cutoff-hours']}
                            cancellationCutoffHoursWithParticipant={tourData['cancellation-cutoff-hours-with-participant']}
                            specificCutoffTimes={tourData['specific-cutoff-times']}
                        />
                    </div>
                )}

                <div className='body w-full flex flex-col lg:flex-row gap-6 mt-8 sm:mt-12'>
                    <div className='lg:basis-3/5'>
                        <div className='flex flex-col-reverse md:flex-row'>
                            <div className='w-full'>
                                <div className='flex font-roboto font-semibold border-b border-gray-300'>
                                    {activeContent === 1 ?
                                        <button className='px-4 py-2 border-b-2 border-gray-900 text-gray-900'>Overview</button> :
                                        <button className='px-4 py-2 text-gray-500' onClick={() => setActiveContent(1)}>
                                            Overview
                                        </button>}
                                    {activeContent === 2 ?
                                        <button className='px-4 py-2 border-b-2 border-gray-900 text-gray-900'>Details</button> :
                                        <button className='px-4 py-2 text-gray-500' onClick={() => setActiveContent(2)}>
                                            Details
                                        </button>}
                                    {activeContent === 3 ?
                                        <button className='px-4 py-2 border-b-2 border-gray-900 text-gray-900'>Itinerary</button> :
                                        <button className='px-4 py-2 text-gray-500' onClick={() => setActiveContent(3)}>
                                            Itinerary
                                        </button>}
                                    {activeContent === 4 ?
                                        <button className='px-4 py-2 border-b-2 border-gray-900 text-gray-900'>Meeting Point</button> :
                                        <button className='px-4 py-2 text-gray-500' onClick={() => setActiveContent(4)}>
                                            Meeting Point
                                        </button>}
                                </div>
                                {activeContent === 1 &&
                                    <div className='font-ubuntu flex flex-col gap-6 mt-8'>
                                        <div className="px-4 space-y-6">
                                            <p>Join us for an enchanting musical journey through Kyoto's rich cultural heritage. Discover the sounds that have shaped this ancient city for over a thousand years.</p>

                                            <p>⚠️ This tour includes visits to traditional music venues and may include live performances depending on availability.</p>

                                            <p>⚠️ Prior to the tour, please ensure WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.</p>

                                            <p>✅ This is an English Guided Walking Tour. Explore the musical traditions and cultural significance of Kyoto's soundscape with a knowledgeable and passionate guide.</p>

                                            <p>✅ A Unique Cultural Experience: Immerse yourself in traditional Japanese music, from ancient court music to folk songs and modern interpretations.</p>

                                            <p>✅ Historic Music Venues: Visit traditional tea houses, temples, and cultural centers where music has been performed for centuries.</p>

                                            <p className="text-gray-600 italic">*This tour focuses on cultural appreciation and may include opportunities to try traditional instruments.</p>
                                        </div>

                                        <div className="flex items-center gap-2 bg-gray-100 p-4 rounded-lg mx-4">
                                            <ClockRewind className="w-5 h-5 text-amber-600" />
                                            <div>
                                                <Link to="/cancellation-policy" className="font-bold text-blue-600 hover:underline">Free cancellation</Link>
                                                <span className="text-gray-600"> • Full refund if cancelled up to 24 hours before the experience starts (local time).</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                                {activeContent === 2 &&
                                    <div className='font-ubuntu flex flex-col gap-8 mt-8 text-gray-700'>
                                        <div className="px-4 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                                </svg>
                                                <span>Ages 0-90, max of 12 per group</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <span>Duration: 2-2.5 hours</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <span>Start time: Check availability</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                </svg>
                                                <span>Live guide: English</span>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-gray-300" />

                                        <div className="space-y-8 px-4">
                                            <div>
                                                <h3 className="text-lg font-bold mb-3">What's included</h3>
                                                <ul className="space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-600 mt-1">✓</span>
                                                        <span>English Speaking Guide</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-600 mt-1">✓</span>
                                                        <span>Cultural Music Experience</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-600 mt-1">✓</span>
                                                        <span>Traditional Instrument Demonstration</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold mb-3">What's not included</h3>
                                                <ul className="space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-red-600 mt-1">✗</span>
                                                        <span>Public Transportation Fare (300 yen)</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-red-600 mt-1">✗</span>
                                                        <span>Food and Beverages</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="w-full h-px bg-gray-300" />

                                            <div>
                                                <h3 className="text-lg font-bold mb-3">Accessibility</h3>
                                                <ul className="space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-gray-600 mt-1">•</span>
                                                        <span>Not wheelchair accessible</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-gray-600 mt-1">•</span>
                                                        <span>Service animals allowed</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-gray-600 mt-1">•</span>
                                                        <span>Near public transportation</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                }
                                {activeContent === 3 &&
                                    <div className='font-ubuntu mt-8 flex flex-row gap-1 w-full'>
                                        <div className='w-10 h-full flex flex-col justify-between items-center'>
                                            {Array.from({ length: 7 }).map((_, i) => (
                                                <p key={i}>•</p>
                                            ))}
                                        </div>
                                        <div className='flex flex-col gap-8 basis-11/12 font-roboto'>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>You'll start at</h4>
                                                <p>7-Eleven Heart-in - JR Kyoto Station Central Entrance Store</p>
                                                <a
                                                    href='https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9' target='_blank' rel="noopener noreferrer"
                                                    className='font-semibold underline'
                                                >Open Google Maps</a>
                                                <Location className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Gion District Music Heritage Walk</h4>
                                                <p>Stop: 45 minutes - Explore traditional tea houses and geisha districts</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Traditional Music Venue</h4>
                                                <p>Stop: 30 minutes - Experience live traditional music performance</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Instrument Workshop</h4>
                                                <p>Stop: 30 minutes - Try traditional Japanese instruments</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible font-bold'>
                                                <h4>You'll return to the starting point</h4>
                                                <Location className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                        </div>
                                    </div>
                                }
                                {activeContent === 4 &&
                                    <div className='font-roboto mt-8'>
                                        <div className="px-4 space-y-4">
                                            <p>7-Eleven.Heart-In JR Kyoto Station Central Entrance Store</p>
                                            <a
                                                href='https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9' target='_blank' rel="noopener noreferrer"
                                                className='font-semibold underline'
                                            >Open Google Maps</a>
                                            <p className='mt-4'>Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.</p>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                    {/* Desktop DatePicker - sidebar position */}
                    {!isMobile && (
                        <div className="lg:basis-2/5 flex-none">
                            <DatePicker
                                className="h-fit"
                                tourName={tourTitle}
                                maxSlots={maxSlots}
                                availableTimes={availableTimes}
                                sheetId="MUSIC_TOUR"
                                price={tourPrice}
                                cancellationCutoffHours={tourData['cancellation-cutoff-hours']}
                                cancellationCutoffHoursWithParticipant={tourData['cancellation-cutoff-hours-with-participant']}
                                specificCutoffTimes={tourData['specific-cutoff-times']}
                            />
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default MusicTour
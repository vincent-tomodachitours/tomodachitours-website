import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

//Import tour services
import { getTour } from '../services/toursService';

//SVG
import { ReactComponent as Location } from '../SVG/Location.svg'
import { ReactComponent as One } from '../SVG/One-circle.svg'
import { ReactComponent as Two } from '../SVG/Two-circle.svg'
import { ReactComponent as Three } from '../SVG/Three-circle.svg'
import { ReactComponent as Four } from '../SVG/Four-circle.svg'
import { ReactComponent as Five } from '../SVG/Five-circle.svg'
import { ReactComponent as Share } from '../SVG/Share.svg'
import { ReactComponent as FilledCircle } from '../SVG/FilledCircle.svg'
import { ReactComponent as InfoCircle } from '../SVG/info-circle.svg'
import { ReactComponent as ClockRewind } from '../SVG/clock-rewind.svg'

//Images
import photo1 from '../IMG/Morning-Tour/IMG_7260 2.webp'
import photo2 from '../IMG/Morning-Tour/arashiyama1.webp'
import photo3 from '../IMG/Morning-Tour/tenryuji.webp'
import photo4 from '../IMG/Morning-Tour/bridgelong.webp'
import photo5 from '../IMG/Morning-Tour/small-gates.webp'

//Custom Components
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import DatePicker from '../Components/DatePicker'
import ImageShowcase from '../Components/TourPages/ImageShowcase'

const MorningTour = () => {
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
                const data = await getTour('morning-tour');
                setTourData(data);
                console.log('✅ Morning tour data loaded:', data);
            } catch (error) {
                console.error('❌ Failed to load morning tour data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTourData();
    }, []);

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
    const tourDuration = tourData['tour-duration'];
    const tourReviews = tourData['reviews'];
    const availableTimes = tourData['time-slots'];
    const maxSlots = tourData['max-participants'];
    return (
        <div id='app-container' className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
            <Header />
            <div className='w-4/5 md:w-3/4 mx-auto flex flex-col text-gray-700 mt-12'>
                <div className='mb-8'>
                    <div className='flex flex-col md:flex-row justify-between items-start gap-4 md:gap-10'>
                        <div className='flex-1'>
                            <h1 className='text-4xl md:text-[2.5rem] font-extrabold break-words mb-4 text-gray-900 tracking-tight font-sans'>{tourTitle}</h1>
                            <div className='flex flex-col gap-2'>
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
                                        className='text-gray-600 underline ml-2 hover:text-blue-600'
                                    >
                                        Write a review
                                    </a>
                                    <div className='flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md ml-2'>
                                        <span className='text-red-500'>♥</span>
                                        <span>Recommended by 100% of travelers</span>
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
                                </div>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={handleShare}
                                className='flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-md text-gray-700 hover:bg-blue-100 transition-colors relative'
                            >
                                <Share className='w-5 h-5' />
                                <span className='font-ubuntu'>Share</span>
                                {showSharePopup && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-sm py-2 px-3 rounded shadow-lg whitespace-nowrap">
                                        Link copied to clipboard
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <ImageShowcase isMobile={isMobile} images={images} />
                <div className='body w-full flex flex-col lg:flex-row gap-6 mt-12'>
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
                                            <p>Early morning is the key to avoid the crowds during peak tourist seasons! Hit three of the top historical attractions, Fushimi-Inari Shrine, Bamboo Grove, and Tenryu-ji Temple with our English speaking tour guide!</p>

                                            <p>⚠️ Prior to the tour, please ensure that WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.</p>

                                            <p>⚠️ Please note: The earlier the start time, the fewer crowds we will encounter—if you value a peaceful, uncrowded experience, we recommend booking the earliest time slots available.</p>

                                            <p>✅ This is an English Guided Walking Tour which requires about 9,000 steps. We will use public transportation to visit each location(transportation fee NOT included).</p>

                                            <p>✅ Visit Three Highlights, Fushimi-Inari-Shrine, Arashiyama Bamboo Groove, Tenryu-ji Zen-Buddhism Temple.</p>

                                            <p>✅ Learn about the rich history of each location with our friendly and knowledgeable guide.</p>

                                            <p>✅ Receive travel tips and good restaurant recommendations from our guide.</p>
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
                                                <span>Ages 0-90, max of {maxSlots} per group</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <span>Duration: {tourDuration} minutes</span>
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
                                                        <span>Approximately {tourDuration} Minutes</span>
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
                                            {Array.from({ length: 20 }).map((_, i) => (
                                                <p key={i}>•</p>
                                            ))}
                                        </div>
                                        <div className='flex flex-col gap-6 basis-11/12 font-roboto'>
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
                                                <h4 className='font-bold'>Fushimi Inari Taisha Shrine</h4>
                                                <p>Stop: 90 minutes</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Bamboo Forest Street</h4>
                                                <p>Stop: 60 minutes</p>
                                                <Two className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Tenryu-ji Temple</h4>
                                                <p>Stop: 60 minutes</p>
                                                <Three className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Arashiyama Kimono Forest</h4>
                                                <p>Stop: 15 minutes</p>
                                                <Four className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Togetsukyo Bridge</h4>
                                                <p>Stop: 15 minutes</p>
                                                <Five className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
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
                    {!isMobile ?
                        <div className="lg:basis-2/5 flex-none">
                            <DatePicker
                                className="h-fit"
                                tourName={tourTitle}
                                maxSlots={maxSlots}
                                availableTimes={availableTimes}
                                sheetId="MORNING_TOUR"
                                price={tourPrice}
                                cancellationCutoffHours={tourData['cancellation-cutoff-hours']}
                                cancellationCutoffHoursWithParticipant={tourData['cancellation-cutoff-hours-with-participant']}
                                nextDayCutoffTime={tourData['next-day-cutoff-time']}
                            />
                        </div>
                        : null
                    }
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default MorningTour
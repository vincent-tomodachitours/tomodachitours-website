import React, { useEffect, useState } from 'react';
import Header from '../Headers/Header1';
import Footer from '../Footer';
import DatePicker from '../DatePicker';
import ImageShowcase from './ImageShowcase';
import TripAdvisorReviews from '../TripAdvisorReviews';
import TourHeader from './TourHeader';
import TourTabs from './TourTabs';
import TourOverview from './TourOverview';
import TourDetails from './TourDetails';
import TourItinerary from './TourItinerary';
import TourMeetingPoint from './TourMeetingPoint';
import { useCurrency } from '../../hooks/useCurrency';

// Import tour services
import { getTour, clearToursCache } from '../../services/toursService';

// Analytics
import { trackTourView, trackTourTabClick } from '../../services/analytics';
import attributionService from '../../services/attributionService';
import gtmService from '../../services/gtmService';

const BaseTourPage = ({
    tourId,
    images,
    overviewContent,
    tourDetails,
    itineraryStops,
    meetingPointData,
    SEOComponent,
    StructuredDataComponent,
    showReviews = true,
    customHeaderMessage = null
}) => {
    // Tour data state
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);

    // Get USD conversion for mobile button (using tourData price when available)
    const tourPrice = tourData?.['tour-price'] || 0;
    const originalPrice = tourData?.['original-price'] || null;
    const { usdAmount } = useCurrency(tourPrice);

    // Load tour data from Supabase
    useEffect(() => {
        // Initialize attribution tracking for UTM parameters
        attributionService.initialize();

        const loadTourData = async () => {
            try {
                setLoading(true);
                // Clear cache to ensure we get fresh data
                clearToursCache();
                const data = await getTour(tourId);
                setTourData(data);
                console.log(`✅ ${tourId} tour data loaded:`, data);
                console.log('Tour duration from API:', data['tour-duration']);

                // Track tour page view with attribution
                trackTourView({
                    tourId: tourId,
                    tourName: data['tour-title'],
                    price: data['tour-price']
                });
            } catch (error) {
                console.error(`❌ Failed to load ${tourId} tour data:`, error);
            } finally {
                setLoading(false);
            }
        };

        loadTourData();
    }, [tourId]);

    // Mobile resizing logic
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
            // Update content expansion based on screen size
            setIsContentExpanded(!newIsMobile);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [activeContent, setActiveContent] = useState(1);
    const [isContentExpanded, setIsContentExpanded] = useState(!isMobile); // Expanded by default on desktop
    const [showBookButton, setShowBookButton] = useState(true);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShowSharePopup(true);
            setTimeout(() => setShowSharePopup(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const scrollToBooking = () => {
        // Track begin_checkout when mobile Book Now button is clicked
        if (tourData) {
            try {
                // Prepare checkout data for tracking
                const checkoutData = {
                    tourData: {
                        tourId: tourData.id,
                        tourName: tourData.name,
                        price: tourData.price,
                        currency: 'JPY',
                        category: tourData.category || 'tour'
                    },
                    value: tourData.price,
                    currency: 'JPY',
                    items: [{
                        item_id: tourData.id,
                        item_name: tourData.name,
                        category: tourData.category || 'tour',
                        quantity: 1,
                        price: tourData.price
                    }]
                };

                // Track begin_checkout conversion
                gtmService.trackBeginCheckoutConversion(checkoutData);

                console.log('Begin checkout tracked for mobile Book Now button:', tourData.name);
            } catch (error) {
                console.warn('Failed to track begin_checkout for mobile Book Now button:', error);
            }
        }

        // Scroll to booking section
        const bookingElement = document.getElementById('mobile-booking-section');
        if (bookingElement) {
            bookingElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Intersection Observer to hide/show book button when DatePicker is visible
    useEffect(() => {
        if (!isMobile) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target.id === 'mobile-booking-section') {
                        // Hide button when DatePicker section is visible
                        setShowBookButton(!entry.isIntersecting);
                    }
                });
            },
            {
                threshold: 0.1, // Trigger when 10% of the element is visible
                rootMargin: '0px 0px -100px 0px' // Hide button a bit before reaching the section
            }
        );

        const bookingSection = document.getElementById('mobile-booking-section');
        if (bookingSection) {
            observer.observe(bookingSection);
        }

        return () => {
            if (bookingSection) {
                observer.unobserve(bookingSection);
            }
        };
    }, [isMobile, tourData]); // Re-run when mobile state or tour data changes

    // Show loading state
    if (loading) {
        return (
            <div id="app-container" className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
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
            <div id="app-container" className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
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
    const tourDescription = tourData['tour-description'];
    const tourDuration = tourId === 'music-tour' ? '4 hours' : tourData['tour-duration'];
    const tourReviews = tourData['reviews'];
    const availableTimes = tourData['time-slots'];
    const maxSlots = tourData['max-participants'];
    const cancellationCutoffHours = tourData['cancellation-cutoff-hours'];
    const cancellationCutoffHoursWithParticipant = tourData['cancellation-cutoff-hours-with-participant'];
    const nextDayCutoffTime = tourData['next-day-cutoff-time'];
    const apiMeetingPoint = tourData['meeting-point'];

    console.log('Final tourDuration for', tourId, ':', tourDuration);
    console.log('API meeting point for', tourId, ':', apiMeetingPoint, 'type:', typeof apiMeetingPoint);

    // Use API description if available, otherwise fall back to provided overviewContent
    const finalOverviewContent = tourDescription
        ? tourDescription.split('✅').map(part => part.trim()).filter(part => part.length > 0).map((part, index) => {
            // Add back the ✅ symbol for all parts except the first one (which is the intro)
            return index === 0 ? part : `✅ ${part}`;
        })
        : overviewContent;

    // Use API meeting point if available, otherwise fall back to provided meetingPointData
    let finalMeetingPointData = meetingPointData;

    if (apiMeetingPoint) {
        try {
            let locationText = "";

            if (typeof apiMeetingPoint === 'string') {
                locationText = apiMeetingPoint;
            } else if (typeof apiMeetingPoint === 'object' && apiMeetingPoint !== null) {
                locationText = apiMeetingPoint.location || apiMeetingPoint.name || JSON.stringify(apiMeetingPoint);
            }

            finalMeetingPointData = {
                location: locationText,
                googleMapsUrl: meetingPointData?.googleMapsUrl || "",
                instructions: meetingPointData?.instructions || ""
            };
        } catch (error) {
            console.error('Error processing meeting point data:', error);
            finalMeetingPointData = meetingPointData;
        }
    }

    return (
        <div id="app-container" className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
            {SEOComponent}
            {StructuredDataComponent}

            <Header />
            <div className='w-[95%] sm:w-4/5 md:w-3/4 mx-auto flex flex-col text-gray-700 mt-6 sm:mt-12'>
                <TourHeader
                    tourTitle={tourTitle}
                    tourReviews={tourReviews}
                    showSharePopup={showSharePopup}
                    showInfoTooltip={showInfoTooltip}
                    setShowInfoTooltip={setShowInfoTooltip}
                    handleShare={handleShare}
                    customMessage={customHeaderMessage}
                />

                <ImageShowcase
                    isMobile={isMobile}
                    images={images}
                    tourId={tourId}
                    tourName={tourTitle}
                />

                {/* Small Group Tour Section - Mobile Only */}
                {isMobile && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mx-2 mt-6 shadow-sm">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-lg font-bold text-green-800">Small Group Tour!</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-green-700 font-medium">
                                Max group size {maxSlots}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                                Enjoy a more personal and intimate experience
                            </p>
                        </div>
                    </div>
                )}

                <div className='body w-full flex flex-col lg:flex-row gap-6 mt-8 sm:mt-12'>
                    <div className='lg:basis-3/5'>
                        <div className='flex flex-col-reverse md:flex-row'>
                            <div className='w-full'>
                                <TourTabs
                                    activeContent={activeContent}
                                    setActiveContent={setActiveContent}
                                    tourId={tourId}
                                    tourTitle={tourTitle}
                                    trackTourTabClick={trackTourTabClick}
                                />

                                {activeContent === 1 && (
                                    <TourOverview
                                        content={finalOverviewContent}
                                        isExpanded={isContentExpanded}
                                        setIsExpanded={setIsContentExpanded}
                                        isMobile={isMobile}
                                    />
                                )}

                                {activeContent === 2 && (
                                    <TourDetails
                                        maxSlots={maxSlots}
                                        tourDuration={tourDuration}
                                        included={tourDetails.included}
                                        notIncluded={tourDetails.notIncluded}
                                        accessibility={tourDetails.accessibility}
                                        isExpanded={isContentExpanded}
                                        setIsExpanded={setIsContentExpanded}
                                        isMobile={isMobile}
                                    />
                                )}
                                {activeContent === 2 && console.log('TourDetails props:', { maxSlots, tourDuration, tourId })}

                                {activeContent === 3 && (
                                    <TourItinerary
                                        stops={itineraryStops}
                                        meetingPoint={finalMeetingPointData}
                                        isExpanded={isContentExpanded}
                                        setIsExpanded={setIsContentExpanded}
                                        isMobile={isMobile}
                                    />
                                )}

                                {activeContent === 4 && (
                                    <TourMeetingPoint
                                        meetingPoint={finalMeetingPointData}
                                        isExpanded={isContentExpanded}
                                        setIsExpanded={setIsContentExpanded}
                                        isMobile={isMobile}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop DatePicker - sidebar position */}
                    {!isMobile && (
                        <div className="lg:basis-2/5 flex-none">
                            {/* Small Group Tour Section - Desktop */}
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6 shadow-sm">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <h3 className="text-lg font-bold text-green-800">Small Group Tour!</h3>
                                </div>
                                <div className="text-center">
                                    <p className="text-green-700 font-medium">
                                        Max group size {maxSlots}
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">
                                        Enjoy a more personal and intimate experience
                                    </p>
                                </div>
                            </div>

                            <DatePicker
                                className="h-fit"
                                tourName={tourTitle}
                                sheetId={tourId}
                                price={tourPrice}
                                originalPrice={originalPrice}
                                availableTimes={availableTimes}
                                maxSlots={maxSlots}
                                cancellationCutoffHours={cancellationCutoffHours}
                                cancellationCutoffHoursWithParticipant={cancellationCutoffHoursWithParticipant}
                                nextDayCutoffTime={nextDayCutoffTime}
                            />
                        </div>
                    )}
                </div>

                {/* Customer Reviews Section */}
                {showReviews && (
                    <div className="mt-16 mb-12">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                See what our guests say about their tour experience
                            </p>
                        </div>
                        <TripAdvisorReviews
                            locationId={process.env.REACT_APP_TRIPADVISOR_LOCATION_ID}
                            maxReviews={6}
                            showRating={true}
                            layout="grid"
                            className="px-4"
                            showAttribution={true}
                            tourId={tourId}
                            tourReviewCount={tourReviews}
                        />
                    </div>
                )}

                {/* Mobile DatePicker - appears at bottom after reviews */}
                {isMobile && (
                    <div id="mobile-booking-section" className="mt-8 mb-12">
                        <DatePicker
                            className="h-fit"
                            tourName={tourTitle}
                            sheetId={tourId}
                            price={tourPrice}
                            originalPrice={originalPrice}
                            availableTimes={availableTimes}
                            maxSlots={maxSlots}
                            cancellationCutoffHours={cancellationCutoffHours}
                            cancellationCutoffHoursWithParticipant={cancellationCutoffHoursWithParticipant}
                            nextDayCutoffTime={nextDayCutoffTime}
                        />
                    </div>
                )}

                {/* Fixed Mobile Book Now Button */}
                {isMobile && (
                    <div
                        className={`mobile-book-now-button fixed bottom-4 left-4 right-4 z-40 transition-all duration-500 ease-in-out ${showBookButton
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-full opacity-0 pointer-events-none'
                            }`}
                    >
                        <button
                            onClick={scrollToBooking}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                        >
                            <span className="text-lg">Book Now:</span>
                            {originalPrice && originalPrice !== tourPrice && (
                                <>
                                    <span className="text-base font-medium text-blue-200 line-through decoration-red-400 decoration-2">
                                        ¥{originalPrice.toLocaleString('en-US')}
                                    </span>
                                    <span className="text-lg">→</span>
                                </>
                            )}
                            <span className="text-xl font-bold">¥{tourPrice}</span>
                            {usdAmount && (
                                <span className="text-sm font-semibold text-blue-100">({usdAmount})</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default BaseTourPage;
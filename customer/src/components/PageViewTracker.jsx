import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getShouldTrack } from '../services/analytics/config.js';

/**
 * PageViewTracker Component
 * Automatically tracks page views for React Router navigation
 * Integrates with both GTM and direct GA4 tracking
 */
function PageViewTracker() {
    const location = useLocation();

    useEffect(() => {
        // Only track if analytics consent is given
        if (!getShouldTrack()) {
            return;
        }

        // Get page title - use document.title or generate from pathname
        const pageTitle = document.title || generatePageTitle(location.pathname);

        // Construct full page path including search params
        const pagePath = location.pathname + location.search;

        // Track page view via GTM dataLayer (primary method)
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'page_view',
                page_path: pagePath,
                page_title: pageTitle,
                page_location: window.location.href,
                page_referrer: document.referrer || '',
                timestamp: Date.now()
            });
        }

        // Track page view via direct GA4 gtag (fallback/parallel tracking)
        if (window.gtag) {
            window.gtag('config', 'G-5GVJBRE1SY', {
                page_path: pagePath,
                page_title: pageTitle,
                page_location: window.location.href
            });
        }

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Page view tracked:', {
                path: pagePath,
                title: pageTitle,
                location: window.location.href
            });
        }

    }, [location.pathname, location.search]);

    return null; // This component doesn't render anything
}

/**
 * Generate a readable page title from pathname if document.title is not set
 */
function generatePageTitle(pathname) {
    // Map of routes to readable titles
    const routeTitles = {
        '/': 'Home - Tomodachi Tours',
        '/tours/kyoto-fushimi-inari-night-walking-tour': 'Fushimi Inari Night Tour - Tomodachi Tours',
        '/tours/kyoto-music-culture-walking-tour': 'Music Culture Tour - Tomodachi Tours',
        '/tours/kyoto-early-bird-english-tour': 'Early Bird Morning Tour - Tomodachi Tours',
        '/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto': 'Uji Matcha Tour - Tomodachi Tours',
        '/tours/uji-walking-tour': 'Uji Walking Tour - Tomodachi Tours',
        '/tours/kyoto-gion-early-morning-walking-tour': 'Gion Morning Tour - Tomodachi Tours',
        '/kyoto-itinerary': 'Kyoto Itinerary - Tomodachi Tours',
        '/about': 'About Us - Tomodachi Tours',
        '/recommendations': 'Recommendations - Tomodachi Tours',
        '/jobs': 'Jobs - Tomodachi Tours',
        '/cancellation-policy': 'Cancellation Policy - Tomodachi Tours',
        '/privacy-policy': 'Privacy Policy - Tomodachi Tours',
        '/terms-of-service': 'Terms of Service - Tomodachi Tours',
        '/cancel-booking': 'Cancel Booking - Tomodachi Tours',
        '/commercial-disclosure': 'Commercial Disclosure - Tomodachi Tours',
        '/thankyou': 'Thank You - Tomodachi Tours'
    };

    return routeTitles[pathname] || `${pathname} - Tomodachi Tours`;
}

export default PageViewTracker;
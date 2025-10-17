import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NightTour from './Pages/NightTour';

import Home from './Pages/Home';
import UITest from './Pages/UITest';
import CancellationPolicy from './Pages/CancellationPolicy';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from './Pages/TermsOfService';
import About from './Pages/About';
import MorningTour from './Pages/MorningTour';
import UjiTour from './Pages/UjiTour';
import UjiWalkingTour from './Pages/UjiWalkingTour';
import ScrollToTop from './Components/ScrollToTop';
import GionTour from './Pages/GionTour';
import CommercialDisclosure from './Pages/CommercialDisclosure';
import Recommendations from './Pages/Recommendations';
import RecommendationsUITest from './Pages/RecommendationsUITest';
import Thankyou from './Pages/Thankyou';
import BookingCancellation from './Components/BookingCancellation';
import PerformanceOptimizer from './components/PerformanceOptimizer';
import PageViewTracker from './components/PageViewTracker';
import Login from './components/Login';
import Jobs from './Pages/Jobs';
import { initializeAnalytics } from './services/analytics';
import MusicTour from './Pages/MusicTour';
import LiveMusicPerformance from './Pages/LiveMusicPerformance';
import KyotoItinerary from './Pages/KyotoItinerary';

// Load development helpers in development mode
if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_MODE === 'true') {
    import('./utils/devHelpers');
}

const App: React.FC = () => {
    // Initialize Google Analytics 4
    React.useEffect(() => {
        initializeAnalytics();
    }, []);

    return (
        <Router>
            <PerformanceOptimizer />
            <PageViewTracker />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ui-test" element={<UITest />} />
                {/* <Route path="/tours" element={<Tours />} /> */}
                <Route path="/tours/kyoto-fushimi-inari-night-walking-tour" element={<NightTour />} />
                {/* Redirect for typo in URL */}
                <Route path="/kyoto-fushimi-inari-night-walking-tourit" element={<Navigate to="/tours/kyoto-fushimi-inari-night-walking-tour" replace />} />
                <Route path="/tours/kyoto-music-culture-walking-tour" element={<MusicTour />} />
                <Route path="/tours/kyoto-live-music-performance" element={<LiveMusicPerformance />} />
                <Route path="/music" element={<Navigate to="/tours/kyoto-live-music-performance" replace />} />
                <Route path="/tours/kyoto-early-bird-english-tour" element={<MorningTour />} />
                <Route path="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto" element={<UjiTour />} />
                <Route path="/tours/uji-walking-tour" element={<UjiWalkingTour />} />
                <Route path="/tours/kyoto-gion-early-morning-walking-tour" element={<GionTour />} />
                <Route path="/kyoto-itinerary" element={<KyotoItinerary />} />
                <Route path="/about" element={<About />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="/recommendations-ui-test" element={<RecommendationsUITest />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cancel-booking" element={<BookingCancellation />} />
                <Route path="/commercial-disclosure" element={<CommercialDisclosure />} />
                <Route path="/thankyou" element={<Thankyou />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
};

export default App;
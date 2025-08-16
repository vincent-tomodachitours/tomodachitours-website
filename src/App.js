import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NightTour from './Pages/NightTour';
import Home from './Pages/Home';
import CancellationPolicy from './Pages/CancellationPolicy';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from './Pages/TermsOfService';
import About from './Pages/About';
import MorningTour from './Pages/MorningTour';
import UjiTour from './Pages/UjiTour';
import ScrollToTop from './Components/ScrollToTop';
import GionTour from './Pages/GionTour';
import CommercialDisclosure from './Pages/CommercialDisclosure';
import Recommendations from './Pages/Recommendations';
import Thankyou from './Pages/Thankyou';
import BookingCancellation from './Components/BookingCancellation';
import Login from './components/Login';
import Jobs from './Pages/Jobs';

// Import analytics service to make test functions available
import analytics from './services/analytics';
import { useEffect } from 'react';

function App() {
  // Make test functions available globally
  useEffect(() => {
    // Simple test functions that work directly
    window.testAnalytics = {
      testSetup: () => {
        console.log('🧪 Testing Analytics Setup...');
        console.log('- gtag available:', typeof window.gtag);
        console.log('- GA4 ID:', process.env.REACT_APP_GA_MEASUREMENT_ID);
        console.log('- Google Ads ID:', process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID);
        console.log('- Analytics enabled:', process.env.REACT_APP_ENABLE_ANALYTICS);
        return typeof window.gtag === 'function';
      },

      testTourView: () => {
        console.log('🧪 Testing Tour View...');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'view_item', {
            currency: 'JPY',
            value: 5000,
            items: [{
              item_id: 'test_tour',
              item_name: 'Test Tour View',
              category: 'Tour',
              price: 5000,
              quantity: 1
            }]
          });
          console.log('✅ Tour view event sent');
        } else {
          console.log('❌ gtag not available');
        }
      },

      testPurchase: () => {
        console.log('🧪 Testing Purchase...');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'purchase', {
            transaction_id: `test_${Date.now()}`,
            currency: 'JPY',
            value: 5000,
            items: [{
              item_id: 'test_tour',
              item_name: 'Test Purchase',
              category: 'Tour',
              price: 5000,
              quantity: 1
            }]
          });
          console.log('✅ Purchase event sent');
        } else {
          console.log('❌ gtag not available');
        }
      },

      runAllTests: () => {
        console.log('🚀 Running All Tests...');
        window.testAnalytics.testSetup();
        setTimeout(() => window.testAnalytics.testTourView(), 1000);
        setTimeout(() => window.testAnalytics.testPurchase(), 2000);
        console.log('✅ Tests completed - check GA4 Realtime reports');
      }
    };

    console.log('🧪 Test functions available at window.testAnalytics');
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/tours" element={<Tours />} /> */}
        <Route path="/tours/kyoto-fushimi-inari-night-walking-tour" element={<NightTour />} />
        <Route path="/tours/kyoto-early-bird-english-tour" element={<MorningTour />} />
        <Route path="/kyoto-early-morning-walking-tour-nature-and-history" element={<MorningTour />} />
        <Route path="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto" element={<UjiTour />} />
        <Route path="/tours/kyoto-gion-early-morning-walking-tour" element={<GionTour />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<About />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="/tours" element={<Home />} />
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
}

export default App;
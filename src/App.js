import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NightTour from './Pages/NightTour';
import Home from './Pages/Home';
import CancellationPolicy from './Pages/CancellationPolicy';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from './Pages/TermsOfService';
import About from './Pages/About';
import Tours from './Pages/Tours';
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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/tours" element={<Tours />} /> */}
        <Route path="/tours/kyoto-fushimi-inari-night-walking-tour" element={<NightTour />} />
        <Route path="/tours/kyoto-early-bird-english-tour" element={<MorningTour />} />
        <Route path="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto" element={<UjiTour />} />
        <Route path="/tours/kyoto-gion-early-morning-walking-tour" element={<GionTour />} />
        <Route path="/about" element={<About />} />
        <Route path="recommendations" element={<Recommendations />} />
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
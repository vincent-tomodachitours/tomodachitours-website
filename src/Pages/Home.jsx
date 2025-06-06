import React, { useState, useEffect } from 'react'
import Header from '../Components/Headers/Header1'

//Import tour services
import { fetchTours } from '../services/toursService';

import main1 from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import nightTour from "../IMG/Night-Tour/1.webp"
import morningTour from "../IMG/Morning-Tour/IMG_7260 2.webp"
import ujiTour from "../IMG/Uji-Tour/icecream.webp"
import gionTour from "../IMG/Gion-Tour/geisha.webp"

import Footer from '../Components/Footer'
import DisplayProduct1 from '../Components/DisplayProduct1'

const Home = () => {
    const [tours, setTours] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load tour data from Supabase
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

    // Show loading state
    if (loading) {
        return (
            <div className='flex flex-col font-ubuntu'>
                <Header />
                <div className='2xl:h-screen relative'>
                    <img src={main1} alt="Bamboo forest(img)" className='w-full h-full overflow-hidden object-cover' />
                    <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl absolute inset-0 grid place-items-center mx-auto font-black text-center text-white bg-black bg-opacity-20'>Discover Kyoto Beyond the Guidebooks</h1>
                </div>
                <div className='w-5/6 mt-12 mx-auto'>
                    <h1 className='font-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-12'>Tours</h1>
                    <div className='text-center text-xl text-gray-600 py-20'>Loading tours...</div>
                </div>
                <Footer />
            </div>
        );
    }

    // Show error state if tours couldn't be loaded
    if (!tours) {
        return (
            <div className='flex flex-col font-ubuntu'>
                <Header />
                <div className='2xl:h-screen relative'>
                    <img src={main1} alt="Bamboo forest(img)" className='w-full h-full overflow-hidden object-cover' />
                    <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl absolute inset-0 grid place-items-center mx-auto font-black text-center text-white bg-black bg-opacity-20'>Discover Kyoto Beyond the Guidebooks</h1>
                </div>
                <div className='w-5/6 mt-12 mx-auto'>
                    <h1 className='font-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-12'>Tours</h1>
                    <div className='text-center text-xl text-red-600 py-20'>Unable to load tours. Please try again later.</div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className='flex flex-col font-ubuntu'>
            <Header />
            <div className='2xl:h-screen relative'>
                <img src={main1} alt="Bamboo forest(img)" className='w-full h-full overflow-hidden object-cover' />
                <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl absolute inset-0 grid place-items-center mx-auto font-black text-center text-white bg-black bg-opacity-20'>Discover Kyoto Beyond the Guidebooks</h1>
            </div>
            <div className='w-5/6 mt-12 mx-auto'>
                <h1 className='font-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-12'>Tours</h1>
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-20 md:gap-6'>
                    <DisplayProduct1
                        image={nightTour}
                        imageAlt={"Couple walking through torii gates(img)"}
                        title={tours['night-tour']['tour-title']}
                        par={tours['night-tour']['tour-description']}
                        price={`¥ ${tours['night-tour']['tour-price'].toLocaleString('en-US')}`}
                        link={"/tours/kyoto-fushimi-inari-night-walking-tour"}
                    />
                    <DisplayProduct1
                        image={morningTour}
                        imageAlt={"Couple posing in front of torii gates(img)"}
                        title={tours['morning-tour']['tour-title']}
                        par={tours['morning-tour']['tour-description']}
                        price={`¥ ${tours['morning-tour']['tour-price'].toLocaleString('en-US')}`}
                        link={"/tours/kyoto-early-bird-english-tour"}
                    />
                    <DisplayProduct1
                        image={ujiTour}
                        imageAlt={"Matcha on ice cream(img)"}
                        title={tours['uji-tour']['tour-title']}
                        par={tours['uji-tour']['tour-description']}
                        price={`¥ ${tours['uji-tour']['tour-price'].toLocaleString('en-US')}`}
                        link={"/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto"}
                    />
                    <DisplayProduct1
                        image={gionTour}
                        imageAlt={"Geisha walking through hanamachi(img)"}
                        title={tours['gion-tour']['tour-title']}
                        par={tours['gion-tour']['tour-description']}
                        price={`¥ ${tours['gion-tour']['tour-price'].toLocaleString('en-US')}`}
                        link={"/tours/kyoto-gion-early-morning-walking-tour"}
                    />
                </div>
            </div>
            <Footer />
        </div >
    )
}

export default Home
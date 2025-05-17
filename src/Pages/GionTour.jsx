import React, { useEffect, useState } from 'react'

//Import tour config file
import config from '../config.json';

//Images
import photo1 from '../IMG/Gion-Tour/kiyomizu.webp'
import photo2 from '../IMG/Gion-Tour/geisha.webp'
import photo3 from '../IMG/Gion-Tour/yasaka4.webp'
import photo4 from '../IMG/Gion-Tour/kiyomizu-fall.webp'
import photo5 from '../IMG/Gion-Tour/yasaka-lanterns.webp'

//Custom Components
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import DatePicker from '../Components/DatePicker'
import DurationReview from '../Components/TourPages/DurationReview'
import ImageShowcase from '../Components/TourPages/ImageShowcase'


const tourTitle = config['gion-tour']['tour-title'];
const tourPrice = config['gion-tour']['tour-price'];
const tourDuration = config['gion-tour']['tour-duration'];
const tourReviews = config['gion-tour']['reviews'];
const availableTimes = config['gion-tour']['time-slots'];
const maxSlots = config['gion-tour']['max-participants'];
const API_URL = "https://script.google.com/macros/s/AKfycbx6Q3G30JrtVfKfvf4kFLcaCWTyR39KdrPM0Bp4I6pPc5W4ryAD43rgInHCTwzAvr6u4w/exec";

const GionTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ]
    const [activeContent, setActiveContent] = useState(1);

    //Mobile resizing logic
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div id="app-container" className='w-full'>
            <Header />
            <div className='w-4/5 mx-auto flex flex-col text-gray-700 mt-10'>
                <ImageShowcase isMobile={isMobile} images={images} />
                <div className='body w-full flex flex-col lg:flex-row gap-6 my-12'>
                    <div className='basis-3/5'>
                        <div className='flex flex-col md:flex-row justify-between gap-4 md:gap-10 mb-4 md:mb-2'>
                            <h1 className='text-3xl font-bold flex-1 break-words'>{tourTitle}</h1>
                            <span className='text-3xl font-bold whitespace-nowrap'>¥ {tourPrice.toLocaleString('en-US')} / Adult</span>
                        </div>
                        <DurationReview tourDuration={tourDuration} tourReviews={tourReviews} />
                        <p className='font-ubuntu my-6 md:mb-0'>{config['night-tour']['tour-description']}</p>
                        <div className='flex flex-col-reverse md:flex-row'>
                            <div className='my-6'>
                                <div className='flex gap-4 font-ubuntu'>
                                    {activeContent === 1 ?
                                        <button className='border-b-4 border-blue-900'>Description</button> :
                                        <button onClick={() => setActiveContent(1)}>Description</button>}
                                    {activeContent === 2 ?
                                        <button className='border-b-4 border-blue-900'>Itinerary</button> :
                                        <button onClick={() => setActiveContent(2)}>Itinerary</button>}
                                    {activeContent === 3 ?
                                        <button className='border-b-4 border-blue-900'>Meeting Point</button> :
                                        <button onClick={() => setActiveContent(3)}>Meeting Point</button>}
                                </div>
                                {activeContent === 1 &&
                                    <div className='font-ubuntu flex flex-col gap-6 mt-4'>
                                        <p>Experience Kyoto’s most iconic sights before the crowds arrive! Our early morning walking tour takes you through the historic streets of Gion, visiting Kiyomizu-dera Temple, Yasaka Shrine, Hanamikoji Street, and Sannenzaka & Ninenzaka with a knowledgeable and friendly English-speaking guide.</p>
                                        <p>⚠️ Prior to the tour, please ensure that WhatsApp is available for easy communication. Our guide will contact you through these platforms.</p>
                                        <p>✅ English Guided Walking Tour – Walking through Kyoto’s most scenic streets. </p>
                                        <p>✅ Visit Five Must-See Locations – Explore Kiyomizu Temple, Yasaka Shrine, Gion’s historic streets, and Sannenzaka & Ninenzaka.</p>
                                        <p>✅ Learn Kyoto’s History & Culture – Discover the stories behind Kyoto’s geisha district, samurai history, and old temples with our expert guide.</p>
                                        <p>✅ Capture Stunning Photos – Enjoy a crowd-free Kyoto and take beautiful photos in its most picturesque locations.</p>
                                        <p>✅ Get Local Tips & Recommendations – Our guide will share insider tips to explore after the tour.</p>
                                    </div>
                                }
                                {activeContent === 2 &&
                                    <div className='font-ubuntu mt-4'>
                                        <p>"Discover the spiritual heart of Kyoto at Inari-Shrine, famous for its thousands of vibrant red Tori gates. Hike through the enchanting paths that lead up Mount Inari, surrounded by a deep sense of history, spirituality and nature. This iconic Shinto shrine is dedicated to Inari, the god of rice, agriculture, and business. Visitors come to pray for success, health, and happiness while exploring smaller shrines, stone fox statues, and scenic viewpoints."</p>
                                    </div>
                                }
                                {activeContent === 3 &&
                                    <div className='font-ubuntumt-4'>
                                        <p>You can start this experience at the following places.</p>
                                        <p>7-Eleven.Heart-In JR Kyoto Station Central Entrance Store</p>
                                        <p>〒600-8216 JP Kyoto</p>
                                    </div>
                                }
                            </div>
                            {isMobile ? <DatePicker className="lg:basis-2/5" tourName={tourTitle} maxSlots={maxSlots} availableTimes={availableTimes} api={API_URL} price={tourPrice} />
                                : null}
                        </div>
                    </div>
                    {!isMobile ?
                        <DatePicker className="lg:basis-2/5" tourName={tourTitle} maxSlots={maxSlots} availableTimes={availableTimes} api={API_URL} price={tourPrice} />
                        : null
                    }
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default GionTour
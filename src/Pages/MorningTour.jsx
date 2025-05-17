import React, { useEffect, useState } from 'react'

//Import tour config file
import config from '../config.json';

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
import DurationReview from '../Components/TourPages/DurationReview'
import ImageShowcase from '../Components/TourPages/ImageShowcase'

const tourTitle = config['morning-tour']['tour-title'];
const tourPrice = config['morning-tour']['tour-price'];
const tourDuration = config['morning-tour']['tour-duration'];
const tourReviews = config['morning-tour']['reviews'];
const availableTimes = config['morning-tour']['time-slots'];
const maxSlots = config['morning-tour']['max-participants'];
const API_URL = "https://script.google.com/macros/s/AKfycbxR7Muw7FnDX0TAF0qnelmqNo3-4IU0SYZfTKc1L-Iw5-8ZBBE44QypE7-LxMyZtUNXog/exec";

const MorningTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ];

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
    return (
        <div id='app-container' className='w-full'>
            <Header />
            <div className='w-4/5 mx-auto flex flex-col text-gray-700 mt-10'>
                <ImageShowcase isMobile={isMobile} images={images} />
                <div className='body w-full flex flex-col lg:flex-row gap-6 mt-12'>
                    <div className='basis-3/5 flex-1'>
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
                                        <p>Early morning is the key to avoid the crowds during peak tourist seasons! Hit three of the top historical attractions, Fushimi-Inari Shrine, Bamboo Grove, and Tenryu-ji Temple with our English speaking tour guide!</p>
                                        <p>⚠️ Prior to the tour, please ensure that WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.</p>
                                        <p>⚠️ Please note: The earlier the start time, the fewer crowds we will encounter—if you value a peaceful, uncrowded experience, we recommend booking the earliest time slots available.</p>
                                        <p>✅ This is an English Guided Walking Tour which requires about 9,000 steps. We will use public transportation to visit each location(transportation fee NOT included).</p>
                                        <p>✅ Visit Three Highlights, Fushimi-Inari-Shrine, Arashiyama Bamboo Groove, Tenryu-ji Zen-Buddhism Temple.</p>
                                        <p>✅ Learn about the rich history of each location with our friendly and knowledgeable guide.</p>
                                        <p>✅ Receive travel tips and good restaurant recommendations from our guide.</p>
                                    </div>
                                }
                                {activeContent === 2 &&
                                    <div className='font-ubuntu mt-4'>
                                        <p>"Discover the spiritual heart of Kyoto at Inari-Shrine, famous for its thousands of vibrant red Tori gates. Hike through the enchanting paths that lead up Mount Inari, surrounded by a deep sense of history, spirituality and nature. This iconic Shinto shrine is dedicated to Inari, the god of rice, agriculture, and business. Visitors come to pray for success, health, and happiness while exploring smaller shrines, stone fox statues, and scenic viewpoints."</p>
                                    </div>
                                }
                                {activeContent === 3 &&
                                    <div className='font-ubuntu mt-4'>
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

export default MorningTour
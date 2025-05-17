import React, { useEffect, useState } from 'react'

//Import tour config file
import config from '../config.json';

//Images
import photo1 from '../IMG/Night-Tour/1.webp'
import photo2 from '../IMG/Night-Tour/2.webp'
import photo3 from '../IMG/Night-Tour/3.webp'
import photo4 from '../IMG/Night-Tour/4.webp'
import photo5 from '../IMG/Night-Tour/5.webp'

//Custom Components
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import DatePicker from '../Components/DatePicker'
import DurationReview from '../Components/TourPages/DurationReview'
import ImageShowcase from '../Components/TourPages/ImageShowcase'

const tourTitle = config['night-tour']['tour-title'];
const tourPrice = config['night-tour']['tour-price'];
const tourDuration = config['night-tour']['tour-duration'];
const tourReviews = config['night-tour']['reviews'];
const availableTimes = config['night-tour']['time-slots'];
const maxSlots = config['night-tour']['max-participants'];
const API_URL = "https://script.google.com/macros/s/AKfycbzOSSaJX-dzvazzxuLso5EBtjdElQsf4vE_Zh-6PzoY9kiu--cnMEWfjNOx36ai2kRPfg/exec";

const NightTour = () => {
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
        <div id='app-container' className='w-full h-screen min-h-screen flex flex-col overflow-y-auto'>
            <Header />
            <div className='w-4/5 md:w-3/4 mx-auto flex flex-col text-gray-700 mt-10'>
                <ImageShowcase isMobile={isMobile} images={images} />
                <div className='body w-full flex flex-col lg:flex-row gap-6 my-12'>
                    <div className='lg:basis-3/5'>
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
                                        <p>Join us an unforgettable evening walking tour of the Fushimi-Inari Shrine, one of Kyoto’s most iconic and enchanting sites away from the daytime crowds and immerse yourselves in the beautiful lantern light up. </p>
                                        <p>⚠️ Sunset is around 5PM. During the winter season, we also offer a daytime option. </p>
                                        <p>⚠️ Prior to the tour, please ensure WhatsApp or SMS is available for easy communication. Our tour guide will use these platforms to contact you.</p>
                                        <p>✅ This is an English Guided Walking Tour. Explore the rich history and cultural significance of the shrine with a knowledgeable and friendly guide.</p>
                                        <p>✅ A Unique Experience of the Shrine: Enjoy a serene and less crowded experience as we visit the shrine during the quieter evening hours.</p>
                                        <p>✅ Breathtaking Sights: Witness the stunning transformation of the shrine after dark, when the vermilion gates and the surrounding buildings are illuminated with a soft orange glow.</p>
                                        <p>*This tour will not hike the entire Fushimi-Inari mountain.</p>
                                    </div>
                                }
                                {activeContent === 2 &&
                                    <div className='font-ubuntu mt-4'>
                                        <p>"Discover the spiritual heart of Kyoto at Inaei-Shrine, famous for its thousands of vibrant red Tori gates. Hike through the enchanting paths that lead up Mount Inari, surrounded by a deep sense of history, spirituality and nature. This iconic Shinto shrine is dedicated to Inari, the god of rice, agriculture, and business. Visitors come to pray for success, health, and happiness while exploring smaller shrines, stone fox statues, and scenic viewpoints."</p>
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

export default NightTour
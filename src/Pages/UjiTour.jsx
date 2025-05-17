import React, { useEffect, useState } from 'react'

//Import tour config file
import config from '../config.json';

//Images
import photo1 from '../IMG/Uji-Tour/icecream.webp'
import photo2 from '../IMG/Uji-Tour/byodoin.webp'
import photo3 from '../IMG/Uji-Tour/museum-angels.webp'
import photo4 from '../IMG/Uji-Tour/usucha.webp'
import photo5 from '../IMG/Uji-Tour/experience.webp'

//Custom Components
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import DatePicker from '../Components/DatePicker'
import DurationReview from '../Components/TourPages/DurationReview'
import ImageShowcase from '../Components/TourPages/ImageShowcase'

const tourTitle = config['uji-tour']['tour-title'];
const tourPrice = config['uji-tour']['tour-price'];
const tourDuration = config['uji-tour']['tour-duration'];
const tourReviews = config['uji-tour']['reviews'];
const availableTimes = config['uji-tour']['time-slots'];
const maxSlots = config['uji-tour']['max-participants'];
const API_URL = "https://script.google.com/macros/s/AKfycbzulW0-e1NDaaSr6Wt3aliU-2otKnf56rksn143aIE2hn-rb3j2Pkc45LXHfo6YgWpUeA/exec";

const UjiTour = () => {
    const images = [
        { src: photo1 },
        { src: photo2 },
        { src: photo3 },
        { src: photo4 },
        { src: photo5 },
    ]

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
                                        <p>Step into the Matcha capital, Uji, and experience the heart of Japan's finest green tea. Walking through the famous Byodo-in temple, known for its appearance on the 10-yen coin, you will grind tea leaves into matcha powder and drink your fresh matcha tea. A must-try experience for matcha lovers!</p>
                                        <p>⚠️ Prior to the tour, please ensure that WhatsApp is available for easy communication. Our tour guide will use these platforms to contact you.</p>
                                        <p>⚠️ Please wear a mask during the Matcha making workshop. </p>
                                        <p>✅ English Guided Tour – Explore Uji City with our friendly and knowledgeable guide.</p>
                                        <p>✅ Hands-on Matcha Experience – Grind your own matcha powder using a traditional stone mill, then enjoy your freshly made tea with your choice of Japanese sweets or matcha ice cream.</p>
                                        <p>✅ Visit Byodo-in Temple – A UNESCO World Heritage Site, famous for its stunning architecture featured on the 10-yen coin.</p>
                                        <p>✅ Learn the History of Uji Tea – Discover why Uji is known as Japan’s top region for high-quality green tea.</p>
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

export default UjiTour
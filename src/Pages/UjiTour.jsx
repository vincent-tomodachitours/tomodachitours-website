import React, { useEffect, useState } from 'react'

//Import tour config file
import config from '../config.json';

//SVG
import { ReactComponent as Location } from '../SVG/Location.svg'
import { ReactComponent as One } from '../SVG/One-circle.svg'
import { ReactComponent as Two } from '../SVG/Two-circle.svg'
import { ReactComponent as Three } from '../SVG/Three-circle.svg'
import { ReactComponent as Four } from '../SVG/Four-circle.svg'
import { ReactComponent as Five } from '../SVG/Five-circle.svg'
import { ReactComponent as Six } from '../SVG/Six-circle.svg'

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
                            <div className='my-6 w-full'>
                                <div className='flex w-max gap-4 font-roboto font-bold border-b-2 border-blue-600'>
                                    {activeContent === 1 ?
                                        <button className='bg-blue-600 text-white p-2 rounded-t-md'>Description</button> :
                                        <button onClick={() => setActiveContent(1)}>Description</button>}
                                    {activeContent === 2 ?
                                        <button className='bg-blue-600 text-white p-2 rounded-t-md'>Itinerary</button> :
                                        <button onClick={() => setActiveContent(2)}>Itinerary</button>}
                                    {activeContent === 3 ?
                                        <button className='bg-blue-600 text-white p-2 rounded-t-md'>Meeting Point</button> :
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
                                    <div className='font-ubuntu mt-6 flex flex-row gap-1 w-full'>
                                        <div className='w-10 h-full flex flex-col justify-between items-center'>
                                            {Array.from({ length: 22 }).map((_, i) => (
                                                <p key={i}>•</p>
                                            ))}
                                        </div>
                                        <div className='flex flex-col gap-6 basis-11/12 font-roboto'>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>You'll start at</h4>
                                                <p>7-Eleven Heart-in - JR Kyoto Station Central Entrance Store</p>
                                                <a
                                                    href='https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9' target='_blank' rel="noopener noreferrer"
                                                    className='font-semibold underline'
                                                >Open Google Maps</a>
                                                <Location className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Statue of Murasaki Shikibu</h4>
                                                <p>Stop: 15 minutes</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Byodo-in Temple</h4>
                                                <p>Stop: 60 minutes</p>
                                                <Two className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Asagiri Bridge</h4>
                                                <p>Stop: 15 minutes</p>
                                                <Three className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Fukujuen Uji: Matcha Grinding Experience</h4>
                                                <p>Stop: 60 minutes</p>
                                                <Four className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Uji Shrine</h4>
                                                <p>Stop: 20 minutes</p>
                                                <Five className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Ujigami Shrine</h4>
                                                <p>Stop: 20 minutes</p>
                                                <Six className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible font-bold'>
                                                <h4>You'll return to the starting point</h4>
                                                <Location className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                        </div>
                                    </div>
                                }
                                {activeContent === 3 &&
                                    <div className='font-roboto mt-4'>
                                        <p>7-Eleven.Heart-In JR Kyoto Station Central Entrance Store</p>
                                        <a
                                            href='https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9' target='_blank' rel="noopener noreferrer"
                                            className='font-semibold underline'
                                        >Open Google Maps</a>
                                        <p className='mt-4'>Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.</p>
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
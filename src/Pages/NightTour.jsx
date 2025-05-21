import React, { useEffect, useState } from 'react'

//Import tour config file
import config from '../config.json';

//SVG
import { ReactComponent as Location } from '../SVG/Location.svg'
import { ReactComponent as One } from '../SVG/One-circle.svg'

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
                            <div className='my-6 w-full'>
                                <div className='flex w-max font-roboto font-bold border-b-2 border-blue-600'>
                                    {activeContent === 1 ?
                                        <button className='bg-blue-600 text-white p-2 rounded-t-md'>Description</button> :
                                        <button className='p-2' onClick={() => setActiveContent(1)}>Description</button>}
                                    {activeContent === 2 ?
                                        <button className='bg-blue-600 text-white p-2 rounded-t-md'>Itinerary</button> :
                                        <button className='p-2' onClick={() => setActiveContent(2)}>Itinerary</button>}
                                    {activeContent === 3 ?
                                        <button className='bg-blue-600 text-white p-2 rounded-t-md'>Meeting Point</button> :
                                        <button className='p-2' onClick={() => setActiveContent(3)}>Meeting Point</button>}
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
                                    <div className='font-ubuntu mt-6 flex flex-row gap-1 w-full'>
                                        <div className='w-10 h-full flex flex-col justify-between items-center'>
                                            {Array.from({ length: 7 }).map((_, i) => (
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
                                                <h4 className='font-bold'>Fushimi Inari Taisha Shrine</h4>
                                                <p>Stop: 2 hours</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
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
                            {isMobile ? <DatePicker className="lg:basis-2/5" tourName={tourTitle} maxSlots={maxSlots} availableTimes={availableTimes} sheetId="Night tour" price={tourPrice} />
                                : null}
                        </div>
                    </div>
                    {!isMobile ?
                        <DatePicker className="lg:basis-2/5" tourName={tourTitle} maxSlots={maxSlots} availableTimes={availableTimes} sheetId="Night tour" price={tourPrice} />
                        : null
                    }
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default NightTour
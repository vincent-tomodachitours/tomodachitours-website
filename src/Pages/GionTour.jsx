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
                                    <div className='font-ubuntu mt-6 flex flex-row gap-1 w-full'>
                                        <div className='w-10 h-full flex flex-col justify-between items-center'>
                                            {Array.from({ length: 22 }).map((_, i) => (
                                                <p key={i}>•</p>
                                            ))}
                                        </div>
                                        <div className='flex flex-col gap-6 basis-11/12 font-roboto'>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>You'll start at</h4>
                                                <p>Statue of Izumo-no-Okuni</p>
                                                <a
                                                    href='https://maps.app.goo.gl/ZErESUEc65kkLbx16' target='_blank' rel="noopener noreferrer"
                                                    className='font-semibold underline'
                                                >Open Google Maps</a>
                                                <Location className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Gion Shirakawa</h4>
                                                <p>Stop: 15 minutes</p>
                                                <One className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Hanamikoji Street</h4>
                                                <p>Stop: 20 minutes</p>
                                                <Two className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>kiyomizu-dera Temple</h4>
                                                <p>Stop: 60 minutes - Admission excluded</p>
                                                <Three className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Sanenzaka Ninenzaka</h4>
                                                <p>Stop: 30 minutes</p>
                                                <Four className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Yasaka Pagoda</h4>
                                                <p>Stop: 10 minutes</p>
                                                <Five className='absolute -top-0 -left-10 w-8 h-8 bg-white' />
                                            </div>
                                            <div className='relative overflow-visible'>
                                                <h4 className='font-bold'>Yasaka Shrine</h4>
                                                <p>Stop: 30 minutes</p>
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
                                        <p>Statue of Izumo-no-Okuni</p>
                                        <a
                                            href='https://maps.app.goo.gl/ZErESUEc65kkLbx16' target='_blank' rel="noopener noreferrer"
                                            className='font-semibold underline'
                                        >Open Google Maps</a>
                                    </div>
                                }
                            </div>
                            {isMobile ? <DatePicker className="lg:basis-2/5" tourName={tourTitle} maxSlots={maxSlots} availableTimes={availableTimes} sheetId="Gion tour" price={tourPrice} />
                                : null}
                        </div>
                    </div>
                    {!isMobile ?
                        <DatePicker className="lg:basis-2/5" tourName={tourTitle} maxSlots={maxSlots} availableTimes={availableTimes} sheetId="Gion tour" price={tourPrice} />
                        : null
                    }
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default GionTour
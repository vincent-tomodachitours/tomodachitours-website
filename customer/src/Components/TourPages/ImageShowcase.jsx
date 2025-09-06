import React, { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css';
import { trackTourImageClick } from '../../services/analytics';

const ImageShowcase = ({ isMobile, images, tourId, tourName }) => {
    const [imageOpen, setImageOpen] = useState(false);

    // Handle image click tracking
    const handleImageClick = (imageIndex = 0, clickType = 'main_image') => {
        if (tourId && tourName) {
            trackTourImageClick(tourId, tourName, imageIndex, clickType);
        }
        setImageOpen(true);
    };

    return (
        <div className='w-full'>
            {isMobile ? (
                // Mobile layout: single image with rounded corners
                <div className='w-full h-[16rem] relative'>
                    <img
                        onClick={() => handleImageClick(0, 'main_image')}
                        src={images[0].src}
                        alt='Tour location featuring scenic views and landmarks'
                        className='w-full h-full object-cover object-center rounded-xl cursor-pointer'
                    />
                    <button
                        onClick={() => handleImageClick(0, 'gallery_button')}
                        className='absolute bottom-3 right-3 bg-black/75 text-white px-2.5 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{images.length} photos</span>
                    </button>
                    <Lightbox
                        open={imageOpen}
                        close={() => setImageOpen(false)}
                        slides={images}
                    />
                </div>
            ) : (
                // Desktop layout: main image + sidebar images
                <div className='w-full h-[20rem] md:h-[32rem] flex'>
                    <div className='w-2/3 relative group'>
                        <img
                            onClick={() => handleImageClick(0, 'main_image')}
                            src={images[0].src}
                            alt='Tour location featuring scenic views and landmarks'
                            className='w-full h-full object-cover object-center rounded-l-xl cursor-pointer'
                        />
                        <button
                            onClick={() => handleImageClick(0, 'gallery_button')}
                            className='absolute bottom-4 right-4 bg-black/75 text-white px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-2'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <span>{images.length} photos</span>
                        </button>
                        <Lightbox
                            open={imageOpen}
                            close={() => setImageOpen(false)}
                            slides={images}
                        />
                    </div>
                    <div className='w-1/3 flex flex-col pl-2'>
                        <div className='h-1/2 pb-1'>
                            <img
                                onClick={() => handleImageClick(1, 'sidebar_image')}
                                src={images[1].src}
                                alt="Tour highlights and cultural attractions"
                                className="w-full h-full object-cover object-center rounded-tr-xl cursor-pointer"
                            />
                        </div>
                        <div className='h-1/2 pt-1'>
                            <img
                                onClick={() => handleImageClick(2, 'sidebar_image')}
                                src={images[2].src}
                                alt="Scenic views and local landmarks from tour route"
                                className="w-full h-full object-cover object-center rounded-br-xl cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImageShowcase
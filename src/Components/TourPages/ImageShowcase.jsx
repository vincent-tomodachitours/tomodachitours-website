import React, { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css';

const ImageShowcase = ({ isMobile, images }) => {
    const [imageOpen, setImageOpen] = useState(false);

    return (
        <div>
            <div className='w-full h-[20rem] md:h-[28rem] flex gap-2'>
                <div className='md:basis-1/2 h-full overflow-hidden'>
                    <img onClick={() => setImageOpen(true)} src={images[0].src} alt='Couple posing in front of Torii gates(img)' className='w-full h-full object-cover rounded-md cursor-pointer' />
                    <Lightbox
                        open={imageOpen}
                        close={() => setImageOpen(false)}
                        slides={images}
                    />
                </div>
                {!isMobile ? <div className='basis-1/2 h-full grid grid-cols-2 grid-rows-2 gap-2'>
                    {[images[1], images[2], images[3], images[4]].map((photo, idx) => (
                        <img key={idx} src={photo.src} alt={""} className="w-full h-full object-cover rounded-md" />
                    ))}
                </div> : null}
            </div>
        </div>
    )
}

export default ImageShowcase
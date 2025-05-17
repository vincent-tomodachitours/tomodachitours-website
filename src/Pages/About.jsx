import React from 'react'
import Header from '../Components/Headers/Header1'

import main1 from "../IMG/About/sep2024-2.webp"
import main2 from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import main3 from "../IMG/About/thousand-cranes.webp"
import Footer from '../Components/Footer'

const About = () => {
    return (
        <div>
            <Header />
            <div className='flex flex-col gap-12 md:gap-32 my-12 md:my-20'>
                <div className='flex flex-col-reverse lg:flex-row gap-6 md:gap-12 w-3/4 mx-auto items-center'>
                    <div className='basis-1/2'>
                        <h2 className='font-ubuntu text-2xl md:text-4xl lg:text-5xl xl:text-6xl'>Tomodachi Tours has been established to convey the essence of Kyoto to foreign tourists visiting the city</h2>
                    </div>
                    <div className='basis-1/2 h-[28rem]'>
                        <img src={main1} alt="Tour guide with travelers(img)" className='rounded-3xl w-full h-full overflow-hidden object-cover' />
                    </div>
                </div>
                <div className='flex flex-col-reverse lg:flex-row-reverse gap-6 md:gap-12 w-3/4 mx-auto items-center'>
                    <div className='basis-1/2'>
                        <h2 className='font-ubuntu text-2xl md:text-4xl lg:text-5xl xl:text-6xl'>Our energetic and friendly guides provide unforgettable memories for our guests</h2>
                    </div>
                    <div className='basis-1/2 h-[28rem]'>
                        <img src={main2} alt='Bamboo forest(img)' className='rounded-3xl w-full h-full overflow-hidden object-cover' />
                    </div>

                </div>
                <div className='flex flex-col-reverse lg:flex-row gap-6 md:gap-12 w-3/4 mx-auto items-center'>
                    <div className='basis-1/2'>
                        <h2 className='font-ubuntu text-2xl md:text-4xl lg:text-5xl xl:text-6xl'>Discover with us the charm of Kyoto, where history and culture seamlessly blend with nature and modernity</h2>
                    </div>
                    <div className='basis-1/2 h-[28rem]'>
                        <img src={main3} alt='Ema at Fushimi-Inari(img)' className='rounded-3xl w-full h-full overflow-hidden object-cover' />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default About
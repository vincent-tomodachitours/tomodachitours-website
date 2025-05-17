import React from 'react'
import Header from '../Components/Headers/Header1'

//Import tour config file
import config from '../config.json';

import main1 from "../IMG/Gion-Tour/yasaka-pagoda.webp"

import nightTour1 from "../IMG/Night-Tour/1.webp"
import nightTour2 from "../IMG/Night-Tour/2.webp"
import nightTour3 from "../IMG/Night-Tour/gangsta-fox.webp"

import morningTour1 from "../IMG/Morning-Tour/IMG_7260 2.webp"
import morningTour2 from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import morningTour3 from "../IMG/Morning-Tour/bridgelong.webp"

import ujiTour1 from "../IMG/Uji-Tour/icecream.webp"
import ujiTour2 from "../IMG/Uji-Tour/byodoin.webp"
import ujiTour3 from "../IMG/Uji-Tour/murasaki.webp"

import gionTour1 from "../IMG/Gion-Tour/kiyomizu.webp"
import gionTour2 from "../IMG/Gion-Tour/geisha.webp"
import gionTour3 from "../IMG/Gion-Tour/yasaka4.webp"

import Footer from '../Components/Footer'
import DisplayProduct3 from '../Components/DisplayProduct3'

const Tours = () => {
    return (
        <div className='flex flex-col font-ubuntu'>
            <Header />
            <div className='relative h-[16rem] md:h-[24rem] lg:h-[30rem]'>
                <img src={main1} alt='Yasaka pagoda(img)' className='w-full h-full object-cover' />
                <h1 className='sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black absolute inset-0 flex justify-center items-center text-white bg-black bg-opacity-20'>Explore with Tomodachi Tours</h1>
            </div>
            <div className='tours flex flex-col w-5/6 mx-auto mt-20 gap-6 lg:gap-20'>
                <DisplayProduct3
                    side={"left"}
                    image1={nightTour1}
                    image1Alt={"Couple walking through torii gates(img)"}
                    image2={nightTour2}
                    image2Alt={"Fushimi-Inari romon gate at night(img)"}
                    image3={nightTour3}
                    image3Alt={"Fushimi-Inari fox statue(img)"}
                    title={config['night-tour']['tour-title']}
                    par={config['night-tour']['tour-description']}
                    price={`¥ ${config['night-tour']['tour-price'].toLocaleString('en-US')} / Adult`}
                    link={"/tours/kyoto-fushimi-inari-night-walking-tour"}
                />
                <DisplayProduct3
                    side={"right"}
                    image1={morningTour1}
                    image1Alt={"Couple posing in front of torii gates(img)"}
                    image2={morningTour2}
                    image2Alt={"Bamboo forest(img)"}
                    image3={morningTour3}
                    image3Alt={"Togetsukyo bridge(img)"}
                    title={config['morning-tour']['tour-title']}
                    par={config['morning-tour']['tour-description']}
                    price={`¥ ${config['morning-tour']['tour-price'].toLocaleString('en-US')} / Adult`}
                    link={"/tours/kyoto-early-bird-english-tour"}
                />
                <DisplayProduct3
                    side={"left"}
                    image1={ujiTour1}
                    image1Alt={"Matcha on ice cream(img)"}
                    image2={ujiTour2}
                    image2Alt={"Byodo-in during spring(img)"}
                    image3={ujiTour3}
                    image3Alt={"Murasaki Shikibu statue(img)"}
                    title={config['uji-tour']['tour-title']}
                    par={config['uji-tour']['tour-description']}
                    price={`¥ ${config['uji-tour']['tour-price'].toLocaleString('en-US')} / Adult`}
                    link={"/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto"}
                />
                <DisplayProduct3
                    side={"right"}
                    image1={gionTour1}
                    image1Alt={"Pagoda at Kiyomizu-dera(img)"}
                    image2={gionTour2}
                    image2Alt={"Geisha walking through hanamachi(img)"}
                    image3={gionTour3}
                    image3Alt={"Yasaka pagoda with cherry blossoms(img)"}
                    title={config['gion-tour']['tour-title']}
                    par={config['gion-tour']['tour-description']}
                    price={`¥ ${config['gion-tour']['tour-price'].toLocaleString('en-US')} / Adult`}
                    link={"/tours/kyoto-gion-early-morning-walking-tour"}
                />
            </div>
            <Footer />
        </div>
    )
}

export default Tours
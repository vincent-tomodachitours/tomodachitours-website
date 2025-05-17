import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'

import fushimiInari from "../IMG/Night-Tour/2.webp"
import kiyomizuDera from "../IMG/Gion-Tour/kiyomizu-fall.webp"
import bambooForest from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import kinkakuji from "../IMG/Recommendations/kinkakuji.webp"

import uji from "../IMG/Uji-Tour/byodoin.webp"
import nijoCastle from "../IMG/Recommendations/nijo-castle-gate.webp"
import kifuneShrine from "../IMG/Recommendations/kifune-stairs.webp"
import maruyamaPark from "../IMG/Recommendations/maruyama-blossoms.webp"

import aburiya from "../IMG/Recommendations/aburiya.webp"
import daikiSuisan from "../IMG/Recommendations/daiki-suisan.webp"
import hanatanuki from "../IMG/Recommendations/hanatanuki.webp"
import torikizoku from "../IMG/Recommendations/toriki.webp"

import shareHappiness from "../IMG/Recommendations/sharehappiness.webp"
import rockING from "../IMG/Recommendations/rockingbar.webp"
import escamoteur from "../IMG/Recommendations/l-escamoteur-bar.webp"
import zazapub from "../IMG/Recommendations/zazapub.webp"

import { Link } from 'react-router-dom'

const Recommendations = () => {
    return (
        <div className='flex flex-col'>
            <Header />
            <div className='w-5/6 mx-auto flex flex-col items-center font-ubuntu my-12 md:my-20 gap-6 md:gap-12'>
                <h1 className='font-black text-4xl lg:text-6xl'>Main Attractions in Kyoto</h1>
                <div className='w-full grid grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={fushimiInari} alt='Fushimi Inari (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <Link to="/tours/kyoto-fushimi-inari-night-walking-tour" className='text-green-700 underline text-2xl font-black'>Fushimi-Inari Shrine</Link>
                        <p>Book our night tour of the Fushimi-Inari shrine to escape the crowds and experience the shrine with soft orange lanterns!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={kiyomizuDera} alt='Kiyomizu-dera (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <Link to="/tours/kyoto-gion-early-morning-walking-tour" className='text-green-700 underline text-2xl font-black'>Kiyomizu-dera Temple</Link>
                        <p>Book our early morning Gion tour as early as 6:30AM! Learn about Geisha and the rich history of the heart of Kyoto</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={bambooForest} alt='Arashiyama (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <Link to="/tours/kyoto-early-bird-english-tour" className='text-green-700 underline text-2xl font-black'>Arashiyama Bamboo Forest</Link>
                        <p>Visit the Fushimi-Inari shrine and the Arashiyama area in our early morning tour!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={kinkakuji} alt='Kinkakuji (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Golden Pavilion</h4>
                        <p>The temple wrapped in real gold on the outskirts of Kyoto is a spot you cannot miss while visiting Kyoto!</p>
                    </div>
                </div>
            </div>
            <div className='w-5/6 mx-auto flex flex-col items-center font-ubuntu my-12 md:my-20 gap-6 md:gap-12'>
                <h1 className='font-black text-4xl lg:text-6xl'>Other attractions</h1>
                <div className='w-full grid grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={uji} alt='Byodo-in (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <Link to="/tours/matcha-grinding-experience-and-walking-tour-in-uji-kyoto" className='text-green-700 underline text-2xl font-black'>Uji - The City of Matcha</Link>
                        <p>Book our tour to the Matcha city where you can grind your own Matcha powder from fresh leaves and enjoy the best Matcha ice cream you’ve ever had!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={nijoCastle} alt='Nijo castle gate (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Nijo Castle</h4>
                        <p>Visit Nijo Castle in Kyoto, a historic site with beautiful buildings, peaceful gardens, and special "singing" floors that make sounds when you walk.</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={kifuneShrine} alt='Kifune shrine (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Kifune Shrine</h4>
                        <p>A beautiful shrine in the mountains, completely surrounded by nature. If you want to get out of the city for half a day for a quick hike this place is for you!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={maruyamaPark} alt='Maruyama park cherry blossoms (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Maruyama Park</h4>
                        <p>Maruyama Park in Gion is the perfect place to enjoy the cherry blossoms with the park having an impressive 680 cherry blossom trees!</p>
                    </div>
                </div>
            </div>
            <div className='w-5/6 mx-auto flex flex-col items-center font-ubuntu my-12 md:my-20 gap-6 md:gap-12'>
                <h1 className='font-black text-4xl lg:text-6xl'>Restaurants</h1>
                <div className='w-full grid grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={aburiya} alt='Beef (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Aburiya</h4>
                        <p>An all you can eat Japanese BBQ place in the Gion area where you can enjoy high quality beef along with all you can drink!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={daikiSuisan} alt='Sushi (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Daiki Suisan</h4>
                        <p>A conveyor belt sushi chain where you can enjoy fresh and high quality sushi without completely braking your wallet!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={hanatanuki} alt='Okonomiyaki (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Hanatanuki</h4>
                        <p>Okonomiyaki near Kyoto station where you can order drinks and other sides and have a good time with friends or family</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={torikizoku} alt='Yakitori (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Torikizoku</h4>
                        <p>A high quality Yakitori chain where you can drink with friends while enjoying many sides to go with your drink in the store’s vibrant atmosphere</p>
                    </div>
                </div>
            </div>
            <div className='w-5/6 mx-auto flex flex-col items-center font-ubuntu my-12 md:my-20 gap-6 md:gap-12'>
                <h1 className='font-black text-4xl lg:text-6xl'>Kyoto Night Life</h1>
                <div className='w-full grid grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={shareHappiness} alt='ShareHappiness bar (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Share Happiness</h4>
                        <p>A fun Karaoke bar in Pontocho where you can sing with strangers and enjoy a friendly conversation with the owner!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={rockING} alt='Rock ING bar (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>Rocking Bar ING</h4>
                        <p>A hidden dive bar in Pontocho, the super friendly owner plays rock music while you play jenga and drink!</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={escamoteur} alt='Lescamoteur bar (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>L'Escamoteur Bar</h4>
                        <p>A popular bar with vintage cocktails, old-time atmosphere, magic house, elixirs and mystery</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='h-[16rem]'>
                            <img src={zazapub} alt='Zaza pub (img)' className='w-full h-full overflow-hidden object-cover rounded-2xl' />
                        </div>
                        <h4 className='text-2xl font-black'>ZAZA Pub</h4>
                        <p>A popular and vibrant bar near Pontocho playing loud pop music. Have a couple of drinks, play darts, and speak to other travelers!</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Recommendations
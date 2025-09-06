import React from 'react'
import Header from '../Components/Headers/Header1'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

import main1 from "../IMG/About/sep2024-2.webp"
import main2 from "../IMG/Morning-Tour/bamboo-main-highres1.85.webp"
import main3 from "../IMG/About/thousand-cranes.webp"
import Footer from '../Components/Footer'

const About = () => {
    return (
        <div>
            <SEO
                title={seoData.about.title}
                description={seoData.about.description}
                keywords={seoData.about.keywords}
            />
            <Header />
            <div className='max-w-7xl mx-auto px-4 py-12 md:py-20'>
                {/* Hero Section */}
                <div className='text-center mb-20'>
                    <h1 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-8'>
                        About Tomodachi Tours
                    </h1>
                    <p className='text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
                        We're more than just a tour company. We're on a mission to share Kyoto's beauty responsibly,
                        providing friendly English tours while helping solve one of tourism's biggest challenges.
                    </p>
                </div>

                {/* Mission Section */}
                <div className='grid lg:grid-cols-2 gap-12 md:gap-16 items-center mb-20'>
                    <div className='order-2 lg:order-1'>
                        <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-10'>
                            <h2 className='font-ubuntu text-3xl md:text-4xl font-bold text-gray-800 mb-6'>
                                Our Mission
                            </h2>
                            <p className='text-lg text-gray-700 leading-relaxed mb-6'>
                                Tomodachi Tours was founded with a dual purpose: to provide exceptional English-language tours
                                for international visitors while actively addressing the growing problem of over tourism in Kyoto.
                            </p>
                            <p className='text-lg text-gray-700 leading-relaxed'>
                                We believe that tourism should enhance, not overwhelm, the places we love. That's why we've
                                designed our tours to showcase Kyoto's most iconic locations at times when crowds are minimal,
                                creating better experiences for our guests and less impact on local communities.
                            </p>
                        </div>
                    </div>
                    <div className='order-1 lg:order-2'>
                        <img src={main1} alt="Tour guide with travelers" className='rounded-3xl w-full h-[400px] object-cover shadow-lg' />
                    </div>
                </div>

                {/* Solution Section */}
                <div className='grid lg:grid-cols-2 gap-12 md:gap-16 items-center mb-20'>
                    <div>
                        <img src={main2} alt='Peaceful bamboo forest tour' className='rounded-3xl w-full h-[400px] object-cover shadow-lg' />
                    </div>
                    <div>
                        <h2 className='font-ubuntu text-3xl md:text-4xl font-bold text-gray-800 mb-6'>
                            Fighting Over Tourism
                        </h2>
                        <div className='space-y-6'>
                            <div className='flex items-start gap-4'>
                                <div className='bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1'>🌅</div>
                                <div>
                                    <h3 className='font-semibold text-gray-800 mb-2'>Early Morning Tours</h3>
                                    <p className='text-gray-700'>We start our tours at dawn when popular sites like Fushimi Inari and Arashiyama are peaceful and crowd-free, offering you authentic moments without the masses.</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1'>🌙</div>
                                <div>
                                    <h3 className='font-semibold text-gray-800 mb-2'>Evening Adventures</h3>
                                    <p className='text-gray-700'>Our evening tours explore Kyoto's illuminated beauty when tourist crowds have dispersed, revealing the city's magical nighttime atmosphere.</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1'>🤝</div>
                                <div>
                                    <h3 className='font-semibold text-gray-800 mb-2'>Community Respect</h3>
                                    <p className='text-gray-700'>By avoiding peak hours, we help reduce the strain on local infrastructure and ensure that residents can enjoy their city peacefully.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Experience Section */}
                <div className='bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white mb-20'>
                    <div className='grid lg:grid-cols-2 gap-12 items-center'>
                        <div>
                            <h2 className='font-ubuntu text-3xl md:text-4xl font-bold mb-6'>
                                The Tomodachi Experience
                            </h2>
                            <p className='text-xl leading-relaxed mb-6 text-gray-200'>
                                Our friendly, English-speaking guides don't just show you Kyoto – they help you understand it.
                                We share the stories, traditions, and hidden details that make each location special.
                            </p>
                            <p className='text-lg leading-relaxed text-gray-300'>
                                Whether you're watching the sunrise paint Fushimi Inari's thousand torii gates in golden light,
                                or exploring the ethereal beauty of bamboo groves in the early morning mist, every moment is
                                designed to create lasting memories while respecting the places we visit.
                            </p>
                        </div>
                        <div className='relative'>
                            <img src={main3} alt='Traditional Kyoto temple details' className='rounded-2xl w-full h-[350px] object-cover' />
                            <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl'></div>
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className='text-center'>
                    <h2 className='font-ubuntu text-3xl md:text-4xl font-bold text-gray-800 mb-12'>
                        Our Values
                    </h2>
                    <div className='grid md:grid-cols-3 gap-8'>
                        <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-100'>
                            <div className='bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <span className='text-2xl'>🌱</span>
                            </div>
                            <h3 className='font-ubuntu text-xl font-semibold text-gray-800 mb-4'>Sustainable Tourism</h3>
                            <p className='text-gray-600 leading-relaxed'>
                                We're committed to tourism that preserves and protects Kyoto's cultural heritage and natural beauty for future generations.
                            </p>
                        </div>
                        <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-100'>
                            <div className='bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <span className='text-2xl'>❤️</span>
                            </div>
                            <h3 className='font-ubuntu text-xl font-semibold text-gray-800 mb-4'>Authentic Connections</h3>
                            <p className='text-gray-600 leading-relaxed'>
                                We foster genuine cultural exchange between visitors and local communities, creating meaningful experiences for everyone.
                            </p>
                        </div>
                        <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-100'>
                            <div className='bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <span className='text-2xl'>🎌</span>
                            </div>
                            <h3 className='font-ubuntu text-xl font-semibold text-gray-800 mb-4'>Cultural Respect</h3>
                            <p className='text-gray-600 leading-relaxed'>
                                Every tour is designed with deep respect for Japanese culture, traditions, and the daily lives of Kyoto residents.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default About
import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

const Jobs: React.FC = () => {
    return (
        <div>
            <SEO
                title={seoData.jobs.title}
                description={seoData.jobs.description}
                keywords={seoData.jobs.keywords}
            />
            <Header />
            <div className='max-w-6xl mx-auto px-4 py-12 md:py-20'>
                {/* Hero Section */}
                <div className='text-center mb-16'>
                    <h1 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6'>
                        Join Our Team
                    </h1>
                    <p className='text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
                        Share the beauty, culture, and history of Kyoto with international visitors.
                        Make a positive impact on our guests' experience!
                    </p>
                </div>

                {/* Main Job Posting */}
                <div className='bg-white rounded-3xl shadow-lg p-8 md:p-12 mb-12'>
                    <div className='mb-8'>
                        <h2 className='font-ubuntu text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
                            Tour Guide - Kyoto
                        </h2>
                        <div className='flex flex-wrap gap-4 text-sm'>
                            <span className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full'>Part-time</span>
                            <span className='bg-green-100 text-green-800 px-3 py-1 rounded-full'>Flexible Schedule</span>
                            <span className='bg-purple-100 text-purple-800 px-3 py-1 rounded-full'>¥1,650 - ¥2,250/hour</span>
                        </div>
                    </div>

                    {/* Why Join Us Section */}
                    <section className='mb-10'>
                        <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>Why Join Us?</h3>
                        <div className='grid md:grid-cols-2 gap-6'>
                            <div className='flex items-start gap-4'>
                                <div className='bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm'>✓</div>
                                <div>
                                    <h4 className='font-semibold text-gray-800 mb-2'>Flexible Schedule</h4>
                                    <p className='text-gray-600'>Work from 1 day a week – fits perfectly with your lifestyle!</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm'>✓</div>
                                <div>
                                    <h4 className='font-semibold text-gray-800 mb-2'>Morning Work</h4>
                                    <p className='text-gray-600'>Finish work by noon and have the rest of the day free!</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm'>✓</div>
                                <div>
                                    <h4 className='font-semibold text-gray-800 mb-2'>Full Training Provided</h4>
                                    <p className='text-gray-600'>Complete guide manual provided – no experience required!</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm'>✓</div>
                                <div>
                                    <h4 className='font-semibold text-gray-800 mb-2'>Great Team Culture</h4>
                                    <p className='text-gray-600'>Looking for enthusiastic, motivated individuals!</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Main Responsibilities */}
                    <section className='mb-10'>
                        <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>Main Responsibilities</h3>
                        <div className='space-y-6'>
                            <div className='border-l-4 border-blue-500 pl-6'>
                                <h4 className='font-semibold text-gray-800 mb-2'>Lead Walking Tours in Kyoto</h4>
                                <p className='text-gray-600'>Guide foreign visitors through iconic locations such as Fushimi Inari Taisha, Arashiyama, and Gion, providing cultural, historical, and fun insights. Training and manuals are provided, so no experience is necessary!</p>
                            </div>
                            <div className='border-l-4 border-blue-500 pl-6'>
                                <h4 className='font-semibold text-gray-800 mb-2'>Ensure Safe and Enjoyable Tours</h4>
                                <p className='text-gray-600'>Manage tour logistics, keep guests engaged, and make sure everyone is safe and comfortable throughout the tour. Be ready to assist with any issues that might arise.</p>
                            </div>
                            <div className='border-l-4 border-blue-500 pl-6'>
                                <h4 className='font-semibold text-gray-800 mb-2'>Gather Guest Feedback for Tour Improvement</h4>
                                <p className='text-gray-600'>Collect feedback from guests and offer suggestions to enhance future tours. Your ideas will play a key role in improving our guest experience and increasing satisfaction.</p>
                            </div>
                        </div>
                    </section>

                    {/* Requirements */}
                    <section className='mb-10'>
                        <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>What We're Looking For</h3>
                        <div className='grid md:grid-cols-2 gap-8'>
                            <div>
                                <h4 className='font-semibold text-red-600 mb-4 text-lg'>Must Have:</h4>
                                <ul className='space-y-3'>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-red-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Able to communicate in English</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-red-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Friendly and open to interacting with people from different cultures</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-red-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Enthusiastic and responsible with strong accountability</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-red-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Strong time management skills and punctuality</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className='font-semibold text-green-600 mb-4 text-lg'>Preferred:</h4>
                                <ul className='space-y-3'>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-green-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Study abroad or international life experience</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-green-500 mt-1'>•</span>
                                        <span className='text-gray-700'>International students are welcome</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-green-500 mt-1'>•</span>
                                        <span className='text-gray-700'>No academic background required</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-green-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Open to career break returners</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-green-500 mt-1'>•</span>
                                        <span className='text-gray-700'>Side job/part-time work OK</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Ideal Candidates */}
                    <section className='mb-10'>
                        <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>Ideal Candidates</h3>
                        <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6'>
                            <div className='grid md:grid-cols-2 gap-4'>
                                <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>✅</span>
                                    <span className='text-gray-700'>Enthusiastic and motivated individuals</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>✅</span>
                                    <span className='text-gray-700'>Interested in Japanese culture and Kyoto history</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>✅</span>
                                    <span className='text-gray-700'>Comfortable communicating in English</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>✅</span>
                                    <span className='text-gray-700'>Enjoy talking with people</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>✅</span>
                                    <span className='text-gray-700'>Have study-abroad or international experience</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>✅</span>
                                    <span className='text-gray-700'>University students welcome too!</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Schedule and Compensation */}
                    <div className='grid md:grid-cols-2 gap-8 mb-10'>
                        <section>
                            <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>Schedule</h3>
                            <div className='bg-gray-50 rounded-xl p-6'>
                                <p className='text-gray-700 mb-4'>This is a commission-based position with a flexible schedule. You can choose your working hours based on your personal life balance.</p>
                                <p className='text-gray-700 mb-6'>Each tour lasts between 2 to 5 hours, so you can work as much or as little as you like!</p>

                                <h4 className='font-semibold text-gray-800 mb-3'>Sample Tour Times:</h4>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <p className='font-semibold text-orange-600 mb-2'>Morning Tours:</p>
                                        <ul className='text-sm text-gray-600 space-y-1'>
                                            <li>• 7:00–12:00</li>
                                            <li>• 8:00–13:00</li>
                                            <li>• 9:00–14:00</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className='font-semibold text-purple-600 mb-2'>Evening Tours:</p>
                                        <ul className='text-sm text-gray-600 space-y-1'>
                                            <li>• 16:00–18:00</li>
                                            <li>• 17:00–19:00</li>
                                            <li>• 18:00–20:00</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>Compensation & Benefits</h3>
                            <div className='bg-gray-50 rounded-xl p-6'>
                                <div className='space-y-4'>
                                    <div className='flex items-center gap-3'>
                                        <span className='bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm'>¥</span>
                                        <div>
                                            <p className='font-semibold text-gray-800'>Hourly Pay: ¥1,650 – ¥2,250</p>
                                            <p className='text-sm text-gray-600'>Freelance contract</p>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className='bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm'>🚃</span>
                                        <span className='text-gray-700'>Travel expenses covered</span>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className='bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm'>📈</span>
                                        <span className='text-gray-700'>Raises based on performance</span>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className='bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm'>📚</span>
                                        <span className='text-gray-700'>Full training provided</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Application Process */}
                    <section className='mb-10'>
                        <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>How to Apply</h3>
                        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8'>
                            <div className='text-center space-y-4'>
                                <h4 className='font-semibold text-xl mb-4'>Ready to Apply?</h4>
                                <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                                    <a
                                        href="mailto:contact@tomodachitours.com"
                                        className='bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors'
                                    >
                                        Apply via Email
                                    </a>
                                    <a
                                        href="tel:+819059609701"
                                        className='border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors'
                                    >
                                        Call Us: 090-5960-9701
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Company Info */}
                    <section>
                        <h3 className='font-ubuntu text-2xl font-semibold text-gray-800 mb-6'>Company Information</h3>
                        <div className='grid md:grid-cols-2 gap-8 text-sm text-gray-600'>
                            <div>
                                <p><strong>Company:</strong> Tomodachi Tours</p>
                                <p><strong>Location:</strong> Higashiyama Ward, Kyoto 605-0832</p>
                                <p><strong>Representative:</strong> Shunsuke Hirota</p>
                            </div>
                            <div>
                                <p><strong>Job Type:</strong> Contract/Freelance</p>
                                <p><strong>Industry:</strong> Tourism & Travel</p>
                                <p><strong>Contact:</strong> contact@tomodachitours.com</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Jobs 
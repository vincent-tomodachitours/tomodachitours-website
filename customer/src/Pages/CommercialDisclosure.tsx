import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

const CommercialDisclosure: React.FC = () => {
    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
            <SEO
                title={seoData.commercialDisclosure.title}
                description={seoData.commercialDisclosure.description}
                keywords={seoData.commercialDisclosure.keywords}
            />
            <Header />

            <main className='flex-grow container mx-auto px-4 py-12 max-w-4xl'>
                <div className='space-y-8'>
                    {/* Header Section */}
                    <div className='text-center mb-12'>
                        <h1 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                            Commercial Disclosure
                        </h1>
                        <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full'></div>
                    </div>

                    {/* Content Card */}
                    <div className='bg-white rounded-2xl shadow-lg overflow-hidden'>
                        <div className='divide-y divide-gray-200'>
                            {[
                                { label: 'Legal Name', value: 'Tomodachi Tours' },
                                { label: 'Address', value: 'We will disclose without delay if requested.' },
                                { label: 'Phone Number', value: '+81 090 7826 3513' },
                                { label: 'Email Address', value: 'contact@tomodachitours.com' },
                                { label: 'Head of Operations', value: 'Shunsuke Hirota' },
                                { label: 'Additional Fees', value: 'Transportation and meals during the tour are at your expense.' },
                                {
                                    label: 'Cancellation Policy',
                                    value: (
                                        <Link
                                            to="/cancellation-policy"
                                            className='text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center gap-2'
                                        >
                                            <span>View Cancellation Policy</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </Link>
                                    )
                                },
                                { label: 'Date of Service', value: 'Date designated by the customer' },
                                { label: 'Accepted payment methods', value: 'Credit cards' },
                                { label: 'Payment period', value: 'Credit card payments are processed immediately' },
                                { label: 'Price', value: 'The amount shown on each product page (including tax)' }
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className='flex flex-col sm:flex-row py-4 px-6 gap-2 sm:gap-8'
                                >
                                    <div className='sm:w-1/3 font-semibold text-gray-700'>
                                        {item.label}
                                    </div>
                                    <div className='sm:w-2/3 text-gray-600'>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default CommercialDisclosure
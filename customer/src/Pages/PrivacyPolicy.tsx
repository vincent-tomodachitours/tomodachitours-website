import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

const PrivacyPolicy: React.FC = () => {
    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
            <SEO
                title={seoData.privacyPolicy.title}
                description={seoData.privacyPolicy.description}
                keywords={seoData.privacyPolicy.keywords}
            />
            <Header />

            <main className='flex-grow container mx-auto px-4 py-12 max-w-4xl'>
                <div className='space-y-8'>
                    {/* Header Section */}
                    <div className='text-center mb-12'>
                        <h1 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                            Privacy Policy
                        </h1>
                        <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full'></div>
                    </div>

                    {/* Main Content */}
                    <div className='bg-white rounded-2xl shadow-lg p-8 space-y-8'>
                        <p className='text-lg md:text-xl text-gray-700 font-medium'>
                            Your privacy is important to us. This Privacy Policy explains how Tomodachi Tours collects, uses, and protects your personal information.
                        </p>

                        {/* Information We Collect */}
                        <div className='space-y-4'>
                            <h2 className='text-2xl font-bold text-gray-900'>Information We Collect</h2>
                            <ul className='space-y-3'>
                                {[
                                    "Personal details (name, email, phone number) for booking confirmations",
                                    "Payment information processed securely through encrypted payment systems",
                                    "Tour preferences and special requirements to enhance your experience",
                                    "Website usage data through cookies to improve our services"
                                ].map((item, index) => (
                                    <li key={index} className='flex items-start space-x-3 text-gray-700'>
                                        <svg className='w-6 h-6 text-blue-500 flex-shrink-0 mt-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* How We Use Your Information */}
                        <div className='space-y-4'>
                            <h2 className='text-2xl font-bold text-gray-900'>How We Use Your Information</h2>
                            <ul className='space-y-3'>
                                {[
                                    "Process and confirm your tour bookings",
                                    "Communicate important updates about your scheduled tours",
                                    "Provide customer support and respond to your inquiries",
                                    "Send promotional offers (only with your consent)",
                                    "Improve our website and tour experiences based on feedback"
                                ].map((item, index) => (
                                    <li key={index} className='flex items-start space-x-3 text-gray-700'>
                                        <svg className='w-6 h-6 text-blue-500 flex-shrink-0 mt-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Data Protection */}
                        <div className='space-y-4'>
                            <h2 className='text-2xl font-bold text-gray-900'>Data Protection & Security</h2>
                            <ul className='space-y-3'>
                                {[
                                    "All payment data is processed through secure, encrypted channels",
                                    "We never store complete credit card information on our servers",
                                    "Personal information is protected with industry-standard security measures",
                                    "Access to your data is limited to authorized personnel only",
                                    "We regularly update our security protocols to protect your information"
                                ].map((item, index) => (
                                    <li key={index} className='flex items-start space-x-3 text-gray-700'>
                                        <svg className='w-6 h-6 text-blue-500 flex-shrink-0 mt-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Your Rights */}
                        <div className='space-y-4'>
                            <h2 className='text-2xl font-bold text-gray-900'>Your Rights</h2>
                            <ul className='space-y-3'>
                                {[
                                    "Request access to the personal information we hold about you",
                                    "Ask us to correct any inaccurate information",
                                    "Request deletion of your personal data (subject to legal requirements)",
                                    "Opt out of marketing communications at any time",
                                    "Lodge a complaint with relevant data protection authorities"
                                ].map((item, index) => (
                                    <li key={index} className='flex items-start space-x-3 text-gray-700'>
                                        <svg className='w-6 h-6 text-blue-500 flex-shrink-0 mt-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Third-Party Services */}
                        <div className='space-y-4'>
                            <h2 className='text-2xl font-bold text-gray-900'>Third-Party Services</h2>
                            <p className='text-gray-700'>
                                We work with trusted third-party services to enhance your experience, including payment processors,
                                booking systems, and analytics tools. These partners are carefully selected and bound by strict
                                confidentiality agreements. We do not sell your personal information to third parties.
                            </p>
                        </div>

                        {/* Contact & Updates */}
                        <div className='space-y-4'>
                            <h2 className='text-2xl font-bold text-gray-900'>Contact Us & Policy Updates</h2>
                            <p className='text-gray-700'>
                                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us.
                                We may update this policy periodically, and we'll notify you of any significant changes via email
                                or through our website.
                            </p>
                            <p className='text-sm text-gray-600 italic'>
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className='flex justify-center pt-8'>
                        <Link
                            to="/contact"
                            className='group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-300 ease-in-out'
                        >
                            <span className='absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-xl'></span>
                            <span className='relative flex items-center group-hover:translate-x-1 transition-transform duration-200'>
                                Contact Us About Privacy
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default PrivacyPolicy 
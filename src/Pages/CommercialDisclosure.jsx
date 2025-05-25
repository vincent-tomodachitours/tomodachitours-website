import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { Link } from 'react-router-dom'

const CommercialDisclosure = () => {
    return (
        <div className='bg-stone-300 w-full flex flex-col justify-between min-h-screen h-screen'>
            <Header />
            <div className='font-ubuntu mx-auto w-5/6 my-12'>
                <h1 className='font-ubuntu text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-12'>Commercial Disclosure</h1>
                <table className='table-auto border-collapse text-left'>
                    <tr>
                        <th className='border border-black'>Legal Name</th>
                        <th className='border border-black'>Tomodachi Tours</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Address</th>
                        <th className='border border-black'>We will disclose without delay if requested.</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Phone Number</th>
                        <th className='border border-black'>+81 090 7826 3513</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Email Address</th>
                        <th className='border border-black'>contact@tomodachitours.com</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Head of Operations</th>
                        <th className='border border-black'>Shunsuke Hirota</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Additional Fees</th>
                        <th className='border border-black'>Transportation and meals during the tour are at your expense.</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Cancellation Policy</th>
                        <th className='border border-black'><Link to="/cancellation-policy" className='font-ubuntu text-green-700 underline'>View Cancellation Policy</Link></th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Date of Service</th>
                        <th className='border border-black'>Date designated by the customer</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Accepted payment methods</th>
                        <th className='border border-black'>Credit cards</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Payment period</th>
                        <th className='border border-black'>Credit card payments are processed immediately</th>
                    </tr>
                    <tr>
                        <th className='border border-black'>Price</th>
                        <th className='border border-black'>The amount shown on each product page (including tax)</th>
                    </tr>
                </table>
            </div>
            <Footer />
        </div>
    )
}

export default CommercialDisclosure
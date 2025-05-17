import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { Link } from 'react-router-dom'

const CommercialDisclosure = () => {
    return (
        <div className='bg-stone-300 w-full flex flex-col min-h-screen'>
            <Header />
            <div className='font-ubuntu mx-auto mt-40'>
                <h1 className='font-ubuntu text-6xl mb-12'>Commercial Disclosure</h1>
                <table>
                    <tr>
                        <th>Legal Name</th>
                        <th>Tomodachi Tours</th>
                    </tr>
                    <tr>
                        <th>Address</th>
                        <th>We will disclose without delay if requested.</th>
                    </tr>
                    <tr>
                        <th>Phone Number</th>
                        <th>+81 090 7826 3513</th>
                    </tr>
                    <tr>
                        <th>Email Address</th>
                        <th>contact@tomodachitours.com</th>
                    </tr>
                    <tr>
                        <th>Head of Operations</th>
                        <th>Shunsuke Hirota</th>
                    </tr>
                    <tr>
                        <th>Additional Fees</th>
                        <th>Transportation and meals during the tour are at your expense.</th>
                    </tr>
                    <tr>
                        <th>Cancellation Policy</th>
                        <th><Link to="/cancellation-policy" className='font-ubuntu text-green-700 underline'>View Cancellation Policy</Link></th>
                    </tr>
                    <tr>
                        <th>Date of Service</th>
                        <th>Date designated by the customer</th>
                    </tr>
                    <tr>
                        <th>Accepted payment methods</th>
                        <th>Credit cards</th>
                    </tr>
                    <tr>
                        <th>Payment period</th>
                        <th>Credit card payments are processed immediately</th>
                    </tr>
                    <tr>
                        <th>Price</th>
                        <th>The amount shown on each product page (including tax)</th>
                    </tr>
                </table>
            </div>
            <Footer />
        </div>
    )
}

export default CommercialDisclosure
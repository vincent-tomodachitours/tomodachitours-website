import React from 'react'
import Header from '../Header'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

const Contact = () => {
    return (
        <div>
            <SEO
                title={seoData.contact.title}
                description={seoData.contact.description}
                keywords={seoData.contact.keywords}
            />
            <Header />
        </div>
    )
}

export default Contact
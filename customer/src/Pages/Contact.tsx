import React from 'react'
import Header from '../Components/Headers/Header1'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

const Contact: React.FC = () => {
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
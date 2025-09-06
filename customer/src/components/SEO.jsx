import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({
    title,
    description,
    keywords,
    image = '/logo-white.webp',
    type = 'website'
}) => {
    const location = useLocation();
    const baseUrl = 'https://tomodachitours.com';
    const currentUrl = `${baseUrl}${location.pathname}`;

    useEffect(() => {
        // Update document title
        document.title = title;

        // Update meta tags
        const updateMetaTag = (selector, content) => {
            let element = document.querySelector(selector);
            if (element) {
                if (selector.includes('property')) {
                    element.setAttribute('content', content);
                } else {
                    element.setAttribute('content', content);
                }
            }
        };

        // Update primary meta tags
        updateMetaTag('meta[name="title"]', title);
        updateMetaTag('meta[name="description"]', description);
        if (keywords) updateMetaTag('meta[name="keywords"]', keywords);

        // Update Open Graph tags
        updateMetaTag('meta[property="og:title"]', title);
        updateMetaTag('meta[property="og:description"]', description);
        updateMetaTag('meta[property="og:url"]', currentUrl);
        updateMetaTag('meta[property="og:image"]', `${baseUrl}${image}`);
        updateMetaTag('meta[property="og:type"]', type);

        // Update Twitter tags
        updateMetaTag('meta[property="twitter:title"]', title);
        updateMetaTag('meta[property="twitter:description"]', description);
        updateMetaTag('meta[property="twitter:url"]', currentUrl);
        updateMetaTag('meta[property="twitter:image"]', `${baseUrl}${image}`);

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute('href', currentUrl);
        }
    }, [title, description, keywords, image, type, currentUrl]);

    return null; // This component doesn't render anything
};

export default SEO;
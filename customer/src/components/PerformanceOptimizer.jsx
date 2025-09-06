import { useEffect } from 'react';

const PerformanceOptimizer = () => {
    useEffect(() => {
        // Preload critical resources
        const preloadCriticalResources = () => {
            // Preload hero image
            const heroImage = new Image();
            heroImage.src = '/IMG/Morning-Tour/bamboo-main-highres1.85.webp';

            // Preload critical fonts if any
            const fontLink = document.createElement('link');
            fontLink.rel = 'preload';
            fontLink.as = 'font';
            fontLink.type = 'font/woff2';
            fontLink.crossOrigin = 'anonymous';

            // Preconnect to external domains
            const preconnectDomains = [
                'https://js.pay.jp',
                'https://fonts.googleapis.com',
                'https://www.google-analytics.com'
            ];

            preconnectDomains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                document.head.appendChild(link);
            });
        };

        // Optimize images with lazy loading
        const optimizeImages = () => {
            const images = document.querySelectorAll('img[data-src]');

            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    });
                });

                images.forEach(img => imageObserver.observe(img));
            } else {
                // Fallback for browsers without IntersectionObserver
                images.forEach(img => {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                });
            }
        };

        // Measure and report Core Web Vitals
        const measureWebVitals = () => {
            // Only measure in production
            if (process.env.NODE_ENV === 'production') {
                import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                    getCLS(console.log);
                    getFID(console.log);
                    getFCP(console.log);
                    getLCP(console.log);
                    getTTFB(console.log);
                });
            }
        };

        // Optimize third-party scripts
        const optimizeThirdPartyScripts = () => {
            // Defer non-critical scripts
            const scripts = document.querySelectorAll('script[data-defer]');
            scripts.forEach(script => {
                script.defer = true;
            });
        };

        // Initialize optimizations
        preloadCriticalResources();
        optimizeImages();
        measureWebVitals();
        optimizeThirdPartyScripts();

        // Cleanup function
        return () => {
            // Clean up any observers or listeners if needed
        };
    }, []);

    return null; // This component doesn't render anything
};

export default PerformanceOptimizer;
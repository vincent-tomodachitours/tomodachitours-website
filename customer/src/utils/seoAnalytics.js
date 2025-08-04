// SEO Analytics and Performance Monitoring Utilities

export const trackSEOMetrics = () => {
    // Track Core Web Vitals for SEO performance
    if (typeof window !== 'undefined' && 'performance' in window) {
        // Track page load performance
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];

            const metrics = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
                firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
            };

            // Log metrics for monitoring (in production, send to analytics)
            if (process.env.NODE_ENV === 'production') {
                console.log('SEO Performance Metrics:', metrics);
                // Here you would send to your analytics service
                // sendToAnalytics('seo_performance', metrics);
            }
        });
    }
};

export const trackUserEngagement = () => {
    // Track user engagement metrics important for SEO
    let startTime = Date.now();
    let isActive = true;

    const trackTimeOnPage = () => {
        if (isActive) {
            const timeSpent = Date.now() - startTime;

            // Track significant engagement milestones
            if (timeSpent > 30000) { // 30 seconds
                console.log('User engaged for 30+ seconds');
            }
            if (timeSpent > 120000) { // 2 minutes
                console.log('User highly engaged (2+ minutes)');
            }
        }
    };

    // Track when user becomes inactive/active
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            isActive = false;
            trackTimeOnPage();
        } else {
            isActive = true;
            startTime = Date.now();
        }
    });

    // Track before page unload
    window.addEventListener('beforeunload', trackTimeOnPage);
};

export const trackSearchEngineReferrals = () => {
    // Track organic search traffic
    if (typeof document !== 'undefined') {
        const referrer = document.referrer;
        const searchEngines = [
            'google.com',
            'bing.com',
            'yahoo.com',
            'duckduckgo.com',
            'baidu.com'
        ];

        const isFromSearchEngine = searchEngines.some(engine =>
            referrer.includes(engine)
        );

        if (isFromSearchEngine) {
            console.log('Organic search traffic detected from:', referrer);

            // Track search keywords if available (limited due to privacy)
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('q') || urlParams.get('query');

            if (searchQuery) {
                console.log('Search query:', searchQuery);
            }
        }
    }
};

export const monitorSEOHealth = () => {
    // Monitor basic SEO health indicators
    const checkSEOElements = () => {
        const issues = [];

        // Check for title tag
        const title = document.querySelector('title');
        if (!title || title.textContent.length < 30 || title.textContent.length > 60) {
            issues.push('Title tag length should be 30-60 characters');
        }

        // Check for meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 120 || metaDesc.content.length > 160) {
            issues.push('Meta description should be 120-160 characters');
        }

        // Check for h1 tag
        const h1Tags = document.querySelectorAll('h1');
        if (h1Tags.length !== 1) {
            issues.push('Page should have exactly one H1 tag');
        }

        // Check for structured data
        const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
        if (structuredData.length === 0) {
            issues.push('No structured data found');
        }

        // Check for alt text on images
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images missing alt text`);
        }

        if (issues.length > 0 && process.env.NODE_ENV === 'development') {
            console.warn('SEO Issues Found:', issues);
        }

        return issues;
    };

    // Run SEO health check after page load
    if (typeof window !== 'undefined') {
        window.addEventListener('load', () => {
            setTimeout(checkSEOElements, 1000); // Wait for dynamic content
        });
    }
};

export const initializeSEOAnalytics = () => {
    // Initialize all SEO tracking
    trackSEOMetrics();
    trackUserEngagement();
    trackSearchEngineReferrals();
    monitorSEOHealth();
};

// Voice Search Optimization Tracking
export const trackVoiceSearchOptimization = () => {
    // Track if content is optimized for voice search
    const checkVoiceSearchReadiness = () => {
        const content = document.body.textContent.toLowerCase();

        // Check for question-based content (good for voice search)
        const questionWords = ['what', 'where', 'when', 'why', 'how', 'who'];
        const hasQuestions = questionWords.some(word =>
            content.includes(word + ' is') ||
            content.includes(word + ' are') ||
            content.includes(word + ' do')
        );

        // Check for conversational language
        const conversationalPhrases = [
            'you can',
            'we recommend',
            'best way to',
            'how to',
            'what you need'
        ];

        const hasConversationalContent = conversationalPhrases.some(phrase =>
            content.includes(phrase)
        );

        const voiceSearchScore = {
            hasQuestions,
            hasConversationalContent,
            readabilityGood: content.split(' ').length > 100 // Basic readability check
        };

        if (process.env.NODE_ENV === 'development') {
            console.log('Voice Search Optimization Score:', voiceSearchScore);
        }

        return voiceSearchScore;
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('load', () => {
            setTimeout(checkVoiceSearchReadiness, 2000);
        });
    }
};
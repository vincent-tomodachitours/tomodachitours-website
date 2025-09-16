// SEO Analytics and Performance Monitoring Utilities

// Type definitions for SEO analytics
interface SEOMetrics {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
}

interface VoiceSearchScore {
    hasQuestions: boolean;
    hasConversationalContent: boolean;
    readabilityGood: boolean;
}

// Type for performance navigation timing
interface PerformanceNavigationTiming extends PerformanceEntry {
    domContentLoadedEventStart: number;
    domContentLoadedEventEnd: number;
    loadEventStart: number;
    loadEventEnd: number;
}

// Type for paint timing entries
interface PerformancePaintTiming extends PerformanceEntry {
    name: 'first-paint' | 'first-contentful-paint';
    startTime: number;
}

export const trackSEOMetrics = (): void => {
    // Track Core Web Vitals for SEO performance
    if (typeof window !== 'undefined' && 'performance' in window) {
        // Track page load performance
        window.addEventListener('load', (): void => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

            const metrics: SEOMetrics = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: firstPaint?.startTime,
                firstContentfulPaint: firstContentfulPaint?.startTime
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

export const trackUserEngagement = (): void => {
    // Track user engagement metrics important for SEO
    let startTime: number = Date.now();
    let isActive: boolean = true;

    const trackTimeOnPage = (): void => {
        if (isActive) {
            const timeSpent: number = Date.now() - startTime;

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
    document.addEventListener('visibilitychange', (): void => {
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

export const trackSearchEngineReferrals = (): void => {
    // Track organic search traffic
    if (typeof document !== 'undefined') {
        const referrer: string = document.referrer;
        const searchEngines: string[] = [
            'google.com',
            'bing.com',
            'yahoo.com',
            'duckduckgo.com',
            'baidu.com'
        ];

        const isFromSearchEngine: boolean = searchEngines.some((engine: string) =>
            referrer.includes(engine)
        );

        if (isFromSearchEngine) {
            console.log('Organic search traffic detected from:', referrer);

            // Track search keywords if available (limited due to privacy)
            const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
            const searchQuery: string | null = urlParams.get('q') || urlParams.get('query');

            if (searchQuery) {
                console.log('Search query:', searchQuery);
            }
        }
    }
};

export const monitorSEOHealth = (): void => {
    // Monitor basic SEO health indicators
    const checkSEOElements = (): string[] => {
        const issues: string[] = [];

        // Check for title tag
        const title: HTMLTitleElement | null = document.querySelector('title');
        if (!title || title.textContent!.length < 30 || title.textContent!.length > 60) {
            issues.push('Title tag length should be 30-60 characters');
        }

        // Check for meta description
        const metaDesc: HTMLMetaElement | null = document.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 120 || metaDesc.content.length > 160) {
            issues.push('Meta description should be 120-160 characters');
        }

        // Check for h1 tag
        const h1Tags: NodeListOf<HTMLHeadingElement> = document.querySelectorAll('h1');
        if (h1Tags.length !== 1) {
            issues.push('Page should have exactly one H1 tag');
        }

        // Check for structured data
        const structuredData: NodeListOf<HTMLScriptElement> = document.querySelectorAll('script[type="application/ld+json"]');
        if (structuredData.length === 0) {
            issues.push('No structured data found');
        }

        // Check for alt text on images
        const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('img');
        const imagesWithoutAlt: HTMLImageElement[] = Array.from(images).filter((img: HTMLImageElement) => !img.alt);
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
        window.addEventListener('load', (): void => {
            setTimeout(checkSEOElements, 1000); // Wait for dynamic content
        });
    }
};

export const initializeSEOAnalytics = (): void => {
    // Initialize all SEO tracking
    trackSEOMetrics();
    trackUserEngagement();
    trackSearchEngineReferrals();
    monitorSEOHealth();
};

// Voice Search Optimization Tracking
export const trackVoiceSearchOptimization = (): void => {
    // Track if content is optimized for voice search
    const checkVoiceSearchReadiness = (): VoiceSearchScore => {
        const content: string = document.body.textContent!.toLowerCase();

        // Check for question-based content (good for voice search)
        const questionWords: string[] = ['what', 'where', 'when', 'why', 'how', 'who'];
        const hasQuestions: boolean = questionWords.some((word: string) =>
            content.includes(word + ' is') ||
            content.includes(word + ' are') ||
            content.includes(word + ' do')
        );

        // Check for conversational language
        const conversationalPhrases: string[] = [
            'you can',
            'we recommend',
            'best way to',
            'how to',
            'what you need'
        ];

        const hasConversationalContent: boolean = conversationalPhrases.some((phrase: string) =>
            content.includes(phrase)
        );

        const voiceSearchScore: VoiceSearchScore = {
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
        window.addEventListener('load', (): void => {
            setTimeout(checkVoiceSearchReadiness, 2000);
        });
    }
};
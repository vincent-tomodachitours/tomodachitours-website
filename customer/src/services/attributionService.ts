// Attribution Service for UTM parameter capture and attribution chain tracking
// Handles multi-touch attribution for Google Ads and GA4 integration

interface UTMParameters {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    gclid: string | null;
    fbclid: string | null;
    msclkid: string | null;
}

interface ReferrerData {
    referrer: string;
    referrer_domain: string;
    referrer_type: string;
}

interface AttributionData {
    timestamp: number;
    session_id: string;
    source: string;
    medium: string;
    campaign: string | null;
    term: string | null;
    content: string | null;
    gclid: string | null;
    fbclid: string | null;
    msclkid: string | null;
    landing_page: string;
    referrer: string;
    referrer_domain: string;
    referrer_type: string;
    user_agent: string;
    screen_resolution: string;
    viewport_size: string;
}

interface AttributionChainItem {
    timestamp: number;
    source: string;
    medium: string;
    campaign: string | null;
    gclid: string | null;
    landing_page: string;
}

interface GCLIDData {
    gclid: string;
    timestamp: number;
    expiration: number;
    source: string;
    medium: string;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
    landing_page: string;
    user_agent: string;
    ip_hash: string;
}

interface CrossDeviceData {
    device_id: string;
    timestamp: number;
    user_agent: string;
    screen_resolution: string;
    timezone: string;
    language: string;
    platform: string;
    ip_hash: string;
    gclid?: string | null;
    attribution_data?: AttributionData;
    session_id: string;
}

interface EnhancedConversionData {
    gclid?: string | null;
    device_id?: string;
    user_agent: string;
    timestamp: number;
    conversion_environment: {
        user_agent: string;
        language: string;
        screen_resolution: string;
        timezone: string;
    };
}

interface AnalyticsAttributionData {
    first_source?: string;
    first_medium?: string;
    first_campaign?: string | null;
    source: string;
    medium: string;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
    gclid?: string | null;
    session_id: string;
    landing_page: string;
    referrer: string;
    touchpoints: number;
    attribution_chain: AttributionChainItem[];
}

class AttributionService {
    private sessionStorageKey: string = 'attribution_data';
    private attributionChainKey: string = 'attribution_chain';
    private gclidStorageKey: string = 'gclid_data';
    private crossDeviceStorageKey: string = 'cross_device_data';
    private sessionTimeoutMs: number = 30 * 60 * 1000; // 30 minutes
    private gclidExpirationMs: number = 90 * 24 * 60 * 60 * 1000; // 90 days

    /**
     * Parse UTM parameters from URL
     * @param url - URL to parse (defaults to current URL)
     * @returns UTM parameters object
     */
    parseUTMParameters(url: string = window.location.href): UTMParameters {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;

        return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_term: params.get('utm_term'),
            utm_content: params.get('utm_content'),
            gclid: params.get('gclid'), // Google Ads click ID
            fbclid: params.get('fbclid'), // Facebook click ID
            msclkid: params.get('msclkid'), // Microsoft Ads click ID
        };
    }

    /**
     * Get referrer information
     * @returns Referrer data
     */
    getReferrerData(): ReferrerData {
        const referrer = document.referrer;
        let referrerDomain = '';
        let referrerType = 'direct';

        if (referrer) {
            try {
                const referrerUrl = new URL(referrer);
                referrerDomain = referrerUrl.hostname;

                // Classify referrer type
                if (referrerDomain.includes('google')) {
                    referrerType = 'organic_search';
                } else if (referrerDomain.includes('facebook') || referrerDomain.includes('instagram')) {
                    referrerType = 'social';
                } else if (referrerDomain.includes('bing') || referrerDomain.includes('yahoo')) {
                    referrerType = 'organic_search';
                } else if (referrerDomain !== window.location.hostname) {
                    referrerType = 'referral';
                }
            } catch (error) {
                console.warn('Error parsing referrer:', error);
            }
        }

        return {
            referrer,
            referrer_domain: referrerDomain,
            referrer_type: referrerType
        };
    }

    /**
     * Capture current attribution data
     * @returns Complete attribution data
     */
    captureAttributionData(): AttributionData {
        const timestamp = Date.now();
        const utmParams = this.parseUTMParameters();
        const referrerData = this.getReferrerData();

        // Determine traffic source
        let source = 'direct';
        let medium = 'none';

        if (utmParams.utm_source) {
            source = utmParams.utm_source;
            medium = utmParams.utm_medium || 'unknown';
        } else if (utmParams.gclid) {
            source = 'google';
            medium = 'cpc';
        } else if (utmParams.fbclid) {
            source = 'facebook';
            medium = 'cpc';
        } else if (referrerData.referrer_type === 'organic_search') {
            source = referrerData.referrer_domain;
            medium = 'organic';
        } else if (referrerData.referrer_type === 'social') {
            source = referrerData.referrer_domain;
            medium = 'social';
        } else if (referrerData.referrer_type === 'referral') {
            source = referrerData.referrer_domain;
            medium = 'referral';
        }

        return {
            timestamp,
            session_id: this.getOrCreateSessionId(),
            source,
            medium,
            campaign: utmParams.utm_campaign,
            term: utmParams.utm_term,
            content: utmParams.utm_content,
            gclid: utmParams.gclid,
            fbclid: utmParams.fbclid,
            msclkid: utmParams.msclkid,
            landing_page: window.location.pathname + window.location.search,
            referrer: referrerData.referrer,
            referrer_domain: referrerData.referrer_domain,
            referrer_type: referrerData.referrer_type,
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        };
    }

    /**
     * Get or create session ID
     * @returns Session ID
     */
    getOrCreateSessionId(): string {
        const sessionKey = 'attribution_session_id';
        const sessionTimeKey = 'attribution_session_time';

        let sessionId = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem(sessionKey) : null;
        const sessionTime = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem(sessionTimeKey) : null;

        // Check if session has expired
        if (!sessionId || !sessionTime || (Date.now() - parseInt(sessionTime)) > this.sessionTimeoutMs) {
            sessionId = this.generateSessionId();
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(sessionKey, sessionId);
            }
        }

        // Update session time
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(sessionTimeKey, Date.now().toString());
        }

        return sessionId;
    }

    /**
     * Generate unique session ID
     * @returns Unique session ID
     */
    generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Store attribution data in session storage
     * @param attributionData - Attribution data to store
     */
    storeAttributionData(attributionData: AttributionData): void {
        try {
            // Store current attribution data (browser only)
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(attributionData));
            }

            // Add to attribution chain
            this.addToAttributionChain(attributionData);

            console.log('Attribution data stored:', attributionData);
        } catch (error) {
            console.error('Error storing attribution data:', error);
        }
    }

    /**
     * Get current attribution data from storage
     * @returns Current attribution data
     */
    getAttributionData(): AttributionData | null {
        try {
            if (typeof sessionStorage === 'undefined') return null;

            const data = sessionStorage.getItem(this.sessionStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving attribution data:', error);
            return null;
        }
    }

    /**
     * Add attribution data to the attribution chain
     * @param attributionData - Attribution data to add
     */
    addToAttributionChain(attributionData: AttributionData): void {
        try {
            let chain = this.getAttributionChain();

            // Check if this is a new source/medium combination
            const isDifferentSource = !chain.length ||
                chain[chain.length - 1].source !== attributionData.source ||
                chain[chain.length - 1].medium !== attributionData.medium;

            if (isDifferentSource) {
                chain.push({
                    timestamp: attributionData.timestamp,
                    source: attributionData.source,
                    medium: attributionData.medium,
                    campaign: attributionData.campaign,
                    gclid: attributionData.gclid,
                    landing_page: attributionData.landing_page
                });

                // Keep only last 10 touchpoints to prevent storage bloat
                if (chain.length > 10) {
                    chain = chain.slice(-10);
                }

                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem(this.attributionChainKey, JSON.stringify(chain));
                }
            }
        } catch (error) {
            console.error('Error updating attribution chain:', error);
        }
    }

    /**
     * Get attribution chain from storage
     * @returns Attribution chain
     */
    getAttributionChain(): AttributionChainItem[] {
        try {
            if (typeof sessionStorage === 'undefined') return [];

            const chain = sessionStorage.getItem(this.attributionChainKey);
            return chain ? JSON.parse(chain) : [];
        } catch (error) {
            console.error('Error retrieving attribution chain:', error);
            return [];
        }
    }

    /**
     * Initialize attribution tracking on page load
     */
    initialize(): void {
        // Only capture new attribution if there are UTM parameters or it's a new session
        const currentAttribution = this.getAttributionData();
        const hasUTMParams = Object.values(this.parseUTMParameters()).some(value => value !== null);

        if (!currentAttribution || hasUTMParams) {
            const attributionData = this.captureAttributionData();
            this.storeAttributionData(attributionData);
        }
    }

    /**
     * Get attribution data for analytics events
     * @returns Attribution data formatted for analytics
     */
    getAttributionForAnalytics(): AnalyticsAttributionData | Record<string, never> {
        const attribution = this.getAttributionData();
        const chain = this.getAttributionChain();

        if (!attribution) return {};

        return {
            // First-touch attribution
            first_source: chain.length > 0 ? chain[0].source : attribution.source,
            first_medium: chain.length > 0 ? chain[0].medium : attribution.medium,
            first_campaign: chain.length > 0 ? chain[0].campaign : attribution.campaign,

            // Last-touch attribution (current)
            source: attribution.source,
            medium: attribution.medium,
            campaign: attribution.campaign,
            term: attribution.term,
            content: attribution.content,
            gclid: attribution.gclid,

            // Session data
            session_id: attribution.session_id,
            landing_page: attribution.landing_page,
            referrer: attribution.referrer,

            // Attribution chain length
            touchpoints: chain.length,
            attribution_chain: chain
        };
    }    /**
 
    * Store GCLID data with extended expiration for cross-device tracking
     * @param gclid - Google Click ID
     * @param additionalData - Additional attribution data
     */
    storeGCLID(gclid: string, additionalData: Partial<AttributionData> = {}): void {
        if (!gclid) return;

        try {
            const gclidData: GCLIDData = {
                gclid,
                timestamp: Date.now(),
                expiration: Date.now() + this.gclidExpirationMs,
                source: additionalData.source || 'google',
                medium: additionalData.medium || 'cpc',
                campaign: additionalData.campaign,
                term: additionalData.term,
                content: additionalData.content,
                landing_page: additionalData.landing_page || window.location.pathname + window.location.search,
                user_agent: navigator.userAgent,
                ip_hash: this.generateIPHash() // For cross-device matching
            };

            // Store in localStorage for longer persistence across sessions (browser only)
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.gclidStorageKey, JSON.stringify(gclidData));
            }
            console.log('GCLID stored for cross-device tracking:', gclid);
        } catch (error) {
            console.error('Error storing GCLID:', error);
        }
    }

    /**
     * Get stored GCLID data if not expired
     * @returns GCLID data or null if expired/not found
     */
    getStoredGCLID(): GCLIDData | null {
        try {
            if (typeof localStorage === 'undefined') return null;

            const gclidData = localStorage.getItem(this.gclidStorageKey);
            if (!gclidData) return null;

            const parsed: GCLIDData = JSON.parse(gclidData);

            // Check if expired
            if (Date.now() > parsed.expiration) {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(this.gclidStorageKey);
                }
                return null;
            }

            return parsed;
        } catch (error) {
            console.error('Error retrieving GCLID:', error);
            return null;
        }
    }

    /**
     * Generate a simple hash of IP address for cross-device matching
     * Note: This is a simplified approach - production should use more sophisticated methods
     * @returns Simple hash for cross-device identification
     */
    generateIPHash(): string {
        // In a real implementation, this would be done server-side
        // For now, we'll use a combination of user agent and screen resolution
        const identifier = navigator.userAgent + window.screen.width + window.screen.height;
        return btoa(identifier).substring(0, 16);
    }

    /**
     * Store cross-device attribution data
     * @param deviceData - Device and user identification data
     */
    storeCrossDeviceData(deviceData: { gclid?: string; attribution_data?: AttributionData }): void {
        try {
            const crossDeviceData: CrossDeviceData = {
                device_id: this.generateDeviceId(),
                timestamp: Date.now(),
                user_agent: navigator.userAgent,
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: (navigator as any).userAgentData?.platform || navigator.platform || 'unknown',
                ip_hash: this.generateIPHash(),
                gclid: deviceData.gclid,
                attribution_data: deviceData.attribution_data,
                session_id: this.getOrCreateSessionId()
            };

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.crossDeviceStorageKey, JSON.stringify(crossDeviceData));
            }
            console.log('Cross-device data stored');
        } catch (error) {
            console.error('Error storing cross-device data:', error);
        }
    }

    /**
     * Generate a device identifier for cross-device tracking
     * @returns Device identifier
     */
    generateDeviceId(): string {
        if (typeof localStorage === 'undefined') {
            return 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 14);
        }

        const existingId = localStorage.getItem('device_id');
        if (existingId) return existingId;

        const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 14);
        localStorage.setItem('device_id', deviceId);
        return deviceId;
    }

    /**
     * Get cross-device attribution data
     * @returns Cross-device data
     */
    getCrossDeviceData(): CrossDeviceData | null {
        try {
            if (typeof localStorage === 'undefined') return null;

            const data = localStorage.getItem(this.crossDeviceStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving cross-device data:', error);
            return null;
        }
    }

    /**
     * Enhanced initialization that includes GCLID and cross-device tracking
     */
    initializeWithCrossDevice(): void {
        // Standard initialization
        this.initialize();

        // Handle GCLID storage
        const utmParams = this.parseUTMParameters();
        if (utmParams.gclid) {
            const attributionData = this.getAttributionData();
            this.storeGCLID(utmParams.gclid, attributionData || {});

            // Store cross-device data
            this.storeCrossDeviceData({
                gclid: utmParams.gclid,
                attribution_data: attributionData || undefined
            });
        }
    }

    /**
     * Get attribution data enhanced with cross-device information
     * @returns Enhanced attribution data
     */
    getEnhancedAttributionForAnalytics(): any {
        const baseAttribution = this.getAttributionForAnalytics();
        const gclidData = this.getStoredGCLID();
        const crossDeviceData = this.getCrossDeviceData();

        return {
            ...baseAttribution,
            // Cross-device attribution
            stored_gclid: gclidData?.gclid,
            gclid_timestamp: gclidData?.timestamp,
            device_id: crossDeviceData?.device_id,
            cross_device_available: !!crossDeviceData,
            // Enhanced conversion data for Google Ads
            enhanced_conversion_data: this.getEnhancedConversionData()
        };
    }

    /**
     * Get enhanced conversion data for Google's enhanced conversions
     * @returns Enhanced conversion data
     */
    getEnhancedConversionData(): EnhancedConversionData {
        const gclidData = this.getStoredGCLID();
        const crossDeviceData = this.getCrossDeviceData();

        return {
            gclid: gclidData?.gclid,
            device_id: crossDeviceData?.device_id,
            user_agent: navigator.userAgent,
            timestamp: Date.now(),
            // Additional data for enhanced conversions
            conversion_environment: {
                user_agent: navigator.userAgent,
                language: navigator.language,
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
    }

    /**
     * Prepare offline conversion data for server-side processing
     * @param conversionData - Conversion data
     * @returns Offline conversion data ready for server processing
     */
    prepareOfflineConversionData(conversionData: Record<string, any>): Record<string, any> {
        const gclidData = this.getStoredGCLID();
        const attribution = this.getAttributionData();
        const crossDeviceData = this.getCrossDeviceData();

        return {
            // Core conversion data
            ...conversionData,

            // Attribution data
            gclid: gclidData?.gclid || attribution?.gclid,
            attribution_source: attribution?.source,
            attribution_medium: attribution?.medium,
            attribution_campaign: attribution?.campaign,

            // Cross-device data
            device_id: crossDeviceData?.device_id,
            original_timestamp: gclidData?.timestamp,
            conversion_timestamp: Date.now(),

            // Enhanced conversion data
            enhanced_conversion_data: this.getEnhancedConversionData(),

            // Attribution chain for multi-touch attribution
            attribution_chain: this.getAttributionChain(),

            // Session data
            session_id: this.getOrCreateSessionId(),

            // Environment data
            user_agent: navigator.userAgent,
            landing_page: gclidData?.landing_page || attribution?.landing_page
        };
    }

    /**
     * Clear attribution data (useful for testing or privacy compliance)
     */
    clearAttributionData(): void {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(this.sessionStorageKey);
            sessionStorage.removeItem(this.attributionChainKey);
            sessionStorage.removeItem('attribution_session_id');
            sessionStorage.removeItem('attribution_session_time');
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.gclidStorageKey);
            localStorage.removeItem(this.crossDeviceStorageKey);
            localStorage.removeItem('device_id');
        }
    }
}

// Create singleton instance
const attributionService = new AttributionService();

export default attributionService;
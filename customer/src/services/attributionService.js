// Attribution Service for UTM parameter capture and attribution chain tracking
// Handles multi-touch attribution for Google Ads and GA4 integration

class AttributionService {
    constructor() {
        this.sessionStorageKey = 'attribution_data';
        this.attributionChainKey = 'attribution_chain';
        this.gclidStorageKey = 'gclid_data';
        this.crossDeviceStorageKey = 'cross_device_data';
        this.sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes
        this.gclidExpirationMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    }

    /**
     * Parse UTM parameters from URL
     * @param {string} url - URL to parse (defaults to current URL)
     * @returns {Object} UTM parameters object
     */
    parseUTMParameters(url = window.location.href) {
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
     * @returns {Object} Referrer data
     */
    getReferrerData() {
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
         * @returns {Object} Complete attribution data
         */
    captureAttributionData() {
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
     * @returns {string} Session ID
     */
    getOrCreateSessionId() {
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
     * @returns {string} Unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Store attribution data in session storage
     * @param {Object} attributionData - Attribution data to store
     */
    storeAttributionData(attributionData) {
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
     * @returns {Object|null} Current attribution data
     */
    getAttributionData() {
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
     * @param {Object} attributionData - Attribution data to add
     */
    addToAttributionChain(attributionData) {
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
     * @returns {Array} Attribution chain
     */
    getAttributionChain() {
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
    initialize() {
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
     * @returns {Object} Attribution data formatted for analytics
     */
    getAttributionForAnalytics() {
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
    }

    /**
     * Store GCLID data with extended expiration for cross-device tracking
     * @param {string} gclid - Google Click ID
     * @param {Object} additionalData - Additional attribution data
     */
    storeGCLID(gclid, additionalData = {}) {
        if (!gclid) return;

        try {
            const gclidData = {
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
     * @returns {Object|null} GCLID data or null if expired/not found
     */
    getStoredGCLID() {
        try {
            if (typeof localStorage === 'undefined') return null;

            const gclidData = localStorage.getItem(this.gclidStorageKey);
            if (!gclidData) return null;

            const parsed = JSON.parse(gclidData);

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
     * @returns {string} Simple hash for cross-device identification
     */
    generateIPHash() {
        // In a real implementation, this would be done server-side
        // For now, we'll use a combination of user agent and screen resolution
        const identifier = navigator.userAgent + window.screen.width + window.screen.height;
        return btoa(identifier).substring(0, 16);
    }

    /**
     * Store cross-device attribution data
     * @param {Object} deviceData - Device and user identification data
     */
    storeCrossDeviceData(deviceData) {
        try {
            const crossDeviceData = {
                device_id: this.generateDeviceId(),
                timestamp: Date.now(),
                user_agent: navigator.userAgent,
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform,
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
     * @returns {string} Device identifier
     */
    generateDeviceId() {
        if (typeof localStorage === 'undefined') {
            return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
        }

        const existingId = localStorage.getItem('device_id');
        if (existingId) return existingId;

        const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
        localStorage.setItem('device_id', deviceId);
        return deviceId;
    }

    /**
     * Get cross-device attribution data
     * @returns {Object|null} Cross-device data
     */
    getCrossDeviceData() {
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
    initializeWithCrossDevice() {
        // Standard initialization
        this.initialize();

        // Handle GCLID storage
        const utmParams = this.parseUTMParameters();
        if (utmParams.gclid) {
            const attributionData = this.getAttributionData();
            this.storeGCLID(utmParams.gclid, attributionData);

            // Store cross-device data
            this.storeCrossDeviceData({
                gclid: utmParams.gclid,
                attribution_data: attributionData
            });
        }
    }

    /**
     * Get attribution data enhanced with cross-device information
     * @returns {Object} Enhanced attribution data
     */
    getEnhancedAttributionForAnalytics() {
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
     * @returns {Object} Enhanced conversion data
     */
    getEnhancedConversionData() {
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
     * @param {Object} conversionData - Conversion data
     * @returns {Object} Offline conversion data ready for server processing
     */
    prepareOfflineConversionData(conversionData) {
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
    clearAttributionData() {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(this.sessionStorageKey);
            sessionStorage.removeItem(this.attributionChainKey);
        }
        if (typeof sessionStorage !== 'undefined') {
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
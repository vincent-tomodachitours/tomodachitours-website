/**
 * Privacy Manager Service
 * Handles GDPR compliance, cookie consent, and privacy preferences
 */

// Privacy consent types
export const CONSENT_TYPES = {
    NECESSARY: 'necessary',
    ANALYTICS: 'analytics',
    MARKETING: 'marketing',
    PREFERENCES: 'preferences'
} as const;

type ConsentType = typeof CONSENT_TYPES[keyof typeof CONSENT_TYPES];

// Storage keys for privacy preferences
const STORAGE_KEYS = {
    CONSENT_STATUS: 'privacy_consent_status',
    CONSENT_TIMESTAMP: 'privacy_consent_timestamp',
    CONSENT_VERSION: 'privacy_consent_version',
    USER_PREFERENCES: 'privacy_user_preferences'
} as const;

// Current consent version (increment when privacy policy changes)
const CONSENT_VERSION = '1.0';

// Consent expiry time (in milliseconds) - 13 months as per GDPR recommendations
const CONSENT_EXPIRY = 13 * 30 * 24 * 60 * 60 * 1000;

interface ConsentPreferences {
    [CONSENT_TYPES.NECESSARY]: boolean;
    [CONSENT_TYPES.ANALYTICS]: boolean;
    [CONSENT_TYPES.MARKETING]: boolean;
    [CONSENT_TYPES.PREFERENCES]: boolean;
}

type ConsentCallback = (preferences: ConsentPreferences) => void;

class PrivacyManager {
    private consentCallbacks: Map<number, ConsentCallback>;
    private initialized: boolean;
    private defaultConsent: ConsentPreferences;
    private consentRequired: boolean = false;
    private consentPreferences: ConsentPreferences;

    constructor() {
        this.consentCallbacks = new Map();
        this.initialized = false;
        this.defaultConsent = {
            [CONSENT_TYPES.NECESSARY]: true, // Always required
            [CONSENT_TYPES.ANALYTICS]: false,
            [CONSENT_TYPES.MARKETING]: false,
            [CONSENT_TYPES.PREFERENCES]: false
        };
        this.consentPreferences = { ...this.defaultConsent };
    }

    /**
     * Initialize privacy manager
     */
    initialize(): void {
        if (this.initialized) return;

        // Check if consent is required (EU users or explicit opt-in)
        this.consentRequired = this.isConsentRequired();

        // Load existing consent preferences
        this.loadConsentPreferences();

        // Set up consent banner if needed
        if (this.consentRequired && !this.hasValidConsent()) {
            this.showConsentBanner();
        }

        this.initialized = true;
        console.log('Privacy Manager initialized');
    }

    /**
     * Check if consent is required based on user location or configuration
     */
    private isConsentRequired(): boolean {
        // In development mode, don't require consent for easier testing
        if (process.env['NODE_ENV'] === 'development') {
            return false;
        }

        // In production, you might want to check user's location via IP geolocation
        // For now, we'll require consent for all users to be safe
        return true;
    }

    /**
     * Check if user has valid consent
     */
    hasValidConsent(): boolean {
        try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                return false;
            }

            const consentStatus = localStorage.getItem(STORAGE_KEYS.CONSENT_STATUS);
            const consentTimestamp = localStorage.getItem(STORAGE_KEYS.CONSENT_TIMESTAMP);
            const consentVersion = localStorage.getItem(STORAGE_KEYS.CONSENT_VERSION);

            if (!consentStatus || !consentTimestamp || !consentVersion) {
                return false;
            }

            // Check if consent has expired
            const timestamp = parseInt(consentTimestamp);
            const now = Date.now();
            if (now - timestamp > CONSENT_EXPIRY) {
                return false;
            }

            // Check if consent version is current
            if (consentVersion !== CONSENT_VERSION) {
                return false;
            }

            return true;
        } catch (error) {
            console.warn('Error checking consent validity:', error);
            return false;
        }
    }

    /**
     * Load consent preferences from storage
     */
    private loadConsentPreferences(): void {
        try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                return;
            }

            const storedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
            if (storedPreferences && this.hasValidConsent()) {
                this.consentPreferences = JSON.parse(storedPreferences);
            } else {
                this.consentPreferences = { ...this.defaultConsent };
            }
        } catch (error) {
            console.warn('Error loading consent preferences:', error);
            this.consentPreferences = { ...this.defaultConsent };
        }
    }

    /**
     * Save consent preferences to storage
     */
    saveConsentPreferences(preferences: Partial<ConsentPreferences>): void {
        try {
            this.consentPreferences = { ...this.defaultConsent, ...preferences };

            // Only save to localStorage if in browser environment
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(this.consentPreferences));
                localStorage.setItem(STORAGE_KEYS.CONSENT_STATUS, 'granted');
                localStorage.setItem(STORAGE_KEYS.CONSENT_TIMESTAMP, Date.now().toString());
                localStorage.setItem(STORAGE_KEYS.CONSENT_VERSION, CONSENT_VERSION);
            }

            // Notify all registered callbacks
            this.notifyConsentCallbacks();

            // Hide consent banner
            this.hideConsentBanner();

            console.log('Consent preferences saved:', this.consentPreferences);
        } catch (error) {
            console.error('Error saving consent preferences:', error);
        }
    }

    /**
     * Get current consent status for a specific type
     */
    hasConsent(consentType: ConsentType): boolean {
        if (!this.consentRequired) {
            return true; // If consent not required, allow all tracking
        }

        if (!this.consentPreferences) {
            return consentType === CONSENT_TYPES.NECESSARY;
        }

        return this.consentPreferences[consentType] === true;
    }

    /**
     * Get all consent preferences
     */
    getConsentPreferences(): ConsentPreferences {
        return { ...this.consentPreferences };
    }

    /**
     * Register callback for consent changes
     */
    onConsentChange(callback: ConsentCallback): number {
        const callbackId = Date.now() + Math.random();
        this.consentCallbacks.set(callbackId, callback);

        // Call immediately with current consent status
        try {
            callback(this.getConsentPreferences());
        } catch (error) {
            console.error('Error in consent callback:', error);
        }

        return callbackId;
    }

    /**
     * Unregister consent change callback
     */
    offConsentChange(callbackId: number): void {
        this.consentCallbacks.delete(callbackId);
    }

    /**
     * Notify all registered callbacks of consent changes
     */
    private notifyConsentCallbacks(): void {
        const preferences = this.getConsentPreferences();
        this.consentCallbacks.forEach(callback => {
            try {
                callback(preferences);
            } catch (error) {
                console.error('Error in consent callback:', error);
            }
        });
    }

    /**
     * Accept all consent types
     */
    acceptAllConsent(): void {
        const allConsent: ConsentPreferences = {
            [CONSENT_TYPES.NECESSARY]: true,
            [CONSENT_TYPES.ANALYTICS]: true,
            [CONSENT_TYPES.MARKETING]: true,
            [CONSENT_TYPES.PREFERENCES]: true
        };
        this.saveConsentPreferences(allConsent);
    }

    /**
     * Accept only necessary cookies
     */
    acceptNecessaryOnly(): void {
        const necessaryOnly: ConsentPreferences = {
            [CONSENT_TYPES.NECESSARY]: true,
            [CONSENT_TYPES.ANALYTICS]: false,
            [CONSENT_TYPES.MARKETING]: false,
            [CONSENT_TYPES.PREFERENCES]: false
        };
        this.saveConsentPreferences(necessaryOnly);
    }

    /**
     * Revoke all consent (except necessary)
     */
    revokeConsent(): void {
        this.acceptNecessaryOnly();

        // Clear tracking data if possible
        this.clearTrackingData();
    }

    /**
     * Clear tracking data for privacy compliance
     */
    private clearTrackingData(): void {
        try {
            // Clear analytics-related localStorage items (only in browser environment)
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (
                        key.startsWith('_ga') ||
                        key.startsWith('_gid') ||
                        key.startsWith('attribution_') ||
                        key.startsWith('remarketing_')
                    )) {
                        keysToRemove.push(key);
                    }
                }

                keysToRemove.forEach(key => localStorage.removeItem(key));
            }

            // Clear analytics cookies if possible
            this.clearAnalyticsCookies();

            console.log('Tracking data cleared for privacy compliance');
        } catch (error) {
            console.error('Error clearing tracking data:', error);
        }
    }

    /**
     * Clear analytics cookies
     */
    private clearAnalyticsCookies(): void {
        try {
            // List of common analytics cookies to clear
            const cookiesToClear = [
                '_ga', '_gid', '_gat', '_gtag_GA_', '_gcl_au', '_gcl_aw',
                'AMP_TOKEN', '__utma', '__utmb', '__utmc', '__utmt', '__utmz'
            ];

            cookiesToClear.forEach(cookieName => {
                // Clear for current domain
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                // Clear for parent domain
                const domain = window.location.hostname.split('.').slice(-2).join('.');
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
            });
        } catch (error) {
            console.error('Error clearing analytics cookies:', error);
        }
    }

    /**
     * Show consent banner (basic implementation)
     */
    private showConsentBanner(): void {
        // Skip banner creation in test environment
        if (typeof jest !== 'undefined') {
            console.log('Consent banner would be shown (test environment)');
            return;
        }

        // Remove existing banner if present
        this.hideConsentBanner();

        const banner = document.createElement('div');
        banner.id = 'privacy-consent-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #2c3e50;
                color: white;
                padding: 20px;
                z-index: 10000;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            ">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 300px;">
                        <p style="margin: 0 0 10px 0;">
                            We use cookies to enhance your experience and analyze our website traffic. 
                            By clicking "Accept All", you consent to our use of cookies for analytics and marketing.
                        </p>
                        <a href="/privacy-policy" target="_blank" style="color: #3498db; text-decoration: underline;">
                            Learn more in our Privacy Policy
                        </a>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="privacy-accept-necessary" style="
                            background: transparent;
                            border: 1px solid white;
                            color: white;
                            padding: 10px 20px;
                            cursor: pointer;
                            border-radius: 4px;
                            font-size: 14px;
                        ">
                            Necessary Only
                        </button>
                        <button id="privacy-accept-all" style="
                            background: #e74c3c;
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            cursor: pointer;
                            border-radius: 4px;
                            font-size: 14px;
                        ">
                            Accept All
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Add event listeners
        const acceptAllBtn = document.getElementById('privacy-accept-all');
        const acceptNecessaryBtn = document.getElementById('privacy-accept-necessary');

        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', () => {
                this.acceptAllConsent();
            });
        }

        if (acceptNecessaryBtn) {
            acceptNecessaryBtn.addEventListener('click', () => {
                this.acceptNecessaryOnly();
            });
        }
    }

    /**
     * Hide consent banner
     */
    private hideConsentBanner(): void {
        const banner = document.getElementById('privacy-consent-banner');
        if (banner) {
            banner.remove();
        }
    }

    /**
     * Check if analytics tracking is allowed
     */
    canTrackAnalytics(): boolean {
        return this.hasConsent(CONSENT_TYPES.ANALYTICS);
    }

    /**
     * Check if marketing tracking is allowed
     */
    canTrackMarketing(): boolean {
        return this.hasConsent(CONSENT_TYPES.MARKETING);
    }

    /**
     * Check if preference tracking is allowed
     */
    canTrackPreferences(): boolean {
        return this.hasConsent(CONSENT_TYPES.PREFERENCES);
    }

    /**
     * Get privacy policy URL
     */
    getPrivacyPolicyUrl(): string {
        return process.env['REACT_APP_PRIVACY_POLICY_URL'] || '/privacy-policy';
    }

    /**
     * Export user data (GDPR Article 20 - Right to data portability)
     */
    exportUserData(): void {
        const userData = {
            consentPreferences: this.getConsentPreferences(),
            consentTimestamp: typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CONSENT_TIMESTAMP) : null,
            consentVersion: typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CONSENT_VERSION) : null,
            // Add other user data as needed
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'my-data-export.json';
        link.click();
    }

    /**
     * Delete all user data (GDPR Article 17 - Right to erasure)
     */
    deleteAllUserData(): void {
        // Clear consent preferences (only in browser environment)
        if (typeof localStorage !== 'undefined') {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        }

        // Clear tracking data
        this.clearTrackingData();

        // Reset to default state
        this.consentPreferences = { ...this.defaultConsent };

        // Show consent banner again
        if (this.consentRequired) {
            this.showConsentBanner();
        }

        console.log('All user data deleted');
    }
}

// Create singleton instance
const privacyManager = new PrivacyManager();

export default privacyManager;
/**
 * Enhanced Conversion Service
 * 
 * Implements Google Ads enhanced conversions with customer data hashing
 * for improved attribution accuracy and cross-device tracking.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import CryptoJS from 'crypto-js';

class EnhancedConversionService {
    constructor() {
        this.isEnabled = process.env.REACT_APP_ENHANCED_CONVERSIONS_ENABLED === 'true';
        this.hashingSalt = process.env.REACT_APP_CUSTOMER_DATA_HASHING_SALT || '';

        if (this.isEnabled && !this.hashingSalt) {
            console.warn('Enhanced conversions enabled but no hashing salt provided');
        }
    }

    /**
     * Hash customer data using SHA-256 for enhanced conversions
     * @param {string} data - The data to hash
     * @returns {string} - SHA-256 hashed data
     */
    hashData(data) {
        if (!data || typeof data !== 'string') {
            return '';
        }

        // Normalize data: trim whitespace and convert to lowercase
        const normalizedData = data.trim().toLowerCase();

        // Hash with SHA-256 using the configured salt
        const hash = CryptoJS.SHA256(normalizedData + this.hashingSalt).toString();
        return hash;
    }

    /**
     * Hash customer email for enhanced conversions
     * @param {string} email - Customer email address
     * @returns {string} - Hashed email or empty string if invalid
     */
    hashEmail(email) {
        if (!this.isValidEmail(email)) {
            return '';
        }
        return this.hashData(email);
    }

    /**
     * Hash customer phone number for enhanced conversions
     * @param {string} phone - Customer phone number
     * @returns {string} - Hashed phone or empty string if invalid
     */
    hashPhone(phone) {
        if (!phone) return '';

        // Remove all non-digit characters and normalize to E.164 format
        const cleanPhone = phone.replace(/\D/g, '');

        // Add country code if missing (assuming Japan +81 for this business)
        let normalizedPhone = cleanPhone;
        if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
            // Japanese domestic number starting with 0 (e.g., 09012345678 from 090-1234-5678)
            normalizedPhone = '81' + cleanPhone.substring(1);
        } else if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
            // Japanese number without leading 0 (e.g., 9012345678)
            normalizedPhone = '81' + cleanPhone;
        } else if (cleanPhone.length === 12 && cleanPhone.startsWith('81')) {
            // International format with country code (e.g., 819012345678)
            normalizedPhone = cleanPhone;
        } else if (cleanPhone.length >= 10) {
            // International number, use as is
            normalizedPhone = cleanPhone;
        } else {
            // Invalid phone number
            return '';
        }

        return this.hashData('+' + normalizedPhone);
    }

    /**
     * Hash customer name (first and last name separately)
     * @param {string} name - Customer name
     * @returns {string} - Hashed name or empty string if invalid
     */
    hashName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }

        // Remove extra whitespace and special characters
        const cleanName = name.trim().replace(/[^a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');

        if (cleanName.length < 1) {
            return '';
        }

        return this.hashData(cleanName);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid email format
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Validate GDPR consent for enhanced conversions
     * @param {Object} consentData - Consent data object
     * @returns {boolean} - True if consent is valid for enhanced conversions
     */
    validateGDPRConsent(consentData = {}) {
        // Handle null or undefined consent data
        if (!consentData || typeof consentData !== 'object') {
            return false;
        }

        // Check if user has provided explicit consent for data processing
        const hasAnalyticsConsent = consentData.analytics === true || consentData.analytics === 'granted';
        const hasAdStorageConsent = consentData.ad_storage === true || consentData.ad_storage === 'granted';

        // Enhanced conversions require both analytics and ad storage consent
        return hasAnalyticsConsent && hasAdStorageConsent;
    }

    /**
     * Check privacy compliance before processing customer data
     * @param {Object} customerData - Customer data to validate
     * @param {Object} consentData - User consent data
     * @returns {Object} - Validation result with compliance status
     */
    validatePrivacyCompliance(customerData = {}, consentData = {}) {
        const result = {
            isCompliant: false,
            hasValidConsent: false,
            hasValidData: false,
            errors: []
        };

        // Check GDPR consent
        result.hasValidConsent = this.validateGDPRConsent(consentData);
        if (!result.hasValidConsent) {
            result.errors.push('Missing or invalid GDPR consent for enhanced conversions');
        }

        // Validate customer data
        const hasEmail = customerData.email && this.isValidEmail(customerData.email);
        const hasPhone = customerData.phone && typeof customerData.phone === 'string' && customerData.phone.trim().length > 0;
        const hasName = customerData.firstName || customerData.lastName || customerData.name;

        result.hasValidData = hasEmail || hasPhone || hasName;
        if (!result.hasValidData) {
            result.errors.push('No valid customer data (email, phone, or name) provided for enhanced conversions');
        }

        // Overall compliance check
        result.isCompliant = result.hasValidConsent && result.hasValidData;

        return result;
    }

    /**
     * Prepare enhanced conversion data with hashed customer information
     * @param {Object} conversionData - Base conversion data
     * @param {Object} customerData - Customer data to hash
     * @param {Object} consentData - User consent data
     * @returns {Object|null} - Enhanced conversion data or null if not compliant
     */
    prepareEnhancedConversion(conversionData, customerData = {}, consentData = {}) {
        if (!this.isEnabled) {
            console.log('Enhanced conversions disabled');
            return null;
        }

        // Validate privacy compliance
        const compliance = this.validatePrivacyCompliance(customerData, consentData);
        if (!compliance.isCompliant) {
            console.warn('Enhanced conversion blocked due to privacy compliance issues:', compliance.errors);
            return null;
        }

        // Prepare enhanced conversion payload
        const enhancedData = {
            ...conversionData,
            enhanced_conversion_data: {}
        };

        // Hash and add customer data if available
        if (customerData.email) {
            const hashedEmail = this.hashEmail(customerData.email);
            if (hashedEmail) {
                enhancedData.enhanced_conversion_data.email = hashedEmail;
            }
        }

        if (customerData.phone) {
            const hashedPhone = this.hashPhone(customerData.phone);
            if (hashedPhone) {
                enhancedData.enhanced_conversion_data.phone_number = hashedPhone;
            }
        }

        // Handle name data
        if (customerData.firstName) {
            const hashedFirstName = this.hashName(customerData.firstName);
            if (hashedFirstName) {
                enhancedData.enhanced_conversion_data.first_name = hashedFirstName;
            }
        }

        if (customerData.lastName) {
            const hashedLastName = this.hashName(customerData.lastName);
            if (hashedLastName) {
                enhancedData.enhanced_conversion_data.last_name = hashedLastName;
            }
        }

        // If no name parts, try full name
        if (!customerData.firstName && !customerData.lastName && customerData.name) {
            const nameParts = customerData.name.trim().split(/\s+/);
            if (nameParts.length >= 1) {
                const hashedFirstName = this.hashName(nameParts[0]);
                if (hashedFirstName) {
                    enhancedData.enhanced_conversion_data.first_name = hashedFirstName;
                }
            }
            if (nameParts.length >= 2) {
                const hashedLastName = this.hashName(nameParts.slice(1).join(' '));
                if (hashedLastName) {
                    enhancedData.enhanced_conversion_data.last_name = hashedLastName;
                }
            }
        }

        // Add address data if available (optional for enhanced conversions)
        if (customerData.address) {
            if (customerData.address.street) {
                enhancedData.enhanced_conversion_data.street = this.hashData(customerData.address.street);
            }
            if (customerData.address.city) {
                enhancedData.enhanced_conversion_data.city = customerData.address.city.toLowerCase();
            }
            if (customerData.address.region) {
                enhancedData.enhanced_conversion_data.region = customerData.address.region.toLowerCase();
            }
            if (customerData.address.postalCode) {
                enhancedData.enhanced_conversion_data.postal_code = customerData.address.postalCode;
            }
            if (customerData.address.country) {
                enhancedData.enhanced_conversion_data.country = customerData.address.country.toLowerCase();
            }
        }

        // Ensure we have at least one piece of enhanced conversion data
        if (Object.keys(enhancedData.enhanced_conversion_data).length === 0) {
            console.warn('No valid enhanced conversion data could be prepared');
            return null;
        }

        return enhancedData;
    }

    /**
     * Track enhanced conversion event
     * @param {Object} enhancedConversionData - Enhanced conversion data
     * @returns {Promise<boolean>} - Success status
     */
    async trackEnhancedConversion(enhancedConversionData) {
        if (!enhancedConversionData) {
            console.warn('No enhanced conversion data provided');
            return false;
        }

        try {
            // Check if gtag is available (handle both browser and test environments)
            let gtag = null;

            if (typeof window !== 'undefined' && window.gtag) {
                gtag = window.gtag;
            } else if (typeof global !== 'undefined' && global.window && global.window.gtag) {
                gtag = global.window.gtag;
            }

            if (gtag) {
                // Fire enhanced conversion event
                gtag('event', 'conversion', {
                    send_to: `${process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID}/${enhancedConversionData.conversion_label}`,
                    value: enhancedConversionData.value || 0,
                    currency: enhancedConversionData.currency || 'JPY',
                    transaction_id: enhancedConversionData.transaction_id,
                    enhanced_conversion_data: enhancedConversionData.enhanced_conversion_data
                });

                console.log('Enhanced conversion tracked successfully');
                return true;
            } else {
                console.warn('gtag not available for enhanced conversion tracking');
                return false;
            }
        } catch (error) {
            console.error('Error tracking enhanced conversion:', error);
            return false;
        }
    }

    /**
     * Get current configuration status
     * @returns {Object} - Configuration status
     */
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            hasSalt: !!this.hashingSalt,
            isConfigured: this.isEnabled && !!this.hashingSalt
        };
    }
}

// Create singleton instance
const enhancedConversionService = new EnhancedConversionService();

export default enhancedConversionService;
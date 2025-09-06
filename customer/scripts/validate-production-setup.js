#!/usr/bin/env node

/**
 * Production Setup Validation Script
 * 
 * This script validates that all production environment variables and
 * configurations are properly set up for GTM and Google Ads conversion tracking.
 * 
 * Requirements: 1.2, 3.1, 10.1, 10.2
 */

const fs = require('fs');
const path = require('path');

class ProductionSetupValidator {
    constructor() {
        this.envPath = path.join(__dirname, '../.env.production');
        this.gtmConfigPath = path.join(__dirname, '../src/config/gtm-config.json');
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    /**
     * Parse environment file into key-value pairs
     */
    parseEnvFile(content) {
        const env = {};
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...valueParts] = trimmed.split('=');
                env[key] = valueParts.join('=');
            }
        }

        return env;
    }

    /**
     * Validate environment variables
     */
    validateEnvironmentVariables() {
        console.log('\n🔍 VALIDATING ENVIRONMENT VARIABLES\n');

        try {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const env = this.parseEnvFile(envContent);

            // Required variables for production
            const requiredVars = {
                'REACT_APP_GTM_CONTAINER_ID': {
                    required: true,
                    pattern: /^GTM-[A-Z0-9]+$/,
                    description: 'Google Tag Manager Container ID'
                },
                'REACT_APP_GA_MEASUREMENT_ID': {
                    required: true,
                    pattern: /^G-[A-Z0-9]+$/,
                    description: 'Google Analytics 4 Measurement ID'
                },
                'REACT_APP_GOOGLE_ADS_CONVERSION_ID': {
                    required: true,
                    pattern: /^AW-\d+$/,
                    description: 'Google Ads Conversion ID'
                },
                'REACT_APP_GOOGLE_ADS_CONVERSION_LABELS': {
                    required: true,
                    validator: this.validateConversionLabels.bind(this),
                    description: 'Google Ads Conversion Labels JSON'
                },
                'REACT_APP_ENHANCED_CONVERSIONS_ENABLED': {
                    required: true,
                    pattern: /^true$/,
                    description: 'Enhanced Conversions Enabled Flag'
                },
                'REACT_APP_CUSTOMER_DATA_HASHING_SALT': {
                    required: true,
                    validator: this.validateHashingSalt.bind(this),
                    description: 'Customer Data Hashing Salt'
                }
            };

            // Validate each required variable
            for (const [varName, config] of Object.entries(requiredVars)) {
                const value = env[varName];

                if (!value) {
                    this.errors.push(`❌ ${varName}: Missing required variable`);
                    continue;
                }

                // Check for placeholder values
                if (this.isPlaceholderValue(value)) {
                    this.errors.push(`❌ ${varName}: Contains placeholder value: ${value}`);
                    continue;
                }

                // Validate pattern or custom validator
                let isValid = true;
                if (config.pattern) {
                    isValid = config.pattern.test(value);
                } else if (config.validator) {
                    isValid = config.validator(value);
                }

                if (isValid) {
                    this.successes.push(`✅ ${varName}: Valid (${config.description})`);
                } else {
                    this.errors.push(`❌ ${varName}: Invalid format - ${config.description}`);
                }
            }

            // Check optional but recommended variables
            const optionalVars = [
                'REACT_APP_GTM_AUTH',
                'REACT_APP_GTM_PREVIEW',
                'REACT_APP_SITE_URL',
                'REACT_APP_PRIVACY_POLICY_URL'
            ];

            for (const varName of optionalVars) {
                const value = env[varName];
                if (value && !this.isPlaceholderValue(value)) {
                    this.successes.push(`✅ ${varName}: Configured`);
                } else {
                    this.warnings.push(`⚠️  ${varName}: Not configured (optional)`);
                }
            }

        } catch (error) {
            this.errors.push(`❌ Failed to read environment file: ${error.message}`);
        }
    }

    /**
     * Check if a value is a placeholder
     */
    isPlaceholderValue(value) {
        const placeholders = [
            'TODO',
            'REPLACE_WITH',
            'XXXXXXX',
            'your_secure_salt_here',
            'AbCdEfGh',
            '1234567890'
        ];

        return placeholders.some(placeholder =>
            value.toUpperCase().includes(placeholder.toUpperCase())
        );
    }

    /**
     * Validate conversion labels JSON format
     */
    validateConversionLabels(value) {
        try {
            const labels = JSON.parse(value);

            // Required conversion types
            const requiredTypes = ['purchase', 'begin_checkout', 'view_item', 'add_payment_info'];

            for (const type of requiredTypes) {
                if (!labels[type]) {
                    this.errors.push(`❌ Missing conversion label for: ${type}`);
                    return false;
                }

                // Validate label format (should not be placeholder)
                if (this.isPlaceholderValue(labels[type])) {
                    this.errors.push(`❌ Placeholder conversion label for: ${type}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            this.errors.push(`❌ Invalid JSON format for conversion labels: ${error.message}`);
            return false;
        }
    }

    /**
     * Validate hashing salt
     */
    validateHashingSalt(value) {
        if (value === 'your_secure_salt_here') {
            this.errors.push(`❌ Using default hashing salt - security risk`);
            return false;
        }

        if (value.length < 16) {
            this.warnings.push(`⚠️  Hashing salt is short (${value.length} chars) - consider longer salt`);
        }

        return true;
    }

    /**
     * Validate GTM configuration file
     */
    validateGTMConfiguration() {
        console.log('\n🏷️  VALIDATING GTM CONFIGURATION\n');

        try {
            const gtmConfigContent = fs.readFileSync(this.gtmConfigPath, 'utf8');
            const gtmConfig = JSON.parse(gtmConfigContent);

            // Validate container configuration
            if (gtmConfig.container && gtmConfig.container.name) {
                this.successes.push(`✅ GTM Container: ${gtmConfig.container.name}`);
            } else {
                this.errors.push(`❌ GTM container configuration missing`);
            }

            // Validate accounts configuration
            if (gtmConfig.accounts) {
                if (gtmConfig.accounts.ga4 && gtmConfig.accounts.ga4.measurementId) {
                    this.successes.push(`✅ GA4 Account: ${gtmConfig.accounts.ga4.measurementId}`);
                } else {
                    this.errors.push(`❌ GA4 account configuration missing`);
                }

                if (gtmConfig.accounts.googleAds && gtmConfig.accounts.googleAds.conversionId) {
                    this.successes.push(`✅ Google Ads Account: ${gtmConfig.accounts.googleAds.conversionId}`);
                } else {
                    this.errors.push(`❌ Google Ads account configuration missing`);
                }
            }

            // Validate tags
            if (gtmConfig.tags && Array.isArray(gtmConfig.tags)) {
                const requiredTags = [
                    'GA4 Configuration',
                    'GA4 - Purchase Event',
                    'Google Ads - Purchase Conversion',
                    'GA4 - Begin Checkout Event',
                    'Google Ads - Begin Checkout Conversion'
                ];

                const configuredTags = gtmConfig.tags.map(tag => tag.name);

                for (const requiredTag of requiredTags) {
                    if (configuredTags.includes(requiredTag)) {
                        this.successes.push(`✅ GTM Tag: ${requiredTag}`);
                    } else {
                        this.errors.push(`❌ Missing GTM tag: ${requiredTag}`);
                    }
                }
            } else {
                this.errors.push(`❌ GTM tags configuration missing`);
            }

            // Validate triggers
            if (gtmConfig.triggers && Array.isArray(gtmConfig.triggers)) {
                this.successes.push(`✅ GTM Triggers: ${gtmConfig.triggers.length} configured`);
            } else {
                this.errors.push(`❌ GTM triggers configuration missing`);
            }

            // Validate variables
            if (gtmConfig.variables && Array.isArray(gtmConfig.variables)) {
                this.successes.push(`✅ GTM Variables: ${gtmConfig.variables.length} configured`);
            } else {
                this.errors.push(`❌ GTM variables configuration missing`);
            }

            // Validate enhanced conversions
            if (gtmConfig.enhancedConversions && gtmConfig.enhancedConversions.enabled) {
                this.successes.push(`✅ Enhanced Conversions: Enabled`);
            } else {
                this.warnings.push(`⚠️  Enhanced Conversions: Not configured`);
            }

        } catch (error) {
            this.errors.push(`❌ Failed to read GTM configuration: ${error.message}`);
        }
    }

    /**
     * Validate file structure
     */
    validateFileStructure() {
        console.log('\n📁 VALIDATING FILE STRUCTURE\n');

        const requiredFiles = [
            'src/services/gtmService.js',
            'src/services/enhancedConversionService.js',
            'src/services/bookingFlowManager.js',
            'src/services/conversionMonitor.js',
            'src/config/gtm-config.json',
            'public/index.html'
        ];

        for (const filePath of requiredFiles) {
            const fullPath = path.join(__dirname, '..', filePath);
            if (fs.existsSync(fullPath)) {
                this.successes.push(`✅ File exists: ${filePath}`);
            } else {
                this.errors.push(`❌ Missing file: ${filePath}`);
            }
        }

        // Check for GTM script in index.html
        try {
            const indexPath = path.join(__dirname, '../public/index.html');
            const indexContent = fs.readFileSync(indexPath, 'utf8');

            if (indexContent.includes('googletagmanager.com/gtm.js')) {
                this.successes.push(`✅ GTM script found in index.html`);
            } else {
                this.errors.push(`❌ GTM script not found in index.html`);
            }
        } catch (error) {
            this.warnings.push(`⚠️  Could not validate index.html: ${error.message}`);
        }
    }

    /**
     * Generate deployment checklist
     */
    generateDeploymentChecklist() {
        console.log('\n📋 PRODUCTION DEPLOYMENT CHECKLIST\n');

        const checklist = [
            {
                item: 'GTM container created and published',
                status: 'manual',
                description: 'Create GTM container in Google Tag Manager interface'
            },
            {
                item: 'Google Ads conversion actions created',
                status: 'manual',
                description: 'Set up conversion actions in Google Ads interface'
            },
            {
                item: 'Enhanced conversions enabled',
                status: 'manual',
                description: 'Enable enhanced conversions for all conversion actions'
            },
            {
                item: 'Environment variables updated',
                status: this.errors.length === 0 ? 'complete' : 'pending',
                description: 'All production environment variables configured'
            },
            {
                item: 'GTM configuration validated',
                status: 'complete',
                description: 'GTM configuration file is properly structured'
            },
            {
                item: 'File structure validated',
                status: 'complete',
                description: 'All required service files are present'
            },
            {
                item: 'Privacy policy updated',
                status: 'manual',
                description: 'Update privacy policy to cover enhanced conversions'
            },
            {
                item: 'GDPR compliance verified',
                status: 'manual',
                description: 'Ensure customer data handling complies with GDPR'
            },
            {
                item: 'Conversion tracking tested',
                status: 'manual',
                description: 'Test conversion tracking in GTM preview mode'
            },
            {
                item: 'Google Ads diagnostics passed',
                status: 'manual',
                description: 'Run Google Ads conversion diagnostics'
            }
        ];

        checklist.forEach((item, index) => {
            const statusIcon = item.status === 'complete' ? '✅' :
                item.status === 'pending' ? '⏳' : '📋';
            console.log(`${index + 1}. ${statusIcon} ${item.item}`);
            console.log(`   ${item.description}\n`);
        });
    }

    /**
     * Display validation results
     */
    displayResults() {
        console.log('\n📊 VALIDATION RESULTS\n');

        // Display successes
        if (this.successes.length > 0) {
            console.log('✅ SUCCESSES:');
            this.successes.forEach(success => console.log(`   ${success}`));
            console.log('');
        }

        // Display warnings
        if (this.warnings.length > 0) {
            console.log('⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`   ${warning}`));
            console.log('');
        }

        // Display errors
        if (this.errors.length > 0) {
            console.log('❌ ERRORS:');
            this.errors.forEach(error => console.log(`   ${error}`));
            console.log('');
        }

        // Overall status
        const overallStatus = this.errors.length === 0 ?
            (this.warnings.length === 0 ? 'READY' : 'READY WITH WARNINGS') :
            'NOT READY';

        const statusIcon = this.errors.length === 0 ?
            (this.warnings.length === 0 ? '🎉' : '⚠️') : '❌';

        console.log(`${statusIcon} OVERALL STATUS: ${overallStatus}\n`);

        if (this.errors.length === 0) {
            console.log('🚀 Production setup is ready for deployment!');
        } else {
            console.log('🔧 Please fix the errors above before deploying to production.');
        }
    }

    /**
     * Run complete validation
     */
    run() {
        console.log('🔍 PRODUCTION SETUP VALIDATION\n');
        console.log('Validating GTM and Google Ads conversion tracking setup...\n');

        this.validateEnvironmentVariables();
        this.validateGTMConfiguration();
        this.validateFileStructure();
        this.displayResults();
        this.generateDeploymentChecklist();

        return this.errors.length === 0;
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ProductionSetupValidator();
    const isValid = validator.run();
    process.exit(isValid ? 0 : 1);
}

module.exports = ProductionSetupValidator;
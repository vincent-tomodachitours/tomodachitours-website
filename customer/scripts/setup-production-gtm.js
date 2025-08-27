#!/usr/bin/env node

/**
 * Production GTM Container Setup Script
 * 
 * This script provides instructions and validation for setting up the production
 * Google Tag Manager container with all configured tags and triggers.
 * 
 * Requirements: 1.2, 3.1, 10.1, 10.2
 */

const fs = require('fs');
const path = require('path');

class ProductionGTMSetup {
    constructor() {
        this.gtmConfigPath = path.join(__dirname, '../src/config/gtm-config.json');
        this.envPath = path.join(__dirname, '../.env.production');
        this.gtmConfig = null;
        this.currentEnv = null;
    }

    /**
     * Load GTM configuration and environment settings
     */
    loadConfiguration() {
        try {
            // Load GTM configuration
            const gtmConfigContent = fs.readFileSync(this.gtmConfigPath, 'utf8');
            this.gtmConfig = JSON.parse(gtmConfigContent);

            // Load current environment
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            this.currentEnv = this.parseEnvFile(envContent);

            console.log('✅ Configuration loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load configuration:', error.message);
            return false;
        }
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
     * Generate GTM container setup instructions
     */
    generateSetupInstructions() {
        console.log('\n🚀 PRODUCTION GTM CONTAINER SETUP INSTRUCTIONS\n');
        console.log('Follow these steps to create your production GTM container:\n');

        console.log('1. CREATE GTM CONTAINER');
        console.log('   - Go to https://tagmanager.google.com/');
        console.log('   - Click "Create Account" or use existing account');
        console.log('   - Container Name:', this.gtmConfig.container.name);
        console.log('   - Target Platform: Web');
        console.log('   - Click "Create"\n');

        console.log('2. CONFIGURE WORKSPACE');
        console.log('   - Workspace Name:', this.gtmConfig.workspace.name);
        console.log('   - Description:', this.gtmConfig.workspace.description);
        console.log('   - Set as default workspace\n');

        console.log('3. CREATE VARIABLES');
        this.generateVariableInstructions();

        console.log('\n4. CREATE TRIGGERS');
        this.generateTriggerInstructions();

        console.log('\n5. CREATE TAGS');
        this.generateTagInstructions();

        console.log('\n6. PUBLISH CONTAINER');
        console.log('   - Click "Submit" in GTM');
        console.log('   - Version Name: "Production Launch v1.0"');
        console.log('   - Description: "Initial production deployment with GA4 and Google Ads conversion tracking"');
        console.log('   - Click "Publish"\n');

        console.log('7. UPDATE ENVIRONMENT VARIABLES');
        console.log('   - Copy the GTM Container ID (GTM-XXXXXXX)');
        console.log('   - Update REACT_APP_GTM_CONTAINER_ID in .env.production');
        console.log('   - Deploy updated environment variables\n');
    }

    /**
     * Generate variable creation instructions
     */
    generateVariableInstructions() {
        console.log('   Create these variables in GTM:\n');

        this.gtmConfig.variables.forEach((variable, index) => {
            console.log(`   ${index + 1}. ${variable.name}`);
            console.log(`      Type: ${this.getVariableTypeDescription(variable.type)}`);

            if (variable.value) {
                console.log(`      Value: ${variable.value}`);
            }

            if (variable.dataLayerVariable) {
                console.log(`      Data Layer Variable Name: ${variable.dataLayerVariable}`);
            }

            console.log('');
        });
    }

    /**
     * Generate trigger creation instructions
     */
    generateTriggerInstructions() {
        this.gtmConfig.triggers.forEach((trigger, index) => {
            console.log(`   ${index + 1}. ${trigger.name}`);
            console.log(`      Type: ${this.getTriggerTypeDescription(trigger.type)}`);

            if (trigger.customEventFilter) {
                console.log(`      Event Name: ${trigger.customEventFilter.eventName}`);
                if (trigger.customEventFilter.eventLabel) {
                    console.log(`      Event Label: ${trigger.customEventFilter.eventLabel}`);
                }
            }

            console.log('');
        });
    }

    /**
     * Generate tag creation instructions
     */
    generateTagInstructions() {
        this.gtmConfig.tags.forEach((tag, index) => {
            console.log(`   ${index + 1}. ${tag.name}`);
            console.log(`      Type: ${this.getTagTypeDescription(tag.type)}`);
            console.log(`      Firing Triggers: ${tag.firingTriggers.join(', ')}`);

            if (tag.parameters) {
                console.log('      Key Parameters:');
                Object.entries(tag.parameters).forEach(([key, value]) => {
                    if (typeof value === 'string' && !key.includes('custom')) {
                        console.log(`        ${key}: ${value}`);
                    }
                });
            }

            console.log('');
        });
    }

    /**
     * Get human-readable variable type description
     */
    getVariableTypeDescription(type) {
        const types = {
            'c': 'Constant',
            'v': 'Data Layer Variable'
        };
        return types[type] || type;
    }

    /**
     * Get human-readable trigger type description
     */
    getTriggerTypeDescription(type) {
        const types = {
            'init': 'Initialization - All Pages',
            'customEvent': 'Custom Event'
        };
        return types[type] || type;
    }

    /**
     * Get human-readable tag type description
     */
    getTagTypeDescription(type) {
        const types = {
            'gaawe': 'Google Analytics: GA4 Event',
            'awct': 'Google Ads Conversion Tracking'
        };
        return types[type] || type;
    }

    /**
     * Validate current production environment
     */
    validateProductionEnvironment() {
        console.log('\n🔍 PRODUCTION ENVIRONMENT VALIDATION\n');

        const requiredVars = [
            'REACT_APP_GTM_CONTAINER_ID',
            'REACT_APP_GA_MEASUREMENT_ID',
            'REACT_APP_GOOGLE_ADS_CONVERSION_ID',
            'REACT_APP_GOOGLE_ADS_CONVERSION_LABELS'
        ];

        let allValid = true;

        requiredVars.forEach(varName => {
            const value = this.currentEnv[varName];
            const isValid = value && !value.includes('TODO') && !value.includes('XXXXXXX');

            console.log(`${isValid ? '✅' : '❌'} ${varName}: ${value || 'NOT SET'}`);

            if (!isValid) {
                allValid = false;
            }
        });

        console.log(`\nOverall Status: ${allValid ? '✅ READY' : '❌ NEEDS CONFIGURATION'}\n`);

        return allValid;
    }

    /**
     * Generate production-ready environment variables
     */
    generateProductionEnvVars() {
        console.log('\n📝 PRODUCTION ENVIRONMENT VARIABLES\n');
        console.log('Copy these values to your .env.production file:\n');

        // Use actual values from development environment
        const devEnvPath = path.join(__dirname, '../.env');
        const devEnvContent = fs.readFileSync(devEnvPath, 'utf8');
        const devEnv = this.parseEnvFile(devEnvContent);

        console.log('# Google Tag Manager (Production)');
        console.log(`REACT_APP_GTM_CONTAINER_ID=${devEnv.REACT_APP_GTM_CONTAINER_ID || 'GTM-XXXXXXX'}`);
        console.log(`REACT_APP_GTM_AUTH=`);
        console.log(`REACT_APP_GTM_PREVIEW=`);
        console.log(`REACT_APP_GTM_ENVIRONMENT=`);
        console.log('');

        console.log('# Google Analytics 4 (Production)');
        console.log(`REACT_APP_GA_MEASUREMENT_ID=${devEnv.REACT_APP_GA_MEASUREMENT_ID}`);
        console.log(`REACT_APP_ENABLE_ANALYTICS=true`);
        console.log('');

        console.log('# Google Ads Conversion Tracking (Production)');
        console.log(`REACT_APP_GOOGLE_ADS_CONVERSION_ID=${devEnv.REACT_APP_GOOGLE_ADS_CONVERSION_ID}`);
        console.log(`REACT_APP_GOOGLE_ADS_CONVERSION_LABELS=${devEnv.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS}`);
        console.log('');

        console.log('# Enhanced Conversions (Production)');
        console.log(`REACT_APP_ENHANCED_CONVERSIONS_ENABLED=true`);
        console.log(`REACT_APP_CUSTOMER_DATA_HASHING_SALT=${devEnv.REACT_APP_CUSTOMER_DATA_HASHING_SALT}`);
        console.log('');
    }

    /**
     * Generate GTM container export for backup
     */
    generateContainerExport() {
        const exportData = {
            exportFormatVersion: 2,
            exportTime: new Date().toISOString(),
            containerVersion: {
                name: this.gtmConfig.container.name,
                container: {
                    name: this.gtmConfig.container.name,
                    usageContext: ["WEB"]
                },
                tag: this.gtmConfig.tags,
                trigger: this.gtmConfig.triggers,
                variable: this.gtmConfig.variables
            }
        };

        const exportPath = path.join(__dirname, '../gtm-container-export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

        console.log(`\n💾 GTM container configuration exported to: ${exportPath}`);
        console.log('This file can be imported into GTM for quick setup.\n');
    }

    /**
     * Run the complete setup process
     */
    run() {
        console.log('🏗️  PRODUCTION GTM CONTAINER SETUP\n');

        if (!this.loadConfiguration()) {
            process.exit(1);
        }

        this.generateSetupInstructions();
        this.validateProductionEnvironment();
        this.generateProductionEnvVars();
        this.generateContainerExport();

        console.log('🎉 Setup instructions generated successfully!');
        console.log('\nNext steps:');
        console.log('1. Follow the GTM setup instructions above');
        console.log('2. Update your .env.production file with actual values');
        console.log('3. Run the validation script to verify setup');
        console.log('4. Deploy to production\n');
    }
}

// Run the setup if called directly
if (require.main === module) {
    const setup = new ProductionGTMSetup();
    setup.run();
}

module.exports = ProductionGTMSetup;
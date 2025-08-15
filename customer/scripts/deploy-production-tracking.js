#!/usr/bin/env node

/**
 * Production Tracking Deployment Script
 * Handles deployment and configuration of Google Ads tracking in production
 * Requirements: 1.2, 4.1, 7.1, 6.2
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    ENV_FILE: path.join(__dirname, '../.env.production'),
    HTML_FILE: path.join(__dirname, '../public/index.html'),
    GTM_CONFIG_FILE: path.join(__dirname, '../src/config/gtm-config.json'),
    BACKUP_DIR: path.join(__dirname, '../backups'),

    // Required environment variables for production
    REQUIRED_ENV_VARS: [
        'REACT_APP_GA_MEASUREMENT_ID',
        'REACT_APP_GOOGLE_ADS_CONVERSION_ID',
        'REACT_APP_GOOGLE_ADS_CONVERSION_LABELS',
        'REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS'
    ],

    // Placeholder values that need to be replaced
    PLACEHOLDER_VALUES: [
        'XXXXXXXXXX',
        'XXXXXXXXX',
        'AW-XXXXXXXXXX',
        'GTM-XXXXXXX',
        'AbCdEfGh'
    ]
};

class ProductionDeployment {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.deploymentLog = [];
    }

    /**
     * Main deployment function
     */
    async deploy() {
        console.log('🚀 Starting production tracking deployment...\n');

        try {
            // Create backup
            await this.createBackup();

            // Validate environment configuration
            await this.validateEnvironmentConfig();

            // Update HTML file with production tracking
            await this.updateHtmlFile();

            // Validate Google Tag Manager configuration
            await this.validateGtmConfig();

            // Generate deployment report
            await this.generateDeploymentReport();

            // Show deployment summary
            this.showDeploymentSummary();

            if (this.errors.length === 0) {
                console.log('✅ Production tracking deployment completed successfully!');
                return true;
            } else {
                console.log('❌ Production tracking deployment completed with errors.');
                return false;
            }

        } catch (error) {
            console.error('💥 Deployment failed:', error.message);
            this.errors.push(`Deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Create backup of current configuration
     */
    async createBackup() {
        console.log('📦 Creating backup of current configuration...');

        try {
            // Create backup directory if it doesn't exist
            if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
                fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(CONFIG.BACKUP_DIR, `backup-${timestamp}`);
            fs.mkdirSync(backupDir);

            // Backup files
            const filesToBackup = [
                { src: CONFIG.ENV_FILE, name: '.env.production' },
                { src: CONFIG.HTML_FILE, name: 'index.html' },
                { src: CONFIG.GTM_CONFIG_FILE, name: 'gtm-config.json' }
            ];

            for (const file of filesToBackup) {
                if (fs.existsSync(file.src)) {
                    const backupPath = path.join(backupDir, file.name);
                    fs.copyFileSync(file.src, backupPath);
                    console.log(`  ✓ Backed up ${file.name}`);
                }
            }

            this.deploymentLog.push(`Backup created at: ${backupDir}`);
            console.log(`✅ Backup created at: ${backupDir}\n`);

        } catch (error) {
            this.warnings.push(`Failed to create backup: ${error.message}`);
            console.log(`⚠️  Warning: Failed to create backup: ${error.message}\n`);
        }
    }

    /**
     * Validate environment configuration
     */
    async validateEnvironmentConfig() {
        console.log('🔍 Validating environment configuration...');

        try {
            // Check if production env file exists
            if (!fs.existsSync(CONFIG.ENV_FILE)) {
                this.errors.push('Production environment file (.env.production) not found');
                return;
            }

            // Read and parse environment file
            const envContent = fs.readFileSync(CONFIG.ENV_FILE, 'utf8');
            const envVars = this.parseEnvFile(envContent);

            // Check required variables
            for (const requiredVar of CONFIG.REQUIRED_ENV_VARS) {
                if (!envVars[requiredVar]) {
                    this.errors.push(`Missing required environment variable: ${requiredVar}`);
                } else if (this.containsPlaceholder(envVars[requiredVar])) {
                    this.errors.push(`Environment variable ${requiredVar} contains placeholder values`);
                } else {
                    console.log(`  ✓ ${requiredVar} configured`);
                }
            }

            // Validate Google Ads conversion labels JSON
            if (envVars.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS) {
                try {
                    const labels = JSON.parse(envVars.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS);
                    const requiredLabels = ['purchase', 'begin_checkout', 'view_item', 'add_to_cart'];

                    for (const label of requiredLabels) {
                        if (!labels[label]) {
                            this.errors.push(`Missing conversion label: ${label}`);
                        } else if (this.containsPlaceholder(labels[label])) {
                            this.errors.push(`Conversion label ${label} contains placeholder values`);
                        }
                    }

                    console.log(`  ✓ Google Ads conversion labels validated`);
                } catch (parseError) {
                    this.errors.push(`Invalid JSON in REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: ${parseError.message}`);
                }
            }

            // Validate tour-specific labels
            if (envVars.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS) {
                try {
                    const tourLabels = JSON.parse(envVars.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS);
                    const requiredTourLabels = [
                        'gion_purchase', 'morning_purchase', 'night_purchase', 'uji_purchase'
                    ];

                    for (const label of requiredTourLabels) {
                        if (!tourLabels[label]) {
                            this.warnings.push(`Missing tour-specific conversion label: ${label}`);
                        } else if (this.containsPlaceholder(tourLabels[label])) {
                            this.errors.push(`Tour-specific label ${label} contains placeholder values`);
                        }
                    }

                    console.log(`  ✓ Tour-specific conversion labels validated`);
                } catch (parseError) {
                    this.errors.push(`Invalid JSON in REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS: ${parseError.message}`);
                }
            }

            if (this.errors.length === 0) {
                console.log('✅ Environment configuration validation passed\n');
            } else {
                console.log('❌ Environment configuration validation failed\n');
            }

        } catch (error) {
            this.errors.push(`Environment validation failed: ${error.message}`);
            console.log(`❌ Environment validation failed: ${error.message}\n`);
        }
    }

    /**
     * Update HTML file with production tracking configuration
     */
    async updateHtmlFile() {
        console.log('📝 Updating HTML file with production tracking...');

        try {
            if (!fs.existsSync(CONFIG.HTML_FILE)) {
                this.errors.push('HTML file not found');
                return;
            }

            let htmlContent = fs.readFileSync(CONFIG.HTML_FILE, 'utf8');

            // Read environment variables
            const envContent = fs.readFileSync(CONFIG.ENV_FILE, 'utf8');
            const envVars = this.parseEnvFile(envContent);

            // Replace GA measurement ID placeholder
            if (envVars.REACT_APP_GA_MEASUREMENT_ID) {
                htmlContent = htmlContent.replace(
                    /GA_MEASUREMENT_ID/g,
                    envVars.REACT_APP_GA_MEASUREMENT_ID
                );
                console.log('  ✓ Updated GA4 measurement ID');
            }

            // Add Google Tag Manager if configured
            if (envVars.REACT_APP_GTM_CONTAINER_ID &&
                !envVars.REACT_APP_GTM_CONTAINER_ID.includes('GTM-XXXXXXX')) {

                const gtmScript = this.generateGtmScript(envVars.REACT_APP_GTM_CONTAINER_ID);

                // Insert GTM script after the opening head tag
                htmlContent = htmlContent.replace(
                    '<head>',
                    `<head>\n${gtmScript}`
                );

                console.log('  ✓ Added Google Tag Manager');
            }

            // Add production-specific meta tags
            const productionMeta = this.generateProductionMetaTags();
            htmlContent = htmlContent.replace(
                '<!-- Security Headers -->',
                `${productionMeta}\n  <!-- Security Headers -->`
            );

            // Write updated HTML file
            fs.writeFileSync(CONFIG.HTML_FILE, htmlContent);
            console.log('✅ HTML file updated successfully\n');

        } catch (error) {
            this.errors.push(`HTML file update failed: ${error.message}`);
            console.log(`❌ HTML file update failed: ${error.message}\n`);
        }
    }

    /**
     * Validate Google Tag Manager configuration
     */
    async validateGtmConfig() {
        console.log('🏷️  Validating Google Tag Manager configuration...');

        try {
            if (!fs.existsSync(CONFIG.GTM_CONFIG_FILE)) {
                this.warnings.push('GTM configuration file not found');
                console.log('⚠️  GTM configuration file not found\n');
                return;
            }

            const gtmConfig = JSON.parse(fs.readFileSync(CONFIG.GTM_CONFIG_FILE, 'utf8'));

            // Validate container configuration
            if (!gtmConfig.containerConfig || !gtmConfig.containerConfig.containerId) {
                this.warnings.push('GTM container ID not configured');
            } else if (gtmConfig.containerConfig.containerId.includes('GTM-XXXXXXX')) {
                this.warnings.push('GTM container ID contains placeholder values');
            } else {
                console.log('  ✓ GTM container ID configured');
            }

            // Validate tags
            if (!gtmConfig.tags || gtmConfig.tags.length === 0) {
                this.warnings.push('No GTM tags configured');
            } else {
                console.log(`  ✓ ${gtmConfig.tags.length} GTM tags configured`);
            }

            // Validate triggers
            if (!gtmConfig.triggers || gtmConfig.triggers.length === 0) {
                this.warnings.push('No GTM triggers configured');
            } else {
                console.log(`  ✓ ${gtmConfig.triggers.length} GTM triggers configured`);
            }

            // Validate audiences
            if (!gtmConfig.audiences || gtmConfig.audiences.length === 0) {
                this.warnings.push('No remarketing audiences configured');
            } else {
                console.log(`  ✓ ${gtmConfig.audiences.length} remarketing audiences configured`);
            }

            console.log('✅ GTM configuration validation completed\n');

        } catch (error) {
            this.warnings.push(`GTM configuration validation failed: ${error.message}`);
            console.log(`⚠️  GTM configuration validation failed: ${error.message}\n`);
        }
    }

    /**
     * Generate deployment report
     */
    async generateDeploymentReport() {
        console.log('📊 Generating deployment report...');

        const report = {
            timestamp: new Date().toISOString(),
            environment: 'production',
            status: this.errors.length === 0 ? 'success' : 'failed',
            errors: this.errors,
            warnings: this.warnings,
            deploymentLog: this.deploymentLog,
            configuration: {
                ga4Configured: true,
                googleAdsConfigured: this.errors.filter(e => e.includes('GOOGLE_ADS')).length === 0,
                gtmConfigured: this.warnings.filter(w => w.includes('GTM')).length === 0,
                tourSpecificTracking: this.errors.filter(e => e.includes('tour-specific')).length === 0
            }
        };

        const reportPath = path.join(__dirname, '../deployment-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`✅ Deployment report generated: ${reportPath}\n`);
    }

    /**
     * Show deployment summary
     */
    showDeploymentSummary() {
        console.log('📋 Deployment Summary');
        console.log('===================');

        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        if (this.deploymentLog.length > 0) {
            console.log('\n📝 Deployment Log:');
            this.deploymentLog.forEach(log => console.log(`  • ${log}`));
        }

        console.log('\n🔧 Next Steps:');
        console.log('  1. Replace placeholder values in .env.production with actual Google Ads IDs');
        console.log('  2. Configure Google Ads conversion actions in your Google Ads account');
        console.log('  3. Set up Google Tag Manager container with the provided configuration');
        console.log('  4. Test tracking in staging environment before deploying to production');
        console.log('  5. Monitor tracking performance using the production monitoring dashboard');
        console.log('');
    }

    /**
     * Parse environment file
     */
    parseEnvFile(content) {
        const envVars = {};
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        }

        return envVars;
    }

    /**
     * Check if value contains placeholder
     */
    containsPlaceholder(value) {
        return CONFIG.PLACEHOLDER_VALUES.some(placeholder =>
            value.includes(placeholder)
        );
    }

    /**
     * Generate Google Tag Manager script
     */
    generateGtmScript(containerId) {
        return `
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${containerId}');</script>
  <!-- End Google Tag Manager -->`;
    }

    /**
     * Generate production meta tags
     */
    generateProductionMetaTags() {
        return `
  <!-- Production Tracking Meta Tags -->
  <meta name="google-ads-tracking" content="enabled" />
  <meta name="analytics-environment" content="production" />
  <meta name="tracking-version" content="1.0.0" />`;
    }
}

// CLI execution
if (require.main === module) {
    const deployment = new ProductionDeployment();
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = ProductionDeployment;
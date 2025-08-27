# Production Deployment Guide - GTM & Google Ads Conversion Tracking

## Overview

This guide provides step-by-step instructions for deploying the Google Tag Manager and Google Ads conversion tracking system to production. This deployment implements **Task 15** of the Google Ads conversion fix specification.

**Requirements Addressed:** 1.2, 3.1, 10.1, 10.2

## Prerequisites

Before starting the production deployment:

- ✅ Development environment tested and validated
- ✅ GTM container configuration completed
- ✅ Google Ads account access with admin permissions
- ✅ Enhanced conversions implementation tested
- ✅ Privacy policy and GDPR compliance reviewed
- ✅ Backup and rollback plan prepared

## Phase 1: Google Tag Manager Production Setup

### Step 1: Create Production GTM Container

1. **Access Google Tag Manager**
   ```
   URL: https://tagmanager.google.com/
   Account: Tomodachi Tours
   ```

2. **Create New Container**
   - Container Name: `Tomodachi Tours - Customer Site`
   - Target Platform: `Web`
   - Description: `Production GTM container for customer-facing website with GA4 and Google Ads conversion tracking`

3. **Configure Workspace**
   - Workspace Name: `Production Workspace`
   - Set as default workspace

### Step 2: Import GTM Configuration

Use the automated setup script:

```bash
cd customer
node scripts/setup-production-gtm.js
```

This will generate:
- Complete setup instructions
- GTM container export file
- Environment variable template
- Validation checklist

### Step 3: Manual GTM Container Setup

Follow the generated instructions to create:

**Variables (22 total):**
- GA4 Measurement ID: `G-5GVJBRE1SY`
- Google Ads Conversion ID: `AW-17482092392`
- Conversion Labels (4 types)
- DataLayer Variables (15 total)
- Enhanced Conversion Variables (4 total)

**Triggers (9 total):**
- Initialization - All Pages
- Purchase Event
- Begin Checkout Event
- View Item Event
- Add Payment Info Event
- Google Ads Conversion Triggers (4 total)

**Tags (8 total):**
- GA4 Configuration Tag
- GA4 Event Tags (4 types)
- Google Ads Conversion Tags (4 types)

### Step 4: Publish GTM Container

1. **Review Configuration**
   - Verify all tags, triggers, and variables
   - Test in GTM Preview Mode
   - Validate tag firing rules

2. **Publish Container**
   - Version Name: `Production Launch v1.0`
   - Description: `Initial production deployment with GA4 and Google Ads conversion tracking`
   - Click **Publish**

3. **Copy Container ID**
   - Note the GTM Container ID (format: `GTM-XXXXXXX`)
   - Update environment variables

## Phase 2: Google Ads Conversion Actions Setup

### Step 1: Create Conversion Actions

Use the setup script for guidance:

```bash
cd customer
node scripts/setup-google-ads-conversions.js
```

### Step 2: Manual Google Ads Setup

1. **Access Google Ads**
   ```
   URL: https://ads.google.com/
   Navigate: Tools & Settings > Measurement > Conversions
   ```

2. **Create Conversion Actions**

   **Tour Purchase (Primary)**
   - Name: `Tour Purchase`
   - Category: `Purchase`
   - Value: `Use different values for each conversion`
   - Count: `One`
   - Conversion window: `30 days`
   - Include in "Conversions": `Yes`
   - Enhanced conversions: `Enabled`

   **Begin Checkout (Micro-conversion)**
   - Name: `Begin Checkout`
   - Category: `Lead`
   - Value: `Use different values for each conversion`
   - Count: `One`
   - Conversion window: `30 days`
   - Include in "Conversions": `No`
   - Enhanced conversions: `Enabled`

   **View Tour Item (Engagement)**
   - Name: `View Tour Item`
   - Category: `Page view`
   - Value: `Use different values for each conversion`
   - Count: `One`
   - Conversion window: `30 days`
   - Include in "Conversions": `No`
   - Enhanced conversions: `Enabled`

   **Add Payment Info (Intent)**
   - Name: `Add Payment Info`
   - Category: `Lead`
   - Value: `Use different values for each conversion`
   - Count: `One`
   - Conversion window: `30 days`
   - Include in "Conversions": `No`
   - Enhanced conversions: `Enabled`

### Step 3: Configure Enhanced Conversions

For each conversion action:

1. **Enable Enhanced Conversions**
   - Toggle "Enhanced conversions for web" to **ON**
   - Implementation method: **Google Tag Manager**

2. **Configure Customer Data**
   - Email address: ✅ Enabled
   - Phone number: ✅ Enabled
   - First name: ✅ Enabled
   - Last name: ✅ Enabled
   - Address: ✅ Enabled (optional)

3. **Copy Conversion Labels**
   - Copy each conversion label
   - Format: `AbCdEfGh/1234567890`
   - Update environment variables

## Phase 3: Environment Configuration

### Step 1: Update Production Environment Variables

Update `customer/.env.production`:

```bash
# Google Tag Manager (Production)
REACT_APP_GTM_CONTAINER_ID=GTM-XXXXXXX  # Replace with actual container ID
REACT_APP_GTM_AUTH=
REACT_APP_GTM_PREVIEW=
REACT_APP_GTM_ENVIRONMENT=

# Google Analytics 4 (Production)
REACT_APP_GA_MEASUREMENT_ID=G-5GVJBRE1SY
REACT_APP_ENABLE_ANALYTICS=true

# Google Ads Conversion Tracking (Production)
REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-17482092392
REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={
  "purchase": "ACTUAL_PURCHASE_LABEL",
  "begin_checkout": "ACTUAL_BEGIN_CHECKOUT_LABEL",
  "view_item": "ACTUAL_VIEW_ITEM_LABEL",
  "add_payment_info": "ACTUAL_ADD_PAYMENT_INFO_LABEL"
}

# Enhanced Conversions (Production)
REACT_APP_ENHANCED_CONVERSIONS_ENABLED=true
REACT_APP_CUSTOMER_DATA_HASHING_SALT=your_secure_salt_here
```

### Step 2: Validate Configuration

Run the validation script:

```bash
cd customer
node scripts/validate-production-setup.js
```

Expected output:
```
✅ REACT_APP_GTM_CONTAINER_ID: Valid
✅ REACT_APP_GA_MEASUREMENT_ID: Valid
✅ REACT_APP_GOOGLE_ADS_CONVERSION_ID: Valid
✅ REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: Valid
✅ REACT_APP_ENHANCED_CONVERSIONS_ENABLED: Valid

🎉 OVERALL STATUS: READY
```

## Phase 4: Testing and Validation

### Step 1: GTM Preview Mode Testing

1. **Enable GTM Preview Mode**
   - Go to GTM container
   - Click **Preview** button
   - Enter website URL: `https://tomodachitours.com`

2. **Test Conversion Flow**
   - Navigate to tour page → Verify `view_item` event
   - Start checkout → Verify `begin_checkout` event
   - Add payment info → Verify `add_payment_info` event
   - Complete purchase → Verify `purchase` event

3. **Validate Enhanced Conversions**
   - Check GTM debug console
   - Verify enhanced conversion data is present
   - Confirm customer data is hashed

### Step 2: Google Ads Diagnostics

1. **Run Conversion Diagnostics**
   - Go to Google Ads > Tools & Settings > Conversions
   - Click on each conversion action
   - Check **Diagnostics** tab
   - Verify no errors or warnings

2. **Monitor Conversion Status**
   - Status should show: "Receiving conversions"
   - Enhanced conversions: "Receiving enhanced conversions"
   - Match rate should be 70%+

### Step 3: End-to-End Testing

1. **Complete Test Booking**
   - Use test payment method
   - Complete full booking flow
   - Verify conversion tracking in Google Ads

2. **Validate Server-Side Backup**
   - Check Supabase logs for server-side conversions
   - Verify backup conversion firing
   - Confirm conversion reconciliation

## Phase 5: Production Deployment

### Step 1: Deploy Application

1. **Build Production Application**
   ```bash
   cd customer
   npm run build
   ```

2. **Deploy to Production**
   ```bash
   # Deploy to your production environment
   # Update environment variables
   # Restart application services
   ```

### Step 2: Monitor Initial Performance

1. **Real-time Monitoring**
   - Monitor GTM tag firing
   - Check Google Ads conversion reports
   - Validate enhanced conversions match rate

2. **Performance Metrics**
   - Conversion tracking accuracy: Target 95%+
   - Enhanced conversions match rate: Target 70%+
   - Page load impact: < 100ms additional load time

### Step 3: Gradual Traffic Migration

1. **A/B Testing (Optional)**
   - Route 10% of traffic to new tracking
   - Compare conversion accuracy
   - Gradually increase traffic percentage

2. **Full Migration**
   - Route 100% of traffic to new system
   - Monitor for 24-48 hours
   - Validate conversion accuracy

## Phase 6: Post-Deployment Validation

### Step 1: 24-Hour Monitoring

Monitor these metrics for the first 24 hours:

- **Conversion Tracking Accuracy**
  - Compare tracked vs. actual conversions
  - Target: 95%+ accuracy
  - Alert if accuracy drops below 90%

- **Enhanced Conversions Performance**
  - Monitor match rate trends
  - Target: 70%+ match rate
  - Investigate if match rate drops below 50%

- **System Performance**
  - Monitor page load times
  - Check for JavaScript errors
  - Validate GTM container loading

### Step 2: Google Ads Campaign Optimization

1. **Enable Automated Bidding**
   - Switch to Target CPA or Target ROAS
   - Monitor performance for 2-3 days
   - Adjust targets based on conversion data

2. **Attribution Analysis**
   - Review conversion paths
   - Analyze cross-device attribution
   - Optimize campaign structure

### Step 3: Ongoing Monitoring Setup

1. **Automated Alerts**
   - Set up conversion accuracy alerts
   - Monitor enhanced conversions match rate
   - Alert on GTM container issues

2. **Regular Validation**
   - Weekly conversion accuracy reports
   - Monthly Google Ads diagnostics review
   - Quarterly enhanced conversions audit

## Rollback Plan

If issues arise during deployment:

### Immediate Rollback (< 5 minutes)

1. **Revert Environment Variables**
   ```bash
   # Restore previous .env.production
   git checkout HEAD~1 -- customer/.env.production
   ```

2. **Disable GTM Container**
   - Set `REACT_APP_GTM_CONTAINER_ID=` (empty)
   - Redeploy application

3. **Fallback to Direct Tracking**
   - System automatically falls back to gtag
   - Conversion tracking continues with reduced functionality

### Gradual Rollback (< 30 minutes)

1. **GTM Container Rollback**
   - Go to GTM container
   - Revert to previous version
   - Republish container

2. **Google Ads Configuration**
   - Disable problematic conversion actions
   - Revert to previous conversion setup
   - Monitor conversion recovery

## Success Criteria

The deployment is considered successful when:

- ✅ All GTM tags firing correctly (100% success rate)
- ✅ Google Ads conversion tracking accuracy ≥ 95%
- ✅ Enhanced conversions match rate ≥ 70%
- ✅ No Google Ads conversion setup warnings
- ✅ Page load performance impact < 100ms
- ✅ Server-side conversion backup functioning
- ✅ Conversion monitoring and alerting active

## Support and Troubleshooting

### Common Issues

1. **GTM Tags Not Firing**
   - Check GTM container publication status
   - Verify GTM script in HTML head
   - Check for JavaScript errors in console

2. **Conversion Labels Mismatch**
   - Verify labels copied correctly from Google Ads
   - Check JSON format in environment variables
   - Validate label format (no extra spaces/characters)

3. **Enhanced Conversions Not Working**
   - Check customer data hashing implementation
   - Verify enhanced conversions enabled in Google Ads
   - Validate customer data completeness

### Contact Information

- **Technical Issues**: Development team
- **Google Ads Issues**: Marketing team
- **Privacy/Compliance**: Legal team
- **Emergency Rollback**: DevOps team

---

**Deployment Date:** _To be filled during deployment_  
**Deployed By:** _To be filled during deployment_  
**Version:** Production Launch v1.0  
**Requirements:** 1.2, 3.1, 10.1, 10.2
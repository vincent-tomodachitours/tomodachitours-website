# Production Tracking Setup Guide

This guide provides step-by-step instructions for deploying Google Ads analytics integration to production.

## Prerequisites

Before deploying to production, ensure you have:

1. **Google Ads Account** with admin access
2. **Google Analytics 4 Property** configured
3. **Google Tag Manager Account** (optional but recommended)
4. **Production Environment** ready for deployment
5. **Backup Strategy** in place

## Step 1: Configure Google Ads Account

### 1.1 Create Conversion Actions

Log into your Google Ads account and create the following conversion actions:

#### Primary Conversion Actions

1. **Tour Booking Purchase**
   - Category: Purchase
   - Value: Use transaction-specific values
   - Count: One
   - Attribution Model: Data-driven
   - Conversion Window: 30 days click, 1 day view

2. **Tour Booking Started**
   - Category: Lead
   - Value: Use transaction-specific values
   - Count: One
   - Attribution Model: Data-driven
   - Conversion Window: 30 days click, 1 day view

3. **Tour Page View**
   - Category: Page view
   - Value: No value or fixed value
   - Count: One
   - Attribution Model: Data-driven
   - Conversion Window: 30 days click, 1 day view

4. **Tour Selection**
   - Category: Lead
   - Value: Use transaction-specific values
   - Count: One
   - Attribution Model: Data-driven
   - Conversion Window: 30 days click, 1 day view

#### Tour-Specific Conversion Actions

Create separate conversion actions for each tour type:

- **Gion Tour Purchase/Checkout/View/Cart**
- **Morning Tour Purchase/Checkout/View/Cart**
- **Night Tour Purchase/Checkout/View/Cart**
- **Uji Tour Purchase/Checkout/View/Cart**

### 1.2 Obtain Conversion IDs and Labels

After creating conversion actions:

1. Navigate to Tools & Settings > Measurement > Conversions
2. Click on each conversion action to view details
3. Copy the conversion ID (format: AW-XXXXXXXXXX)
4. Copy the conversion label for each action
5. Record these values for environment configuration

### 1.3 Set Up Remarketing Audiences

Create the following remarketing audiences:

1. **All Website Visitors** (30 days)
2. **Tour Page Visitors** (30 days)
3. **Checkout Abandoners** (7 days)
4. **Tour Purchasers** (365 days)
5. **High-Value Prospects** (30 days)
6. **Tour-Specific Interest Audiences** (30 days each)

## Step 2: Configure Environment Variables

### 2.1 Update Production Environment File

Edit `customer/.env.production` and replace placeholder values:

```bash
# Google Ads Conversion Tracking (Production)
REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-YOUR_ACTUAL_CONVERSION_ID

# Google Ads Conversion Labels (Production)
REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={"purchase":"YOUR_PURCHASE_LABEL/YOUR_PURCHASE_VALUE","begin_checkout":"YOUR_CHECKOUT_LABEL/YOUR_CHECKOUT_VALUE","view_item":"YOUR_VIEW_LABEL/YOUR_VIEW_VALUE","add_to_cart":"YOUR_CART_LABEL/YOUR_CART_VALUE"}

# Tour-Specific Google Ads Conversion Labels (Production)
REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS={"gion_purchase":"YOUR_GION_PURCHASE_LABEL","gion_checkout":"YOUR_GION_CHECKOUT_LABEL",...}

# Google Tag Manager (Production)
REACT_APP_GTM_CONTAINER_ID=GTM-YOUR_CONTAINER_ID
```

### 2.2 Validate Configuration

Run the deployment script to validate configuration:

```bash
cd customer
node scripts/deploy-production-tracking.js
```

## Step 3: Set Up Google Tag Manager (Optional)

### 3.1 Create GTM Container

1. Log into Google Tag Manager
2. Create a new container for your website
3. Copy the container ID (GTM-XXXXXXX)

### 3.2 Import Configuration

1. Use the provided GTM configuration in `customer/src/config/gtm-config.json`
2. Import tags, triggers, and variables into your GTM container
3. Update variable values with your actual conversion IDs and labels

### 3.3 Configure Tags

Import and configure the following tags:

- **Google Analytics 4 Configuration**
- **Google Ads Conversion Tracking**
- **Google Ads Remarketing**
- **Enhanced Ecommerce Events**

## Step 4: Deploy to Production

### 4.1 Pre-Deployment Checklist

- [ ] All placeholder values replaced with actual IDs
- [ ] Google Ads conversion actions created and tested
- [ ] GTM container configured (if using)
- [ ] Environment variables validated
- [ ] Backup created

### 4.2 Run Deployment Script

```bash
cd customer
npm run build
node scripts/deploy-production-tracking.js
```

### 4.3 Deploy to Hosting Platform

Deploy the built application to your hosting platform (Vercel, Netlify, etc.):

```bash
# For Vercel
vercel --prod

# For Netlify
netlify deploy --prod --dir=build
```

## Step 5: Verify Tracking Implementation

### 5.1 Use Google Tag Assistant

1. Install Google Tag Assistant Chrome extension
2. Navigate to your production website
3. Verify that all tracking tags are firing correctly
4. Check for any errors or warnings

### 5.2 Test Conversion Tracking

1. Complete a test booking on your production site
2. Check Google Ads for conversion data (may take up to 24 hours)
3. Verify attribution data in Google Analytics 4
4. Test remarketing audience population

### 5.3 Monitor Performance

Use the production monitoring dashboard to track:

- Script load times
- Tracking call performance
- Error rates
- Conversion tracking accuracy

## Step 6: Set Up Monitoring and Alerting

### 6.1 Configure Health Checks

The production monitor automatically performs:

- **Basic Health Checks** every 5 minutes
- **Deep Health Checks** every 30 minutes
- **Performance Monitoring** continuously
- **Error Tracking** and alerting

### 6.2 Set Up Alert Channels

Configure alert channels in your environment:

```bash
# Webhook for alerts
REACT_APP_ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts

# Enable monitoring features
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_ERROR_REPORTING_ENABLED=true
REACT_APP_TRACKING_VALIDATION_ENABLED=true
```

### 6.3 Monitor Key Metrics

Track the following metrics:

- **Conversion Tracking Accuracy**: Ensure conversions are properly attributed
- **Script Load Performance**: Monitor for slow loading times
- **Error Rates**: Track tracking failures and validation errors
- **Attribution Quality**: Verify multi-touch attribution is working

## Step 7: Ongoing Maintenance

### 7.1 Regular Health Checks

- Monitor the production dashboard daily
- Review error logs weekly
- Perform deep validation monthly

### 7.2 Performance Optimization

- Monitor script load times
- Optimize tracking call performance
- Review and update conversion actions as needed

### 7.3 Compliance Monitoring

- Ensure GDPR compliance is maintained
- Monitor cookie consent functionality
- Review privacy policy updates

## Troubleshooting

### Common Issues

1. **Conversion Tracking Not Working**
   - Verify conversion IDs and labels are correct
   - Check that gtag is properly loaded
   - Ensure privacy consent is granted

2. **Slow Script Loading**
   - Check network connectivity
   - Verify DNS resolution for Google domains
   - Consider using GTM for better performance

3. **Attribution Issues**
   - Verify UTM parameters are being captured
   - Check cross-device tracking setup
   - Review attribution model settings

4. **High Error Rates**
   - Check browser console for JavaScript errors
   - Verify environment configuration
   - Review privacy manager settings

### Support Resources

- [Google Ads Conversion Tracking Help](https://support.google.com/google-ads/answer/1722022)
- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Tag Manager Help](https://support.google.com/tagmanager)

## Security Considerations

1. **Environment Variables**: Never commit actual conversion IDs to version control
2. **HTTPS Only**: Ensure all tracking calls use HTTPS
3. **Privacy Compliance**: Respect user consent preferences
4. **Data Validation**: Validate all tracking data before sending
5. **Access Control**: Limit access to production tracking configuration

## Performance Best Practices

1. **Lazy Loading**: Load tracking scripts asynchronously
2. **Caching**: Use appropriate caching headers for tracking scripts
3. **Batching**: Batch tracking events when possible
4. **Error Handling**: Implement robust error handling and retry logic
5. **Monitoring**: Continuously monitor performance impact

---

**Note**: This setup requires actual Google Ads account configuration. The placeholder values in the environment files must be replaced with real conversion IDs and labels from your Google Ads account before deployment to production.
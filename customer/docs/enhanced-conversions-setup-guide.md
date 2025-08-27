# Enhanced Conversions Setup Guide

## Overview

This guide provides step-by-step instructions for configuring enhanced conversions in the Google Ads interface. Enhanced conversions improve attribution accuracy by sending hashed customer data to Google Ads for better cross-device tracking.

**Requirements Addressed:** 3.1, 3.2, 3.3

## Prerequisites

Before setting up enhanced conversions, ensure you have:

- ✅ Google Ads account with conversion actions created
- ✅ Google Tag Manager container configured
- ✅ Customer data hashing implemented in the application
- ✅ Privacy policy updated to cover enhanced conversions
- ✅ GDPR compliance measures in place

## Step 1: Access Enhanced Conversions Settings

1. **Navigate to Google Ads**
   - Go to [https://ads.google.com/](https://ads.google.com/)
   - Sign in to your Google Ads account

2. **Access Conversions Section**
   - Click on **Tools & Settings** (wrench icon)
   - Under **Measurement**, click **Conversions**

3. **Select Conversion Action**
   - Click on the conversion action you want to configure
   - Start with the "Tour Purchase" conversion action

## Step 2: Enable Enhanced Conversions

1. **Open Conversion Action Settings**
   - Click on the conversion action name
   - Look for the **Enhanced conversions** section

2. **Enable Enhanced Conversions**
   - Toggle **Enhanced conversions for web** to **ON**
   - Select implementation method: **Google Tag Manager**

3. **Configure Data Collection**
   - Check the box for **Automatically collect available data**
   - Ensure these data types are selected:
     - ✅ Email address
     - ✅ Phone number
     - ✅ First name
     - ✅ Last name
     - ✅ Home address (optional)

## Step 3: Configure Customer Data Parameters

### Required Data Fields

Configure these customer data fields for enhanced conversions:

```javascript
// Customer data structure sent to Google Ads
{
  email: "hashed_email@example.com",           // SHA-256 hashed
  phone_number: "hashed_phone_number",         // SHA-256 hashed
  first_name: "hashed_first_name",             // SHA-256 hashed
  last_name: "hashed_last_name",               // SHA-256 hashed
  street: "hashed_street_address",             // SHA-256 hashed (optional)
  city: "Kyoto",                               // Plain text (optional)
  region: "Kyoto Prefecture",                  // Plain text (optional)
  postal_code: "600-0000",                     // Plain text (optional)
  country: "JP"                                // Plain text (optional)
}
```

### Data Hashing Requirements

All personal identifiable information (PII) must be hashed:

1. **Email Address**
   - Convert to lowercase
   - Remove leading/trailing whitespace
   - Hash with SHA-256

2. **Phone Number**
   - Use E.164 format (+81XXXXXXXXX)
   - Remove spaces and special characters
   - Hash with SHA-256

3. **Name Fields**
   - Convert to lowercase
   - Remove leading/trailing whitespace
   - Hash with SHA-256

4. **Address Fields**
   - Street address should be hashed
   - City, region, postal code, country can be plain text

## Step 4: Repeat for All Conversion Actions

Configure enhanced conversions for each conversion action:

1. **Tour Purchase** (Primary conversion)
   - Enhanced conversions: **Enabled**
   - Include in "Conversions": **Yes**
   - All customer data fields: **Enabled**

2. **Begin Checkout** (Micro-conversion)
   - Enhanced conversions: **Enabled**
   - Include in "Conversions": **No**
   - Email and phone: **Required**

3. **View Tour Item** (Engagement)
   - Enhanced conversions: **Enabled**
   - Include in "Conversions": **No**
   - Email only: **Sufficient**

4. **Add Payment Info** (Intent signal)
   - Enhanced conversions: **Enabled**
   - Include in "Conversions": **No**
   - Email and phone: **Required**

## Step 5: Validate Enhanced Conversions Setup

### Google Ads Interface Validation

1. **Check Enhanced Conversions Status**
   - Go to Conversions section
   - Look for "Enhanced conversions" column
   - Status should show: **"Receiving enhanced conversions"**

2. **Review Conversion Diagnostics**
   - Click on conversion action
   - Check **Diagnostics** tab
   - Verify no errors or warnings

3. **Monitor Match Rate**
   - Enhanced conversions match rate should be 70%+
   - Higher match rates indicate better data quality

### GTM Preview Mode Testing

1. **Enable GTM Preview Mode**
   - Go to Google Tag Manager
   - Click **Preview** button
   - Navigate to your website

2. **Test Enhanced Conversion Data**
   - Complete a test booking
   - Check GTM debug console
   - Verify enhanced conversion data is being sent:

```javascript
// Expected dataLayer event structure
{
  event: 'google_ads_conversion',
  google_ads: {
    conversion_id: 'AW-17482092392',
    conversion_label: 'purchase_label_here',
    value: 5000,
    currency: 'JPY',
    transaction_id: 'unique_transaction_id'
  },
  enhanced_conversion_data: {
    email: 'hashed_email_here',
    phone_number: 'hashed_phone_here',
    first_name: 'hashed_first_name_here',
    last_name: 'hashed_last_name_here'
  }
}
```

## Step 6: Privacy and Compliance Configuration

### GDPR Compliance

1. **Update Privacy Policy**
   - Add section about enhanced conversions
   - Explain data hashing and Google Ads usage
   - Provide opt-out mechanism

2. **Consent Management**
   - Ensure customer consent covers enhanced conversions
   - Implement consent checking before data collection
   - Respect user privacy preferences

### Data Protection Measures

1. **Hashing Implementation**
   - Use SHA-256 algorithm
   - Implement secure salt (if required)
   - Never send plain text PII

2. **Data Minimization**
   - Only collect necessary customer data
   - Hash data immediately after collection
   - Don't store unhashed PII unnecessarily

## Step 7: Monitoring and Optimization

### Key Metrics to Monitor

1. **Enhanced Conversions Match Rate**
   - Target: 70%+ match rate
   - Monitor weekly trends
   - Investigate drops in match rate

2. **Conversion Attribution Accuracy**
   - Compare attributed vs. actual conversions
   - Target: 95%+ accuracy
   - Monitor cross-device attribution improvements

3. **Campaign Performance**
   - Monitor ROAS improvements
   - Track conversion volume changes
   - Analyze attribution model impact

### Optimization Strategies

1. **Improve Data Quality**
   - Validate email formats before hashing
   - Standardize phone number formats
   - Clean address data for consistency

2. **Increase Data Collection**
   - Collect customer data at multiple touchpoints
   - Implement progressive profiling
   - Encourage account creation for better tracking

## Troubleshooting Common Issues

### Enhanced Conversions Not Working

**Symptoms:**
- Status shows "Not receiving enhanced conversions"
- Match rate is very low (< 30%)
- No enhanced conversion data in reports

**Solutions:**
1. Check GTM tag configuration
2. Verify customer data is being hashed correctly
3. Confirm enhanced conversions are enabled in Google Ads
4. Test with GTM preview mode

### Low Match Rate

**Symptoms:**
- Enhanced conversions match rate < 50%
- Attribution accuracy is poor
- Cross-device tracking not improving

**Solutions:**
1. Improve email data quality
2. Collect phone numbers more consistently
3. Validate data formats before hashing
4. Check for data collection errors

### Privacy Compliance Issues

**Symptoms:**
- Customer complaints about data usage
- GDPR compliance concerns
- Legal team concerns about data handling

**Solutions:**
1. Review and update privacy policy
2. Implement clear consent mechanisms
3. Provide data deletion options
4. Document data handling procedures

## Testing Checklist

Before going live with enhanced conversions:

- [ ] Enhanced conversions enabled for all conversion actions
- [ ] Customer data hashing implemented correctly
- [ ] GTM tags configured with enhanced conversion data
- [ ] Privacy policy updated with enhanced conversions information
- [ ] GDPR consent mechanisms in place
- [ ] Test conversions fired successfully with enhanced data
- [ ] Google Ads diagnostics show no errors
- [ ] Match rate validation completed
- [ ] Cross-device attribution testing completed
- [ ] Data protection measures validated

## Expected Results

After successful enhanced conversions implementation:

1. **Improved Attribution Accuracy**
   - 15-30% improvement in conversion attribution
   - Better cross-device tracking
   - More accurate campaign performance data

2. **Enhanced Campaign Optimization**
   - Improved automated bidding performance
   - Better audience targeting
   - More effective remarketing campaigns

3. **Better Customer Journey Insights**
   - Clearer conversion paths
   - Improved attribution modeling
   - Better understanding of customer behavior

## Support and Resources

### Google Ads Help Resources
- [Enhanced Conversions Documentation](https://support.google.com/google-ads/answer/9888656)
- [GTM Enhanced Conversions Setup](https://support.google.com/tagmanager/answer/9917618)
- [Privacy and Compliance Guidelines](https://support.google.com/google-ads/answer/9888656#privacy)

### Internal Resources
- Enhanced Conversions Service: `customer/src/services/enhancedConversionService.js`
- GTM Configuration: `customer/src/config/gtm-config.json`
- Privacy Policy Template: `customer/src/components/PrivacyPolicy.jsx`

### Contact Information
For technical issues or questions:
- Development Team: Review GTM and hashing implementation
- Legal Team: Privacy and compliance questions
- Marketing Team: Campaign optimization and performance

---

**Last Updated:** August 27, 2025  
**Version:** 1.0  
**Requirements:** 3.1, 3.2, 3.3
# Google Ads Conversion Tracking Setup Guide

This document provides instructions for configuring Google Ads conversion actions and obtaining the necessary IDs and labels for the Tomodachi Tours booking platform.

## Required Google Ads Conversion Actions

The following conversion actions need to be created in your Google Ads account:

### 1. Purchase Conversion
- **Name**: Tour Booking Purchase
- **Category**: Purchase
- **Value**: Use transaction-specific values
- **Count**: One
- **Attribution Model**: Data-driven (recommended)
- **Conversion Window**: 30 days click, 1 day view

### 2. Begin Checkout Conversion
- **Name**: Tour Booking Started
- **Category**: Lead
- **Value**: Use transaction-specific values
- **Count**: One
- **Attribution Model**: Data-driven
- **Conversion Window**: 30 days click, 1 day view

### 3. View Item Conversion
- **Name**: Tour Page View
- **Category**: Page view
- **Value**: No value or fixed value
- **Count**: One
- **Attribution Model**: Data-driven
- **Conversion Window**: 30 days click, 1 day view

### 4. Add to Cart Conversion
- **Name**: Tour Selection
- **Category**: Lead
- **Value**: Use transaction-specific values
- **Count**: One
- **Attribution Model**: Data-driven
- **Conversion Window**: 30 days click, 1 day view

## Environment Variable Configuration

After creating the conversion actions in Google Ads, update the following environment variables:

### REACT_APP_GOOGLE_ADS_CONVERSION_ID
Replace `AW-XXXXXXXXXX` with your actual Google Ads conversion ID (found in Google Ads > Tools & Settings > Conversions)

### REACT_APP_GOOGLE_ADS_CONVERSION_LABELS
Replace the placeholder values with actual conversion labels from Google Ads:

```json
{
  "purchase": "ACTUAL_PURCHASE_LABEL/ACTUAL_PURCHASE_VALUE",
  "begin_checkout": "ACTUAL_CHECKOUT_LABEL/ACTUAL_CHECKOUT_VALUE", 
  "view_item": "ACTUAL_VIEW_LABEL/ACTUAL_VIEW_VALUE",
  "add_to_cart": "ACTUAL_CART_LABEL/ACTUAL_CART_VALUE"
}
```

## Steps to Configure Google Ads Account

1. **Access Google Ads Account**
   - Log into your Google Ads account
   - Navigate to Tools & Settings > Measurement > Conversions

2. **Create Conversion Actions**
   - Click the "+" button to create new conversion actions
   - Select "Website" as the conversion source
   - Configure each conversion action according to the specifications above

3. **Obtain Conversion IDs and Labels**
   - After creating each conversion action, click on it to view details
   - Copy the conversion ID (format: AW-XXXXXXXXXX)
   - Copy the conversion label for each action

4. **Update Environment Variables**
   - Replace placeholder values in customer/.env file
   - Ensure the JSON format is valid for the labels object

5. **Verify Installation**
   - Use Google Tag Assistant or Google Ads conversion tracking helper
   - Test conversion firing on staging environment before production

## Testing Conversion Tracking

1. **Google Tag Assistant**
   - Install the Chrome extension
   - Navigate to your website
   - Verify that Google Ads tags are firing correctly

2. **Google Ads Interface**
   - Check conversion tracking status in Google Ads
   - Monitor conversion data in the conversions section
   - Verify attribution is working correctly

## Important Notes

- Conversion labels are unique to each conversion action
- The conversion ID is shared across all conversion actions in the account
- Test thoroughly in a staging environment before deploying to production
- Consider implementing enhanced conversions for better attribution accuracy
- Ensure GDPR compliance by respecting user consent preferences

## Support Resources

- [Google Ads Conversion Tracking Guide](https://support.google.com/google-ads/answer/1722022)
- [Google Tag Manager Setup](https://support.google.com/tagmanager/answer/6103696)
- [Enhanced Conversions Documentation](https://support.google.com/google-ads/answer/9888656)
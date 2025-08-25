# Google Ads Conversion Tracking Setup Guide

## Current Issue
Your Google Ads is showing "conversions aren't set up properly" because you need to import GA4 events as conversions in Google Ads.

## How GA4 + Google Ads Integration Works

With your current setup (GA4 + Google Ads), you don't need conversion labels in your code. Instead:

1. **Your website sends events to GA4** (purchase, add_to_cart, etc.)
2. **Google Ads imports these GA4 events** as conversions
3. **No conversion labels needed in code** - everything is handled through the GA4 integration

## Steps to Fix

### 1. Link Google Ads to Google Analytics

1. **In Google Ads**: Go to **Tools & Settings** → **Linked accounts** → **Google Analytics**
2. **Link your GA4 property** (`G-5GVJBRE1SY`) to your Google Ads account
3. **Enable data sharing** between the accounts

### 2. Import GA4 Events as Conversions

1. **In Google Ads**: Go to **Goals** → **Conversions** → **Summary**
2. **Click "Create a conversion action"**
3. **Choose "Import"** → **Google Analytics 4 properties**
4. **Select your GA4 property** and import these events:
   - **purchase** (most important for sales)
   - **add_to_cart** 
   - **begin_checkout**
   - **view_item**

### 3. Configure Conversion Settings

For each imported conversion:
- **Category**: Choose appropriate category (Purchase, Add to cart, etc.)
- **Value**: "Use different values for each conversion" 
- **Count**: "One" (count one conversion per interaction)
- **Attribution model**: Choose your preferred model (usually "Data-driven")

### 4. Verify Setup

1. **Check GA4 Events**: Go to GA4 → **Reports** → **Events** and verify events are firing
2. **Test your website**: Make a test purchase and check if events appear in GA4
3. **Wait for Google Ads**: Conversions may take 24-48 hours to appear in Google Ads
4. **Check Google Ads**: Go to **Conversions** → **Summary** to see imported conversions

### 5. Test Your Current Setup

Your analytics code is now simplified and should work correctly:

1. **Open browser console** on your website
2. **Run**: `window.testAnalytics.testPurchase()`
3. **Check GA4**: Events should appear in real-time
4. **Check Google Ads**: Conversions should appear within 24-48 hours

## Current Configuration Status

✅ **Google Tag**: Properly installed in `public/index.html`
✅ **Google Analytics**: Configured with ID `G-5GVJBRE1SY`  
✅ **Google Ads ID**: Configured with ID `AW-17482092392`
✅ **Analytics Code**: Simplified to send events to both GA4 and Google Ads
❌ **GA4 → Google Ads Import**: Need to set up conversion imports

## Why This Approach is Better

- **No conversion labels needed** in your code
- **Easier maintenance** - manage conversions in Google Ads UI
- **Better data consistency** between GA4 and Google Ads
- **Enhanced conversions** work automatically
- **Future-proof** - follows Google's recommended approach

## Next Steps

1. Link Google Ads to your GA4 property
2. Import GA4 events as conversions in Google Ads
3. Test the setup with real transactions
4. Monitor conversion data in Google Ads
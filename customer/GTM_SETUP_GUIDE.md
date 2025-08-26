# Google Tag Manager Setup Guide

This guide provides step-by-step instructions for setting up the Google Tag Manager container for Tomodachi Tours.

## Prerequisites

- Google Tag Manager account access
- Google Analytics 4 property (G-5GVJBRE1SY)
- Google Ads account (AW-17482092392)
- Admin access to both GA4 and Google Ads accounts

## Step 1: Create GTM Container

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Click "Create Account" or use existing account
3. Set up new container:
   - **Account Name**: Tomodachi Tours
   - **Container Name**: Tomodachi Tours - Customer Site
   - **Target Platform**: Web
4. Copy the GTM Container ID (format: GTM-XXXXXXX)
5. Update environment variables:
   ```bash
   REACT_APP_GTM_CONTAINER_ID=GTM-XXXXXXX  # Replace with actual ID
   ```

## Step 2: Configure GA4 Integration

1. In GTM, go to **Variables** → **New**
2. Create **GA4 Measurement ID** constant variable:
   - **Variable Name**: GA4 Measurement ID
   - **Variable Type**: Constant
   - **Value**: G-5GVJBRE1SY

3. Create **GA4 Configuration** tag:
   - **Tag Name**: GA4 Configuration
   - **Tag Type**: Google Analytics: GA4 Configuration
   - **Measurement ID**: {{GA4 Measurement ID}}
   - **Trigger**: Initialization - All Pages

## Step 3: Configure Google Ads Integration

1. Create Google Ads variables:
   - **Google Ads Conversion ID**: AW-17482092392
   - **Purchase Conversion Label**: AbC-D_efGhIjKlMnOp
   - **Begin Checkout Conversion Label**: XyZ-A_bcDeFgHiJkLm
   - **View Item Conversion Label**: QrS-T_uvWxYzAbCdEf

2. Create conversion tracking tags (see detailed configuration below)

## Step 4: Set Up Conversion Actions in Google Ads

1. Go to Google Ads → **Goals** → **Conversions**
2. Create three conversion actions:

### Purchase Conversion
- **Conversion Name**: Purchase
- **Category**: Purchase
- **Value**: Use different values for each conversion
- **Count**: One
- **Attribution Model**: Data-driven
- **Include in "Conversions"**: Yes

### Begin Checkout Conversion
- **Conversion Name**: Begin Checkout
- **Category**: Other
- **Value**: Use different values for each conversion
- **Count**: One
- **Attribution Model**: Data-driven
- **Include in "Conversions"**: No (for optimization only)

### View Item Conversion
- **Conversion Name**: View Item
- **Category**: Other
- **Value**: Use different values for each conversion
- **Count**: One
- **Attribution Model**: Data-driven
- **Include in "Conversions"**: No (for optimization only)

## Step 5: Configure Enhanced Conversions

1. In Google Ads, go to **Conversions** → **Settings**
2. Enable **Enhanced conversions for web**
3. Choose **Google Tag Manager** as implementation method
4. In GTM, add enhanced conversion parameters to conversion tags

## Step 6: Create GTM Tags and Triggers

### Triggers

1. **Purchase Event Trigger**:
   - **Trigger Type**: Custom Event
   - **Event Name**: purchase

2. **Begin Checkout Event Trigger**:
   - **Trigger Type**: Custom Event
   - **Event Name**: begin_checkout

3. **View Item Event Trigger**:
   - **Trigger Type**: Custom Event
   - **Event Name**: view_item

### Tags

1. **GA4 Purchase Event**:
   - **Tag Type**: Google Analytics: GA4 Event
   - **Configuration Tag**: {{GA4 Configuration}}
   - **Event Name**: purchase
   - **Trigger**: Purchase Event

2. **Google Ads Purchase Conversion**:
   - **Tag Type**: Google Ads Conversion Tracking
   - **Conversion ID**: {{Google Ads Conversion ID}}
   - **Conversion Label**: {{Purchase Conversion Label}}
   - **Conversion Value**: {{Transaction Value}}
   - **Currency Code**: JPY
   - **Trigger**: Purchase Event

3. **GA4 Begin Checkout Event**:
   - **Tag Type**: Google Analytics: GA4 Event
   - **Configuration Tag**: {{GA4 Configuration}}
   - **Event Name**: begin_checkout
   - **Trigger**: Begin Checkout Event

4. **Google Ads Begin Checkout Conversion**:
   - **Tag Type**: Google Ads Conversion Tracking
   - **Conversion ID**: {{Google Ads Conversion ID}}
   - **Conversion Label**: {{Begin Checkout Conversion Label}}
   - **Conversion Value**: {{Checkout Value}}
   - **Currency Code**: JPY
   - **Trigger**: Begin Checkout Event

5. **GA4 View Item Event**:
   - **Tag Type**: Google Analytics: GA4 Event
   - **Configuration Tag**: {{GA4 Configuration}}
   - **Event Name**: view_item
   - **Trigger**: View Item Event

6. **Google Ads View Item Conversion**:
   - **Tag Type**: Google Ads Conversion Tracking
   - **Conversion ID**: {{Google Ads Conversion ID}}
   - **Conversion Label**: {{View Item Conversion Label}}
   - **Conversion Value**: {{Item Value}}
   - **Currency Code**: JPY
   - **Trigger**: View Item Event

## Step 7: Configure DataLayer Variables

Create the following built-in variables in GTM:

1. **Transaction Value**: 
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: value

2. **Transaction ID**:
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: transaction_id

3. **Currency Code**:
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: currency

4. **Items Array**:
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: items

## Step 8: Test Configuration

1. Use GTM **Preview Mode**:
   - Click **Preview** in GTM workspace
   - Enter website URL: https://tomodachitours.com
   - Test all conversion events

2. Verify in Google Analytics 4:
   - Go to **Realtime** reports
   - Test events should appear within minutes

3. Verify in Google Ads:
   - Go to **Tools & Settings** → **Conversions**
   - Check conversion status and recent activity

## Step 9: Publish Container

1. In GTM, click **Submit**
2. Add version name: "Initial GTM Setup with GA4 and Google Ads"
3. Add description of changes
4. Click **Publish**

## Step 10: Update Environment Variables

After container is created and published, update the environment file:

```bash
# Replace GTM-XXXXXXX with your actual container ID
REACT_APP_GTM_CONTAINER_ID=GTM-XXXXXXX

# Optional: For GTM environments (leave empty for production)
REACT_APP_GTM_AUTH=
REACT_APP_GTM_PREVIEW=
REACT_APP_GTM_ENVIRONMENT=
```

## Verification Checklist

- [ ] GTM container loads on website
- [ ] GA4 configuration tag fires on page load
- [ ] Purchase conversion fires on successful booking
- [ ] Begin checkout conversion fires when checkout starts
- [ ] View item conversion fires when tour is viewed
- [ ] Enhanced conversions are enabled and working
- [ ] Google Ads shows no conversion setup warnings
- [ ] Conversion data appears in Google Ads reports

## Troubleshooting

### GTM Not Loading
- Check container ID in environment variables
- Verify GTM script is in HTML head section
- Check browser console for errors

### Conversions Not Firing
- Use GTM Preview Mode to debug
- Check dataLayer events in browser console
- Verify trigger conditions in GTM
- Check Google Ads conversion action status

### Enhanced Conversions Issues
- Verify customer data is being hashed
- Check enhanced conversion setup in Google Ads
- Ensure privacy compliance measures are in place

## Support

For technical issues with this setup, refer to:
- [Google Tag Manager Help](https://support.google.com/tagmanager)
- [Google Ads Conversion Tracking Help](https://support.google.com/google-ads/answer/1722022)
- [GA4 Enhanced Ecommerce Help](https://support.google.com/analytics/answer/10119380)
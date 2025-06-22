/**
 * Simple Bokun API Test Script
 * Tests just the core Bokun API functionality
 */

require('dotenv').config();
const crypto = require('crypto');

class SimpleBokunAPI {
    constructor() {
        this.accessKey = process.env.BOKUN_PUBLIC_KEY;
        this.secretKey = process.env.BOKUN_SECRET_KEY;
        this.baseURL = process.env.BOKUN_API_URL || 'https://api.bokuntest.com';

        if (!this.accessKey || !this.secretKey) {
            console.error('❌ Bokun API credentials not found in environment variables');
            console.log('   Make sure these are set in your .env file:');
            console.log('   - BOKUN_PUBLIC_KEY');
            console.log('   - BOKUN_SECRET_KEY');
            console.log('   - BOKUN_API_URL (optional)');
            process.exit(1);
        }
    }

    createSignature(date, method, path) {
        const stringToSign = date + this.accessKey + method.toUpperCase() + path;
        const hmac = crypto.createHmac('sha1', this.secretKey);
        hmac.update(stringToSign);
        return hmac.digest('base64');
    }

    getCurrentBokunDate() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        const date = this.getCurrentBokunDate();
        const signature = this.createSignature(date, method, path);

        const headers = {
            'X-Bokun-Date': date,
            'X-Bokun-AccessKey': this.accessKey,
            'X-Bokun-Signature': signature,
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/json'
        };

        const config = {
            method: method.toUpperCase(),
            headers
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        const url = `${this.baseURL}${path}`;

        console.log(`🔗 Making request: ${method} ${url}`);
        console.log(`📅 Date: ${date}`);
        console.log(`🔑 Access Key: ${this.accessKey.substring(0, 8)}...`);
        console.log(`✍️  Signature: ${signature.substring(0, 10)}...`);

        const response = await fetch(url, config);

        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bokun API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : {};
    }

    async testConnection() {
        try {
            // POST requests need a body, even if empty
            const searchData = {
                // Empty search to get all activities
            };
            const result = await this.makeRequest('/activity.json/search?lang=EN&currency=USD', 'POST', searchData);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getActivityDetails(activityId) {
        try {
            const result = await this.makeRequest(`/activity.json/${activityId}?lang=EN&currency=USD`, 'GET');
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

async function runTest() {
    console.log('🧪 Testing Bokun API Integration\n');

    // Initialize API client
    const bokun = new SimpleBokunAPI();

    console.log('📋 Configuration:');
    console.log(`   API URL: ${bokun.baseURL}`);
    console.log(`   Access Key: ${bokun.accessKey.substring(0, 8)}...`);
    console.log(`   Secret Key: ${bokun.secretKey ? 'Set' : 'Not Set'}\n`);

    // Test 1: Basic API Connection
    console.log('1️⃣ Testing API Connection...');
    const connectionTest = await bokun.testConnection();

    if (connectionTest.success) {
        console.log('✅ API connection successful!');
        console.log(`📦 Found ${connectionTest.result.results?.length || 0} activities\n`);
    } else {
        console.log('❌ API connection failed:');
        console.log(`   Error: ${connectionTest.error}\n`);
        return;
    }

    // Test 2: Test specific activity (if ID is provided)
    const nightTourId = process.env.NIGHT_TOUR_PRODUCT_ID;
    if (nightTourId && nightTourId !== 'PLACEHOLDER_ACTIVITY_ID') {
        console.log('2️⃣ Testing Night Tour Activity...');
        const activityTest = await bokun.getActivityDetails(nightTourId);

        if (activityTest.success) {
            console.log('✅ Night Tour activity found!');
            console.log(`   Title: ${activityTest.result.title || 'N/A'}`);
            console.log(`   ID: ${activityTest.result.id || nightTourId}`);
            console.log(`   Duration: ${activityTest.result.duration || 'N/A'}\n`);
        } else {
            console.log('❌ Night Tour activity test failed:');
            console.log(`   Error: ${activityTest.error}`);
            console.log('   💡 Check that NIGHT_TOUR_PRODUCT_ID is correct in your .env file\n');
        }
    } else {
        console.log('2️⃣ Skipping Night Tour test (NIGHT_TOUR_PRODUCT_ID not set or is placeholder)\n');
    }

    console.log('🎉 Test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. If tests passed: Update bokun_products table with your activity ID');
    console.log('   2. Test availability checking in your application');
    console.log('   3. Deploy webhook handler for real-time updates');
}

// Handle fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

runTest().catch(console.error); 
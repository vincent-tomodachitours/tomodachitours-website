require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read service account from the correct location
const serviceAccountPath = path.join(__dirname, '../functions/service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Map sheet names to tour types
const tourTypeMap = {
    'Night tour': 'NIGHT_TOUR',
    'Morning tour': 'MORNING_TOUR',
    'Uji tour': 'UJI_TOUR',
    'Gion tour': 'GION_TOUR'
};

const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_ID environment variable');
}

const sheetNames = ['Night tour', 'Morning tour', 'Uji tour', 'Gion tour'];

async function migrateBookings() {
    try {
        let allRows = [];
        for (const sheetName of sheetNames) {
            console.log(`Fetching data from sheet: ${sheetName}`);
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `'${sheetName}'!A2:I`, // Updated range to match current structure
            });
            const rows = response.data.values || [];
            // Attach sheet name to each row for later reference
            allRows = allRows.concat(rows.map(row => ({ row, sheetName })));
        }

        const bookings = [];
        const errors = [];

        // Process each row
        for (const row of allRows) {
            const [
                date,
                time,
                adults,
                children,
                infants,
                name,
                phone,
                email,
                participants // This is calculated, we'll use our own calculation
            ] = row.row;

            // Skip empty rows
            if (!date || !time) {
                continue;
            }

            // Validate required fields
            if (!name || !email) {
                errors.push({
                    row: row.row,
                    error: `Missing required fields: name or email`
                });
                continue;
            }

            // Create booking object
            const booking = {
                booking_date: date,
                booking_time: time,
                adults: parseInt(adults) || 0,
                children: parseInt(children) || 0,
                infants: parseInt(infants) || 0,
                customer_name: name,
                customer_phone: phone || null,
                customer_email: email,
                tour_type: tourTypeMap[row.sheetName],
                status: 'CONFIRMED', // Default status for existing bookings
                created_at: new Date().toISOString() // Use current timestamp for existing bookings
            };

            // Validate the booking
            if (booking.adults + booking.children + booking.infants === 0) {
                errors.push({
                    row: row.row,
                    error: `No participants specified`
                });
                continue;
            }

            bookings.push(booking);
        }

        // Insert bookings in batches
        const batchSize = 50;
        const results = {
            total: bookings.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < bookings.length; i += batchSize) {
            const batch = bookings.slice(i, i + batchSize);
            const { error } = await supabase
                .from('bookings')
                .insert(batch);

            if (error) {
                results.failed += batch.length;
                results.errors.push({
                    batch: i / batchSize + 1,
                    error: error.message
                });
            } else {
                results.successful += batch.length;
            }
        }

        // Generate migration report
        const report = {
            timestamp: new Date().toISOString(),
            results,
            validationErrors: errors
        };

        // Save report to file
        fs.writeFileSync(
            'migration-report.json',
            JSON.stringify(report, null, 2)
        );

        console.log('\nMigration Summary:');
        console.log('-----------------');
        console.log(`Total bookings processed: ${results.total}`);
        console.log(`Successfully migrated: ${results.successful}`);
        console.log(`Failed to migrate: ${results.failed}`);
        console.log(`Validation errors: ${errors.length}`);
        console.log('\nSee migration-report.json for detailed report');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
migrateBookings(); 
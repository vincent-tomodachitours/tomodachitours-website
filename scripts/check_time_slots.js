import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTimeSlots() {
    console.log('Checking time slots in the database...\n');

    // Get all time slots for each tour
    const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('tour_time_slots')
        .select(`
            time_slot,
            tour_settings (
                tour_name
            )
        `)
        .order('tour_settings(tour_name)', { ascending: true })
        .order('time_slot', { ascending: true });

    if (timeSlotsError) {
        console.error('Error fetching time slots:', timeSlotsError);
        return;
    }

    // Group time slots by tour
    const tours = {};
    timeSlots.forEach(slot => {
        const tourName = slot.tour_settings.tour_name;
        if (!tours[tourName]) {
            tours[tourName] = [];
        }
        tours[tourName].push(slot.time_slot);
    });

    // Print results
    console.log('Available time slots by tour:');
    console.log('---------------------------');
    Object.entries(tours).forEach(([tourName, slots]) => {
        console.log(`\n${tourName}:`);
        slots.forEach(slot => console.log(`  - ${slot}`));
    });

    // Print total count
    console.log('\nTotal time slots:', timeSlots.length);

    // Check if we have all the expected time slots
    const expectedTimeSlots = ['6:30', '7:15', '8:00'];
    const missingTimeSlots = {};

    Object.entries(tours).forEach(([tourName, slots]) => {
        const missing = expectedTimeSlots.filter(slot => !slots.includes(slot));
        if (missing.length > 0) {
            missingTimeSlots[tourName] = missing;
        }
    });

    if (Object.keys(missingTimeSlots).length > 0) {
        console.log('\nMissing time slots by tour:');
        console.log('---------------------------');
        Object.entries(missingTimeSlots).forEach(([tourName, slots]) => {
            console.log(`\n${tourName}:`);
            slots.forEach(slot => console.log(`  - ${slot}`));
        });
    }
}

// Run the check
checkTimeSlots().catch(console.error); 
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

async function verifyMigration() {
    console.log('Verifying migration...\n');

    // 1. Check total bookings per tour
    console.log('1. Total bookings per tour:');
    console.log('---------------------------');
    const { data: tourStats, error: tourStatsError } = await supabase
        .from('bookings')
        .select(`
            tour_settings (
                tour_name
            ),
            booking_date
        `)
        .order('tour_settings(tour_name)');

    if (tourStatsError) {
        console.error('Error fetching tour stats:', tourStatsError);
        return;
    }

    const tourCounts = {};
    const tourDates = {};
    tourStats.forEach(booking => {
        const tourName = booking.tour_settings.tour_name;
        tourCounts[tourName] = (tourCounts[tourName] || 0) + 1;
        if (!tourDates[tourName]) {
            tourDates[tourName] = new Set();
        }
        tourDates[tourName].add(booking.booking_date);
    });

    Object.entries(tourCounts).forEach(([tourName, count]) => {
        console.log(`${tourName}:`);
        console.log(`  Total bookings: ${count}`);
        console.log(`  Unique dates: ${tourDates[tourName].size}`);
        console.log(`  Date range: ${Math.min(...tourDates[tourName])} to ${Math.max(...tourDates[tourName])}`);
        console.log('');
    });

    // 2. Check time slot distribution
    console.log('\n2. Time slot distribution:');
    console.log('-------------------------');
    const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('bookings')
        .select(`
            tour_settings (
                tour_name
            ),
            tour_time_slots (
                time_slot
            )
        `)
        .order('tour_settings(tour_name)');

    if (timeSlotsError) {
        console.error('Error fetching time slots:', timeSlotsError);
        return;
    }

    const timeSlotCounts = {};
    timeSlots.forEach(booking => {
        const tourName = booking.tour_settings.tour_name;
        const timeSlot = booking.tour_time_slots.time_slot;
        if (!timeSlotCounts[tourName]) {
            timeSlotCounts[tourName] = {};
        }
        timeSlotCounts[tourName][timeSlot] = (timeSlotCounts[tourName][timeSlot] || 0) + 1;
    });

    Object.entries(timeSlotCounts).forEach(([tourName, slots]) => {
        console.log(`${tourName}:`);
        Object.entries(slots).forEach(([slot, count]) => {
            console.log(`  ${slot}: ${count} bookings`);
        });
        console.log('');
    });

    // 3. Check for any data issues
    console.log('\n3. Data quality checks:');
    console.log('---------------------');

    // 3.1 Check for bookings with zero participants
    const { count: zeroParticipants, error: zeroError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('adults', 0)
        .eq('children', 0)
        .eq('infants', 0);

    if (zeroError) {
        console.error('Error checking zero participants:', zeroError);
    } else {
        console.log(`Bookings with zero participants: ${zeroParticipants}`);
    }

    // 3.2 Check for bookings with missing contact info
    const { count: missingContact, error: contactError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or('contact_name.is.null,contact_email.is.null,contact_phone.is.null');

    if (contactError) {
        console.error('Error checking missing contact info:', contactError);
    } else {
        console.log(`Bookings with missing contact info: ${missingContact}`);
    }

    // 4. Sample of recent bookings
    console.log('\n4. Sample of recent bookings:');
    console.log('---------------------------');
    const { data: recentBookings, error: recentError } = await supabase
        .from('bookings')
        .select(`
            booking_date,
            tour_settings (
                tour_name
            ),
            tour_time_slots (
                time_slot
            ),
            adults,
            children,
            infants,
            contact_name,
            status,
            created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (recentError) {
        console.error('Error fetching recent bookings:', recentError);
    } else {
        recentBookings.forEach(booking => {
            console.log(`\nTour: ${booking.tour_settings.tour_name}`);
            console.log(`Date: ${booking.booking_date}`);
            console.log(`Time: ${booking.tour_time_slots.time_slot}`);
            console.log(`Participants: ${booking.adults} adults, ${booking.children} children, ${booking.infants} infants`);
            console.log(`Contact: ${booking.contact_name}`);
            console.log(`Status: ${booking.status}`);
            console.log(`Created: ${booking.created_at}`);
        });
    }
}

// Run verification
verifyMigration().catch(console.error); 
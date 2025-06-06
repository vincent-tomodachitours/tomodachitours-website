const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

(async () => {
    console.log('Checking Supabase tours data...');

    const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('created_at');

    if (error) {
        console.error('❌ Error fetching from Supabase:', error);
    } else {
        console.log('✅ Supabase tours data:');
        data.forEach(tour => {
            console.log(`  ${tour.type}: ¥${tour.base_price.toLocaleString('en-US')} (${tour.name})`);
        });
    }
})(); 
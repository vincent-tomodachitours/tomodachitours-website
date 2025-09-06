#!/bin/bash

# Script to update Bokun products with environment variables
# Usage: ./run_bokun_update.sh

echo "🔧 Updating Bokun Products with Environment Variables"
echo "=================================================="

# Check if environment variables are set
if [ -z "$NIGHT_TOUR_PRODUCT_ID" ] || [ -z "$MORNING_TOUR_PRODUCT_ID" ] || [ -z "$UJI_TOUR_PRODUCT_ID" ] || [ -z "$GION_TOUR_PRODUCT_ID" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set the following environment variables:"
    echo "  - NIGHT_TOUR_PRODUCT_ID"
    echo "  - MORNING_TOUR_PRODUCT_ID" 
    echo "  - UJI_TOUR_PRODUCT_ID"
    echo "  - GION_TOUR_PRODUCT_ID"
    echo ""
    echo "Example:"
    echo "  export NIGHT_TOUR_PRODUCT_ID=123456"
    echo "  export MORNING_TOUR_PRODUCT_ID=789012"
    echo "  export UJI_TOUR_PRODUCT_ID=345678"
    echo "  export GION_TOUR_PRODUCT_ID=901234"
    exit 1
fi

echo "✅ Environment variables found:"
echo "  NIGHT_TOUR_PRODUCT_ID: $NIGHT_TOUR_PRODUCT_ID"
echo "  MORNING_TOUR_PRODUCT_ID: $MORNING_TOUR_PRODUCT_ID"
echo "  UJI_TOUR_PRODUCT_ID: $UJI_TOUR_PRODUCT_ID"
echo "  GION_TOUR_PRODUCT_ID: $GION_TOUR_PRODUCT_ID"
echo ""

# Check if SQL file exists
if [ ! -f "update_bokun_products.sql" ]; then
    echo "❌ Error: update_bokun_products.sql not found"
    echo "Make sure the SQL file is in the current directory"
    exit 1
fi

# Create temporary SQL file with substituted values
TEMP_SQL="update_bokun_products_temp.sql"
envsubst < update_bokun_products.sql > $TEMP_SQL

echo "📝 Generated SQL with your product IDs:"
echo "======================================"
grep "UPDATE bokun_products" $TEMP_SQL
echo ""

# Check if we should run with Supabase or regular PostgreSQL
if command -v supabase >/dev/null 2>&1; then
    echo "🚀 Running with Supabase CLI..."
    supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" --file $TEMP_SQL
else
    echo "💾 Generated SQL file: $TEMP_SQL"
    echo "Run this with your preferred database client:"
    echo "  psql -d your_database -f $TEMP_SQL"
    echo "  OR"
    echo "  Copy and paste the SQL into your Supabase SQL editor"
fi

# Clean up
rm -f $TEMP_SQL

echo ""
echo "🎉 Update complete! Your Bokun products should now be configured."
echo "Next steps:"
echo "  1. Test the connection: node simple-bokun-test.js"
echo "  2. Test integration: node test-bokun-integration.js" 
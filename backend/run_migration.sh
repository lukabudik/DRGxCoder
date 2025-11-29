#!/bin/bash

# Migration script for Patient/Case separation
# Run this when database is accessible

echo "🚀 Starting database migration..."
echo ""

# Check if database is accessible
echo "📡 Checking database connection..."
npx prisma db pull --force 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Database not accessible. Please check connection and try again."
    exit 1
fi
echo "✅ Database connected"
echo ""

# Generate migration
echo "📝 Generating migration..."
npx prisma migrate dev --name add_patients_and_update_cases

if [ $? -eq 0 ]; then
    echo "✅ Migration successful!"
    echo ""
    
    # Generate Prisma client
    echo "🔄 Regenerating Prisma client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma client generated!"
        echo ""
        echo "🎉 Migration complete! Database is ready."
        echo ""
        echo "Next steps:"
        echo "1. Test XML upload with backend running"
        echo "2. Verify patient/case data in database"
        echo "3. Check frontend displays patient demographics"
    else
        echo "❌ Failed to generate Prisma client"
        exit 1
    fi
else
    echo "❌ Migration failed"
    exit 1
fi

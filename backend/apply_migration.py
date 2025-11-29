"""Apply migration using direct database connection"""
import os
import sys

# Set up path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

# Now import after env is loaded
from prisma import Prisma
import asyncio

async def main():
    print("📡 Connecting to database...")
    db = Prisma()
    await db.connect()
    
    try:
        # Read migration SQL
        with open("prisma/migrations/20241129_add_patients/migration.sql", "r") as f:
            migration_sql = f.read()
        
        print("🔄 Applying migration...")
        
        # Execute raw SQL
        await db.execute_raw(migration_sql)
        
        print("✅ Migration applied successfully!")
        
        # Verify
        patients = await db.query_raw('SELECT COUNT(*) as count FROM patients')
        cases = await db.query_raw('SELECT COUNT(*) as count FROM patient_cases')
        
        print(f"📊 Database now has:")
        print(f"  - {patients[0]['count']} patients")
        print(f"  - {cases[0]['count']} cases")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

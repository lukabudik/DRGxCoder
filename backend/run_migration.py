"""
Run database migration to add Patient table and update PatientCase
"""
import os
from supabase import create_client

def run_migration():
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
        return False
    
    print("📡 Connecting to database...")
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        # Read migration SQL
        with open("prisma/migrations/20241129_add_patients/migration.sql", "r") as f:
            migration_sql = f.read()
        
        print("🔄 Running migration...")
        
        # Execute migration using Supabase SQL function
        result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
        
        print("✅ Migration completed successfully!")
        
        # Check results
        patients = supabase.table('patients').select('id', count='exact').execute()
        cases = supabase.table('patient_cases').select('id', count='exact').execute()
        
        print(f"📊 Database now has:")
        print(f"  - {patients.count} patients")
        print(f"  - {cases.count} cases")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    success = run_migration()
    exit(0 if success else 1)

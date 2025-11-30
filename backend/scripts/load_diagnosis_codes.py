"""Load diagnosis codes from CSV into database"""

import asyncio
import pandas as pd
from pathlib import Path
from loguru import logger
from prisma import Prisma


async def load_diagnosis_codes():
    """Load all diagnosis codes from CSV into database"""
    
    # Load CSV
    csv_path = Path(__file__).parent.parent / "data" / "diagnosis_codes.csv"
    logger.info(f"Loading diagnosis codes from {csv_path}")
    
    df = pd.read_csv(csv_path)
    logger.info(f"Found {len(df)} codes in CSV")
    
    # Connect to database
    db = Prisma()
    await db.connect()
    logger.info("Connected to database")
    
    try:
        # Extract ICD-10 chapter from code (first letter or letters)
        def extract_chapter(code: str) -> str:
            """Extract ICD-10 chapter from code (e.g., A000 -> A, I21.9 -> I)"""
            if not code:
                return "UNKNOWN"
            # Take only letters at the start
            chapter = ""
            for char in code:
                if char.isalpha():
                    chapter += char
                else:
                    break
            return chapter if chapter else "UNKNOWN"
        
        # Prepare data for bulk insert
        codes_data = []
        for _, row in df.iterrows():
            code = str(row['Kod']).strip()
            name = str(row['Nazev']).strip()
            category = str(row['Kategorie']).strip() if pd.notna(row['Kategorie']) else None
            chapter = extract_chapter(code)
            
            codes_data.append({
                "code": code,
                "name": name,
                "category": category,
                "chapter": chapter,
            })
        
        # Bulk insert using raw SQL with batching
        batch_size = 1000
        total_inserted = 0
        
        for i in range(0, len(codes_data), batch_size):
            batch = codes_data[i:i + batch_size]
            
            # Build values string for batch insert
            values_list = []
            for code_data in batch:
                code = code_data['code'].replace("'", "''")  # Escape single quotes
                name = code_data['name'].replace("'", "''")
                category = code_data['category'].replace("'", "''") if code_data['category'] else None
                chapter = code_data['chapter'].replace("'", "''")
                
                if category:
                    values_list.append(f"(gen_random_uuid(), '{code}', '{name}', '{category}', '{chapter}', NOW())")
                else:
                    values_list.append(f"(gen_random_uuid(), '{code}', '{name}', NULL, '{chapter}', NOW())")
            
            values_str = ",\n".join(values_list)
            
            # Execute batch insert with ON CONFLICT DO NOTHING
            sql = f"""
                INSERT INTO diagnosis_codes (id, code, name, category, chapter, "createdAt")
                VALUES {values_str}
                ON CONFLICT (code) DO NOTHING
            """
            
            try:
                result = await db.execute_raw(sql)
                total_inserted += len(batch)
                logger.info(f"Progress: {min(i + batch_size, len(codes_data))}/{len(codes_data)} codes inserted")
            except Exception as e:
                logger.error(f"Error inserting batch at position {i}: {e}")
        
        logger.success(f"Successfully loaded {total_inserted} diagnosis codes into database")
        
        # Show some stats
        total_count = await db.diagnosiscode.count()
        logger.info(f"Total codes in database: {total_count}")
        
    finally:
        await db.disconnect()
        logger.info("Disconnected from database")


if __name__ == "__main__":
    asyncio.run(load_diagnosis_codes())

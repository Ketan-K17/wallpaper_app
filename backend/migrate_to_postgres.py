import sqlite3
import asyncio
import asyncpg
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_to_postgres():
    # PostgreSQL connection parameters
    pg_params = {
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD'),
        'database': os.getenv('POSTGRES_DB', 'wallpaper_generator'),
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', '5432'))
    }

    # Connect to SQLite
    sqlite_conn = sqlite3.connect('wallpaper_generator.db')
    sqlite_conn.row_factory = sqlite3.Row

    try:
        # Get all data from SQLite
        cursor = sqlite_conn.execute('SELECT * FROM generation_jobs')
        rows = cursor.fetchall()
        
        # Connect to PostgreSQL
        pg_pool = await asyncpg.create_pool(**pg_params)
        
        async with pg_pool.acquire() as pg_conn:
            # Create the table in PostgreSQL
            await pg_conn.execute("""
                CREATE TABLE IF NOT EXISTS generation_jobs (
                    generation_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    progress INTEGER DEFAULT 0,
                    image_url TEXT,
                    error_message TEXT,
                    description TEXT,
                    genre TEXT,
                    art_style TEXT,
                    user_id TEXT,
                    created_at TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP
                )
            """)
            
            # Migrate data
            print(f"Starting migration of {len(rows)} records...")
            for row in rows:
                row_dict = dict(row)
                await pg_conn.execute("""
                    INSERT INTO generation_jobs 
                    (generation_id, status, progress, image_url, error_message, 
                     description, genre, art_style, user_id, created_at, completed_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (generation_id) DO NOTHING
                """,
                    row_dict['generation_id'],
                    row_dict['status'],
                    row_dict['progress'],
                    row_dict['image_url'],
                    row_dict['error_message'],
                    row_dict['description'],
                    row_dict['genre'],
                    row_dict['art_style'],
                    row_dict['user_id'],
                    row_dict['created_at'],
                    row_dict['completed_at']
                )
            
            print("Migration completed successfully!")
            
            # Verify the migration
            count = await pg_conn.fetchval('SELECT COUNT(*) FROM generation_jobs')
            print(f"Total records in PostgreSQL: {count}")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        raise
    finally:
        sqlite_conn.close()
        await pg_pool.close()

if __name__ == "__main__":
    asyncio.run(migrate_to_postgres())

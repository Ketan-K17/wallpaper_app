import asyncpg
from datetime import datetime
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.pool = None
        self.database_url = os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable not set")

    async def init_database(self):
        """Initialize the database pool and create required tables"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.database_url)
            
        async with self.pool.acquire() as conn:
            await conn.execute("""
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
    
    async def create_generation_job(self, generation_id: str, description: str, 
                                  genre: Optional[str] = None, art_style: Optional[str] = None,
                                  user_id: Optional[str] = None) -> bool:
        """Create a new generation job"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO generation_jobs 
                    (generation_id, status, description, genre, art_style, user_id, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """, generation_id, 'pending', description, genre, art_style, user_id, datetime.now())
                return True
        except Exception as e:
            print(f"Error creating generation job: {e}")
            return False
    
    async def update_job_status(self, generation_id: str, status: str, 
                               progress: Optional[int] = None, image_url: Optional[str] = None,
                               error_message: Optional[str] = None) -> bool:
        """Update job status and related fields"""
        try:
            # Build dynamic update query
            update_fields = ["status = $1"]
            params = [status]
            param_count = 1
            
            if progress is not None:
                param_count += 1
                update_fields.append(f"progress = ${param_count}")
                params.append(progress)
            
            if image_url is not None:
                param_count += 1
                update_fields.append(f"image_url = ${param_count}")
                params.append(image_url)
            
            if error_message is not None:
                param_count += 1
                update_fields.append(f"error_message = ${param_count}")
                params.append(error_message)
            
            if status in ['completed', 'failed']:
                param_count += 1
                update_fields.append(f"completed_at = ${param_count}")
                params.append(datetime.now())
            
            param_count += 1
            params.append(generation_id)
            
            query = f"UPDATE generation_jobs SET {', '.join(update_fields)} WHERE generation_id = ${param_count}"
            
            async with self.pool.acquire() as conn:
                result = await conn.execute(query, *params)
                affected = result.split()[-1]  # Get number of affected rows
                print(f"🔄 Database update: {affected} rows affected for {generation_id}")
                return int(affected) > 0
        except Exception as e:
            print(f"Error updating job status: {e}")
            return False
    
    async def get_job(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific generation job"""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT * FROM generation_jobs WHERE generation_id = $1
                """, generation_id)
                return dict(row) if row else None
        except Exception as e:
            print(f"Error getting job: {e}")
            return None
    
    async def get_recent_jobs(self, limit: int = 10, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent generation jobs, optionally filtered by status"""
        try:
            async with self.pool.acquire() as conn:
                if status:
                    rows = await conn.fetch("""
                        SELECT * FROM generation_jobs 
                        WHERE status = $1 
                        ORDER BY completed_at DESC NULLS LAST
                        LIMIT $2
                    """, status, limit)
                else:
                    rows = await conn.fetch("""
                        SELECT * FROM generation_jobs 
                        ORDER BY completed_at DESC NULLS LAST
                        LIMIT $1
                    """, limit)
                
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error getting recent jobs: {e}")
            return []
    
    async def cleanup_old_jobs(self, days: int = 30) -> bool:
        """Clean up jobs older than specified days"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    DELETE FROM generation_jobs 
                    WHERE created_at < NOW() - INTERVAL '$1 days'
                """, str(days))
                return True
        except Exception as e:
            print(f"Error cleaning up old jobs: {e}")
            return False

# Global database instance
db_manager = DatabaseManager()
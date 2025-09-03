import sqlite3
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
import json
import os

class DatabaseManager:
    def __init__(self, db_path: str = "wallpaper_generator.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
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
            conn.commit()
    
    def get_connection(self):
        """Get a database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access to rows
        return conn
    
    async def create_generation_job(self, generation_id: str, description: str, 
                                  genre: Optional[str] = None, art_style: Optional[str] = None,
                                  user_id: Optional[str] = None) -> bool:
        """Create a new generation job"""
        conn = self.get_connection()
        try:
            conn.execute("""
                INSERT INTO generation_jobs 
                (generation_id, status, description, genre, art_style, user_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (generation_id, 'pending', description, genre, art_style, user_id, datetime.now()))
            conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error creating generation job: {e}")
            return False
        finally:
            conn.close()
    
    async def update_job_status(self, generation_id: str, status: str, 
                               progress: Optional[int] = None, image_url: Optional[str] = None,
                               error_message: Optional[str] = None) -> bool:
        """Update job status and related fields"""
        conn = self.get_connection()
        try:
            # Build dynamic update query
            update_fields = ["status = ?"]
            params = [status]
            
            if progress is not None:
                update_fields.append("progress = ?")
                params.append(progress)
            
            if image_url is not None:
                update_fields.append("image_url = ?")
                params.append(image_url)
            
            if error_message is not None:
                update_fields.append("error_message = ?")
                params.append(error_message)
            
            if status in ['completed', 'failed']:
                update_fields.append("completed_at = ?")
                params.append(datetime.now())
            
            params.append(generation_id)
            
            query = f"UPDATE generation_jobs SET {', '.join(update_fields)} WHERE generation_id = ?"
            cursor = conn.execute(query, params)
            conn.commit()
            print(f"🔄 Database update: {cursor.rowcount} rows affected for {generation_id}")
            return cursor.rowcount > 0
        except sqlite3.Error as e:
            print(f"Error updating job status: {e}")
            return False
        finally:
            conn.close()
    
    async def get_job(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific generation job"""
        conn = self.get_connection()
        try:
            cursor = conn.execute("""
                SELECT * FROM generation_jobs WHERE generation_id = ?
            """, (generation_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"Error getting job: {e}")
            return None
        finally:
            conn.close()
    
    async def get_recent_jobs(self, limit: int = 10, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent generation jobs, optionally filtered by status"""
        conn = self.get_connection()
        try:
            if status:
                query = """
                    SELECT * FROM generation_jobs 
                    WHERE status = ? 
                    ORDER BY completed_at DESC 
                    LIMIT ?
                """
                cursor = conn.execute(query, (status, limit))
            else:
                query = """
                    SELECT * FROM generation_jobs 
                    ORDER BY completed_at DESC 
                    LIMIT ?
                """
                cursor = conn.execute(query, (limit,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            print(f"Error getting recent jobs: {e}")
            return []
        finally:
            conn.close()
    
    async def cleanup_old_jobs(self, days: int = 30) -> bool:
        """Clean up jobs older than specified days"""
        conn = self.get_connection()
        try:
            conn.execute("""
                DELETE FROM generation_jobs 
                WHERE created_at < datetime('now', '-{} days')
            """.format(days))
            conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error cleaning up old jobs: {e}")
            return False
        finally:
            conn.close()

# Global database instance
db_manager = DatabaseManager()

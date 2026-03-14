import sqlite3
import os

db_path = "c:\\Users\\owner\\TELEGRAM SCRAPER ASSIGNMENT\\backend\\test.db"

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Add email column if it doesn't exist
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        conn.commit()
        print("Successfully added email column to users table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name: email" in str(e):
            print("Email column already exists.")
        else:
            print(f"Error migrating database: {e}")
    finally:
        conn.close()
else:
    print("Database file not found at", db_path)

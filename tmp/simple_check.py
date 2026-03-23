import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

print("Starting simplified check...")
try:
    from services.telegram_service import TelegramService
    print("Imported TelegramService")
    from telethon import TelegramClient, errors
    print("Imported Telethon")
except Exception as e:
    print(f"Error importing: {e}")
    sys.exit(1)

print("Simplified check complete.")

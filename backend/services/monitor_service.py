import asyncio
from telethon import events
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models import models
from services.telegram_service import telegram_service
from services.ai_service import ai_service
from services.alert_service import alert_service
from datetime import datetime

class MonitorService:
    def __init__(self):
        self.active_monitors = set() # Store phones that are currently being monitored

    async def start_monitoring(self):
        """Starts monitoring for all active accounts in the database."""
        print("Starting background monitoring service...")
        db = SessionLocal()
        try:
            accounts = db.query(models.Account).filter(models.Account.status == "active").all()
            for account in accounts:
                if account.phone not in self.active_monitors:
                    await self._attach_listener(account.phone, account.session_name, account.owner_id)
        finally:
            db.close()

    async def _attach_listener(self, phone: str, session_name: str, owner_id: int):
        try:
            client = await telegram_service.get_client(phone, session_name)
            
            # Remove existing handlers to prevent duplicates if called multiple times
            client.remove_event_handler(self._message_handler)
            
            # Attach the new message handler
            client.add_event_handler(
                lambda event: self._message_handler(event, owner_id),
                events.NewMessage(incoming=True)
            )
            
            self.active_monitors.add(phone)
            print(f"Attached monitor listener to account: {phone}")
        except Exception as e:
            print(f"Failed to attach listener to {phone}: {e}")

    async def _message_handler(self, event, owner_id: int):
        # Only process messages from chats/groups (not private PMs unless desired)
        if event.is_private:
            return

        message_text = event.message.text
        if not message_text:
            return

        db = SessionLocal()
        try:
            # Fetch active keywords
            keywords = db.query(models.KeywordSetting).filter(models.KeywordSetting.is_active == True).all()
            keyword_list = [k.keyword.lower() for k in keywords]
            
            matched_keyword = None
            
            # Check for exact keyword matches first
            msg_lower = message_text.lower()
            for kw in keyword_list:
                if kw in msg_lower:
                    matched_keyword = kw
                    break
            
            # If no exact match but we have AI, use AI detection
            if not matched_keyword and len(keyword_list) == 0:
                # Fallback to AI if no custom keywords defined
                is_buyer = await ai_service.detect_buyer(message_text)
                if is_buyer:
                    matched_keyword = "ai_detected"
            
            if matched_keyword:
                sender = await event.get_sender()
                if not sender:
                    return

                # Check if lead already exists to prevent spam
                existing_lead = db.query(models.Lead).filter(
                    models.Lead.telegram_id == sender.id,
                    models.Lead.user_id == owner_id
                ).first()

                if not existing_lead:
                    print(f"[{datetime.now()}] Lead Detected! User: {getattr(sender, 'username', sender.id)} | Keyword: {matched_keyword}")
                    
                    new_lead = models.Lead(
                        telegram_id=sender.id,
                        username=getattr(sender, 'username', None) or getattr(sender, 'first_name', str(sender.id)),
                        message_content=message_text,
                        detection_keyword=matched_keyword,
                        status="new",
                        user_id=owner_id
                    )
                    db.add(new_lead)
                    db.commit()
                    
                    # Trigger alert via alert_service
                    owner = db.query(models.User).filter(models.User.id == owner_id).first()
                    if owner and owner.email:
                        subject = f"New Lead Detected: {matched_keyword}"
                        content = f"A new lead has been detected!\n\nUser: {new_lead.username}\nKeyword Matched: {matched_keyword}\nMessage: {message_text}"
                        alert_service.send_email(to_email=owner.email, subject=subject, content=content)

                    
        except Exception as e:
            print(f"Error processing message event: {e}")
        finally:
            db.close()

monitor_service = MonitorService()

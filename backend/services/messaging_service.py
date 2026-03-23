from sqlalchemy.orm import Session
from models import models
from services.telegram_service import telegram_service
import asyncio
import random
from datetime import datetime

class MessagingService:
    async def run_campaign(self, campaign_id: int):
        from core.database import SessionLocal
        db = SessionLocal()
        try:
            campaign: models.Campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
            if not campaign or campaign.status != "pending":
                return
    
            campaign.status = "running"
            db.commit()

        try:
            # Get template and target users (scraped users)
            template = campaign.template
            query = db.query(models.ScrapedUser)
            if campaign.group_id:
                query = query.filter(models.ScrapedUser.group_id == campaign.group_id)
            
            users = query.all()
            
            # Get available account
            account = db.query(models.Account).filter(models.Account.owner_id == campaign.user_id).first()
            if not account:
                campaign.status = "failed"
                log = models.Log(level="ERROR", message=f"No Telegram account linked for campaign {campaign.id}", user_id=campaign.user_id)
                db.add(log)
                db.commit()
                return

            client = await telegram_service.get_client(account.phone, account.session_name)
            
            for user in users:
                db.refresh(campaign)
                if campaign.status != "running": # Handle pause/terminate
                    print(f"DEBUG: Campaign {campaign_id} interrupted (status: {campaign.status})")
                    break
                
                try:
                    # Anti-ban: Random delay
                    delay = random.randint(60, 120)
                    await asyncio.sleep(delay)
                    
                    # Send message
                    # Telethon: client.send_message(entity, message)
                    # We use username if available, else phone/id
                    target = user.username if user.username else user.telegram_id
                    await client.send_message(target, template.content)
                    
                    # Log success
                    log = models.Log(level="INFO", message=f"Sent message to {target}", user_id=campaign.user_id)
                    db.add(log)
                    db.commit()
                    
                except Exception as e:
                    log = models.Log(level="ERROR", message=f"Failed to send to {user.telegram_id}: {str(e)}", user_id=campaign.user_id)
                    db.add(log)
                    db.commit()
            
            campaign.status = "completed"
            db.commit()
            
        except Exception as e:
            print(f"DEBUG: Campaign {campaign_id} failed: {str(e)}")
            campaign.status = "failed"
            db.commit()
        finally:
            db.close()

messaging_service = MessagingService()

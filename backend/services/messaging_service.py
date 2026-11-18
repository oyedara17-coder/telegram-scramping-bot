import asyncio
import random

from models import models
from services.telegram_service import telegram_service


class MessagingService:
    def __init__(self):
        self.running_tasks: dict[int, asyncio.Task] = {}
        self.pause_events: dict[int, asyncio.Event] = {}

    async def start_campaign(self, campaign_id: int):
        task = self.running_tasks.get(campaign_id)
        if task and not task.done():
            return
        task = asyncio.create_task(self.run_campaign(campaign_id))
        self.running_tasks[campaign_id] = task

    async def pause_campaign(self, campaign_id: int):
        event = self.pause_events.get(campaign_id)
        if event:
            event.set()
        task = self.running_tasks.get(campaign_id)
        if task and task is not asyncio.current_task():
            await task

    async def run_campaign(self, campaign_id: int):
        from core.database import SessionLocal

        db = SessionLocal()
        try:
            campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
            if not campaign or campaign.status != "pending":
                return

            pause_event = asyncio.Event()
            self.pause_events[campaign_id] = pause_event
            transitioned = db.query(models.Campaign).filter(
                models.Campaign.id == campaign_id,
                models.Campaign.status == "pending",
            ).update({models.Campaign.status: "running"}, synchronize_session=False)
            if not transitioned:
                self.pause_events.pop(campaign_id, None)
                return
            db.commit()
            db.refresh(campaign)

            owner = db.query(models.User).filter(models.User.id == campaign.user_id).first()
            if not owner or owner.status != "active":
                campaign.status = "paused"
                db.commit()
                return

            account = db.query(models.Account).filter(
                models.Account.owner_id == campaign.user_id,
                models.Account.status == "active",
            ).first()
            if not account:
                campaign.status = "paused"
                db.add(models.Log(level="WARNING", message=f"Campaign {campaign.id} paused: no active Telegram account", user_id=campaign.user_id))
                db.commit()
                return

            if not campaign.template:
                campaign.status = "failed"
                db.add(models.Log(level="ERROR", message=f"Campaign {campaign.id} has no message template", user_id=campaign.user_id))
                db.commit()
                return

            recipients = db.query(models.ScrapedUser)
            if campaign.group_id:
                recipients = recipients.filter(models.ScrapedUser.group_id == campaign.group_id)
            users = recipients.order_by(models.ScrapedUser.id.asc()).all()
            start_at = min(campaign.processed_count or 0, len(users))
            setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == "global_delay").first()
            base_delay = max(10, min(3600, int(setting.value))) if setting else 60
            client = await telegram_service.get_client(account.phone, account.session_name)

            for user in users[start_at:]:
                db.refresh(campaign)
                db.refresh(account)
                owner = db.query(models.User).filter(models.User.id == campaign.user_id).first()
                if campaign.status != "running":
                    break
                if account.status != "active" or not owner or owner.status != "active":
                    campaign.status = "paused"
                    db.commit()
                    break

                try:
                    await asyncio.wait_for(pause_event.wait(), timeout=random.randint(base_delay, min(7200, base_delay * 2)))
                    db.refresh(campaign)
                    if campaign.status != "running":
                        break
                except asyncio.TimeoutError:
                    pass

                target = user.username if user.username else user.telegram_id
                try:
                    await client.send_message(target, campaign.template.content)
                    db.add(models.Log(level="INFO", message=f"Campaign {campaign.id} sent a message to {target}", user_id=campaign.user_id))
                except Exception as exc:
                    db.add(models.Log(level="ERROR", message=f"Campaign {campaign.id} could not message {user.telegram_id}: {str(exc)[:300]}", user_id=campaign.user_id))
                campaign.processed_count += 1
                db.commit()

            db.refresh(campaign)
            if campaign.status == "running":
                campaign.status = "completed"
                db.commit()
        except Exception as exc:
            db.rollback()
            failed_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
            if failed_campaign and failed_campaign.status == "running":
                failed_campaign.status = "failed"
                db.add(models.Log(level="ERROR", message=f"Campaign {campaign_id} failed: {str(exc)[:300]}", user_id=failed_campaign.user_id))
                db.commit()
        finally:
            db.close()
            self.pause_events.pop(campaign_id, None)
            if self.running_tasks.get(campaign_id) is asyncio.current_task():
                self.running_tasks.pop(campaign_id, None)


messaging_service = MessagingService()

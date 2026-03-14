from typing import Optional, Union
from sqlalchemy.orm import Session
from telethon import TelegramClient, events, errors
from telethon.sessions import StringSession
from core.config import get_settings
from models import models
import asyncio
import os

settings = get_settings()

class TelegramService:
    def __init__(self):
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.clients = {} # phone -> TelegramClient
        self.auth_states = {} # phone -> {phone_code_hash: str, client: TelegramClient}

    async def get_client(self, phone: str, session_str: Optional[str] = None) -> TelegramClient:
        if phone in self.clients:
            return self.clients[phone]
        
        session = StringSession(session_str) if session_str else StringSession()
        client = TelegramClient(session, self.api_id, self.api_hash)
        await client.connect()
        self.clients[phone] = client
        return client

    async def send_code(self, phone: str):
        client = await self.get_client(phone)
        try:
            return await client.send_code_request(phone)
        except Exception as e:
            await client.disconnect()
            self.clients.pop(phone, None)
            raise e


    async def sign_in(self, phone: str, phone_code_hash: str, code: str):
        client = await self.get_client(phone)
        try:
            user = await client.sign_in(phone, code, phone_code_hash=phone_code_hash)
            session_str = client.session.save()
            return user, session_str
        except errors.SessionPasswordNeededError:
            # Note: 2FA not implemented in this flow for simplicity
            raise Exception("2FA is enabled on this account. Please disable it to use this platform or wait for updates.")
        except Exception as e:
            raise e

    async def get_groups(self, phone: str):
        client = await self.get_client(phone)
        dialogs = await client.get_dialogs()
        groups = [d for d in dialogs if d.is_group or d.is_channel]
        return groups

    async def scrape_members(self, phone: str, group_id: Union[int, str]):
        client = await self.get_client(phone)
        group = await client.get_entity(group_id)
        members = await client.get_participants(group)
        return members

    async def send_message(self, phone: str, target_id: Union[int, str], message: str):
        client = await self.get_client(phone)
        return await client.send_message(target_id, message)

    async def get_joined_groups_count(self, db: 'Session', user_id: int):
        account = db.query(models.Account).filter(models.Account.owner_id == user_id).first()
        if not account:
            return 0
        try:
            groups = await self.get_groups(account.phone)
            return len(groups)
        except:
            return 0


telegram_service = TelegramService()

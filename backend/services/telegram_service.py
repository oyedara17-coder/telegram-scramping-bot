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
        if not settings.validate_telegram_config():
            raise ValueError(
                "TELEGRAM_API_ID or TELEGRAM_API_HASH is not set. "
                "Please check your .env file or environment variables. "
                "Refer to telethon.rtfd.io for more information."
            )
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.clients = {} # phone -> TelegramClient
        self.auth_states = {} # phone -> {phone_code_hash: str, client: TelegramClient}

    async def get_client(self, phone: str, session_str: Optional[str] = None) -> TelegramClient:
        if phone in self.clients:
            print(f"DEBUG: Reusing existing client for {phone}")
            return self.clients[phone]
        
        print(f"DEBUG: Creating new client for {phone}")
        session = StringSession(session_str) if session_str else StringSession()
        client = TelegramClient(session, self.api_id, self.api_hash)
        await client.connect()
        self.clients[phone] = client
        return client

    async def send_code(self, phone: str):
        client = await self.get_client(phone)
        try:
            print(f"DEBUG: Sending code request to {phone}")
            return await client.send_code_request(phone)
        except Exception as e:
            print(f"DEBUG: send_code_request failed for {phone}: {str(e)}")
            await client.disconnect()
            self.clients.pop(phone, None)
            raise e


    async def sign_in(self, phone: str, phone_code_hash: str, code: str, password: Optional[str] = None):
        client = await self.get_client(phone)
        try:
            print(f"DEBUG: Calling client.sign_in for {phone}")
            user = await client.sign_in(phone, code, phone_code_hash=phone_code_hash)
            session_str = client.session.save()
            print(f"DEBUG: Sign-in success for {phone}")
            return user, session_str
        except errors.SessionPasswordNeededError:
            print(f"DEBUG: 2FA required for {phone}")
            if not password:
                raise Exception("2FA is enabled on this account. Please Provide your 2FA Cloud Password in the Optional Field.")
            
            try:
                print(f"DEBUG: Attempting 2FA sign-in for {phone} with provided password")
                user = await client.sign_in(password=password)
                session_str = client.session.save()
                print(f"DEBUG: 2FA sign-in success for {phone}")
                return user, session_str
            except errors.PasswordHashInvalidError:
                print(f"DEBUG: Invalid 2FA password for {phone}")
                raise Exception("The 2FA cloud password you provided is incorrect.")
            except Exception as e2:
                print(f"DEBUG: 2FA sign-in failed for {phone}: {type(e2).__name__}: {str(e2)}")
                raise e2
        except errors.PhoneCodeInvalidError:
            print(f"DEBUG: Invalid code for {phone}")
            raise Exception("the verification code you entered is invalid. Please check and try again.")
        except errors.PhoneCodeExpiredError:
            print(f"DEBUG: Expired code for {phone}")
            raise Exception("The verification code has expired. Please request a new one.")
        except Exception as e:
            print(f"DEBUG: Sign-in failed for {phone}: {type(e).__name__}: {str(e)}")
            raise e

    async def get_groups(self, phone: str, session_str: Optional[str] = None):
        client = await self.get_client(phone, session_str)
        dialogs = await client.get_dialogs()
        groups = [d for d in dialogs if d.is_group or d.is_channel]
        return groups

    async def scrape_members(self, phone: str, group_id: Union[int, str], session_str: Optional[str] = None):
        client = await self.get_client(phone, session_str)
        group = await client.get_entity(group_id)
        members = await client.get_participants(group)
        return members

    async def send_message(self, phone: str, target_id: Union[int, str], message: str, session_str: Optional[str] = None):
        client = await self.get_client(phone, session_str)
        return await client.send_message(target_id, message)

    async def get_joined_groups_count(self, db: 'Session', user_id: int):
        account = db.query(models.Account).filter(models.Account.owner_id == user_id).first()
        if not account:
            return 0
        try:
            groups = await self.get_groups(account.phone, account.session_name)
            return len(groups)
        except:
            return 0


telegram_service = TelegramService()

import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock, patch

# 1. Mock the entire database and settings before importing anything else
mock_settings = MagicMock()
mock_settings.TELEGRAM_API_ID = 123
mock_settings.TELEGRAM_API_HASH = 'hash'
mock_settings.validate_telegram_config.return_value = True

sys.modules['core.config'] = MagicMock()
sys.modules['core.config'].get_settings = MagicMock(return_value=mock_settings)

sys.modules['core.database'] = MagicMock()
sys.modules['core.database'].Base = MagicMock()
sys.modules['core.database'].engine = MagicMock()
sys.modules['core.database'].SessionLocal = MagicMock()
sys.modules['core.database'].get_db = MagicMock()

# 2. Mock telethon errors
import telethon.errors as errors
class SessionPasswordNeededError(Exception):
    pass
errors.SessionPasswordNeededError = SessionPasswordNeededError

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_signin_with_2fa():
    from services.telegram_service import TelegramService
    
    # 3. Patch TelegramClient and StringSession
    with patch('services.telegram_service.TelegramClient') as MockClient, \
         patch('services.telegram_service.StringSession') as MockSession:
        
        service = TelegramService()
        
        # Test Case 1: Simple sign in success
        print("Running Test Case 1: Simple sign-in...")
        mock_client = AsyncMock()
        mock_client.sign_in.return_value = MagicMock(id=123, username='testuser')
        mock_client.session.save.return_value = 'session_str'
        MockClient.return_value = mock_client
        
        user, session = await service.sign_in('+123456789', 'hash', '12345')
        print(f"Success: Simple sign-in works. User: {user.username}")
        assert user.id == 123
        assert session == 'session_str'
        
        # Test Case 2: 2FA needed, password provided
        print("Running Test Case 2: 2FA with password...")
        mock_client.sign_in.reset_mock()
        # First call raises 2FA error, second call succeeds
        mock_client.sign_in.side_effect = [errors.SessionPasswordNeededError(), MagicMock(id=123, username='2fauser')]
        
        user, session = await service.sign_in('+123456789', 'hash', '12345', password='my_password')
        print(f"Success: 2FA with password works. User: {user.username}")
        assert mock_client.sign_in.call_count == 2
        # Check that the second call was made with the password
        # Note: In our implementation, we call it as client.sign_in(password=password)
        mock_client.sign_in.assert_any_call(password='my_password')
        assert session == 'session_str'
        
        # Test Case 3: 2FA needed, NO password provided
        print("Running Test Case 3: 2FA with missing password...")
        mock_client.sign_in.reset_mock()
        mock_client.sign_in.side_effect = errors.SessionPasswordNeededError()
        try:
            await service.sign_in('+123456789', 'hash', '12345', password=None)
            print("Failed: Should have raised exception for missing password")
            assert False
        except Exception as e:
            print(f"Success: Correctly raised error for missing password: {e}")
            assert "2FA is enabled" in str(e)

if __name__ == "__main__":
    print("Starting isolated verification test...")
    asyncio.run(test_signin_with_2fa())
    print("Verification test completed successfully.")

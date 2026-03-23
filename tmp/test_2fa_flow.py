import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock, patch

# Mock Telethon errors
class SessionPasswordNeededError(Exception):
    pass

# Add backend to sys.path so we can import services
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_signin_with_2fa():
    from services.telegram_service import TelegramService
    from telethon import errors
    
    # Mock settings and client
    with patch('services.telegram_service.get_settings') as mock_settings, \
         patch('services.telegram_service.TelegramClient') as MockClient, \
         patch('services.telegram_service.StringSession') as MockSession:
        
        mock_settings.return_value.TELEGRAM_API_ID = 123
        mock_settings.return_value.TELEGRAM_API_HASH = 'hash'
        mock_settings.return_value.validate_telegram_config.return_value = True
        
        service = TelegramService()
        
        # Test Case 1: Simple sign in success
        print("Running Test Case 1...")
        mock_client = AsyncMock()
        mock_client.sign_in.return_value = MagicMock(id=123)
        mock_client.connect = AsyncMock()
        mock_client.session.save.return_value = 'session_str'
        MockClient.return_value = mock_client
        
        user, session = await service.sign_in('+123456789', 'hash', '12345')
        print("Success: Simple sign in works")
        assert user.id == 123
        assert session == 'session_str'
        
        # Test Case 2: 2FA needed, password provided
        print("Running Test Case 2...")
        # Reset mock for second test
        mock_client.sign_in.reset_mock()
        mock_client.sign_in.side_effect = [errors.SessionPasswordNeededError(), MagicMock(id=123)]
        
        user, session = await service.sign_in('+123456789', 'hash', '12345', password='my_password')
        print("Success: 2FA with password works")
        assert mock_client.sign_in.call_count == 2
        mock_client.sign_in.assert_called_with(password='my_password')
        
        # Test Case 3: 2FA needed, NO password provided
        print("Running Test Case 3...")
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
    # We need to mock telethon errors specifically for this test
    import telethon.errors as tele_errors
    asyncio.run(test_signin_with_2fa())

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client
from core.config import get_settings

settings = get_settings()

class AlertService:
    def send_email(self, to_email: str, subject: str, content: str):
        if not settings.SENDGRID_API_KEY:
            print(f"Email mock to {to_email}: {subject}")
            return
            
        message = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=content
        )
        try:
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(message)
        except Exception as e:
            print(f"Email failed: {e}")

    def send_whatsapp(self, to_phone: str, message: str):
        if not settings.TWILIO_ACCOUNT_SID:
            print(f"WhatsApp mock to {to_phone}: {message}")
            return
            
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                from_=f'whatsapp:{settings.TWILIO_PHONE_NUMBER}',
                body=message,
                to=f'whatsapp:{to_phone}'
            )
        except Exception as e:
            print(f"WhatsApp failed: {e}")

alert_service = AlertService()

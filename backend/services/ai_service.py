from openai import OpenAI
from core.config import get_settings

settings = get_settings()

# Configure xAI (Grok) - xAI API is OpenAI-compatible
API_KEY = settings.XAI_API_KEY if settings.XAI_API_KEY else settings.OPENAI_API_KEY
BASE_URL = "https://api.x.ai/v1" if settings.XAI_API_KEY else None

client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL
) if API_KEY else None

class AIService:
    async def detect_buyer(self, message: str) -> bool:
        if not client:
            # Simple keyword fallback if no AI key
            keywords = ["buy", "price", "how much", "available", "cost", "order"]
            return any(k in message.lower() for k in keywords)
        
        try:
            # Using Grok model
            model = "grok-beta" if settings.XAI_API_KEY else "gpt-3.5-turbo"
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a buyer detection assistant. Decide if the following message is from a potential buyer interested in a product or service. Respond only with 'YES' or 'NO'."},
                    {"role": "user", "content": message}
                ]
            )
            return response.choices[0].message.content.strip().upper() == "YES"
        except Exception as e:
            print(f"AI Detection Error: {e}")
            return False

    async def generate_reply(self, message: str) -> str:
        if not client:
            return "Thank you for your interest! How can I help you today?"
            
        try:
            model = "grok-beta" if settings.XAI_API_KEY else "gpt-3.5-turbo"
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful sales assistant. Generate a polite and helpful reply to this potential buyer's message."},
                    {"role": "user", "content": message}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"AI Generation Error: {e}")
            return "Hello! I saw your message. Let me know how I can assist you."

ai_service = AIService()


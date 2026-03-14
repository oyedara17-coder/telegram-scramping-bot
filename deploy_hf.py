import os
from huggingface_hub import HfApi, upload_folder

# Configuration - Token should be set via environment variable for security
TOKEN = os.getenv("HF_TOKEN")
REPO_NAME = "stepyzoid-backend"
LOCAL_DIR = r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\backend"

if not TOKEN:
    print("Error: HF_TOKEN environment variable not set.")
    exit(1)

api = HfApi(token=TOKEN)

try:
    # 1. Get user info
    user_info = api.whoami()
    username = user_info['name']
    repo_id = f"{username}/{REPO_NAME}"
    
    print(f"Target Repo ID: {repo_id}")

    # 2. Upload the backend folder
    print(f"Uploading source files from {LOCAL_DIR}...")
    upload_folder(
        folder_path=LOCAL_DIR,
        repo_id=repo_id,
        repo_type="space",
        ignore_patterns=[
            ".git*", 
            "__pycache__*", 
            "*.pyc", 
            "venv/*", 
            "test.db",
            "*.log"
        ],
        token=TOKEN
    )
    
    print(f"\nDeployment Successful!")
    print(f"Your backend is live at: https://huggingface.co/spaces/{repo_id}")
    
    subdomain = f"{username}-{REPO_NAME}".replace("_", "-")
    print(f"The API URL (for Vercel) will be: https://{subdomain}.hf.space")

except Exception as e:
    print(f"Error during deployment: {e}")

---
title: Stepyzoid Backend
emoji: 🛰️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Stepyzoid Backend Node

This is the FastAPI backend for the Stepyzoid Telegram Scraping platform.

## Configuration
Ensure you set the following environment variables in your Hugging Face Space settings:
- `DATABASE_URL`
- `SECRET_KEY`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `OPENAI_API_KEY` (if using AI features)

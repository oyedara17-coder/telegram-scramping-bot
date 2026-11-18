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
Set these variables in the backend deployment environment:
- `DATABASE_URL`
- `JWT_SECRET_KEY` (at least 32 random characters; `SECRET_KEY` is also accepted for compatibility)
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `OPENAI_API_KEY` (if using AI features)

The backend no longer seeds a shared administrator or exposes public setup/reset routes. On startup, known bootstrap administrator usernames are paused until an operator re-provisions credentials with the trusted interactive `fix_admin.py` utility. Startup also applies additive migrations for session revocation and campaign progress. Existing JWTs are invalidated when this versioned-token requirement is introduced.

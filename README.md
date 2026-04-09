# Smart RFID Attendance System - Render Deploy

This folder is a clean deployment package for GitHub + Render.

## What to upload to GitHub

- `package.json`
- `server.js`
- `src/`
- `public/`
- `data/`
- `.env.example`
- `README.md`

Do not upload:
- `node_modules/`
- `.env`

## Render settings

- Environment: Node
- Build command: `npm install`
- Start command: `npm start`
- Node version: 18 or newer

## Required environment variables on Render

- `GOOGLE_APPS_SCRIPT_URL`
- `APPS_SCRIPT_READ_QUERY=mode=read`
- `REFRESH_INTERVAL_MS=5000`
- `USE_LOCAL_SAMPLE_DATA=false`
- `AUTH_ENABLED=false`
- `SESSION_SECRET`

## Live URLs after deploy

- `/` dashboard
- `/attendance` API
- `/events` live stream

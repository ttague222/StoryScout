# StoryScout

**Proof of concept — not in active development.** AI-powered story and book discovery app. Validates the same React Native + FastAPI + Firebase architecture pattern used in production Watchlight apps.

- **GitHub:** https://github.com/ttague222/StoryScout

## Structure

```
StoryScout/
├── mobile-app/      # React Native + Expo
│   └── src/         # Screens, navigation, services
└── api-service/     # Python FastAPI recommendation engine
    ├── src/         # API routes, Firebase integration, recommendation service
    └── scripts/     # Data ingestion from Open Library API
```

## Tech Stack
- **Mobile:** React Native, Expo, Firebase Auth
- **API:** Python, FastAPI, Firebase Firestore, httpx
- **Data:** Open Library API for book catalog ingestion

## Running Locally

```bash
# API
cd api-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload

# Mobile
cd mobile-app
npm install
npx expo start
```

## Key Notes
- POC only — no app store presence
- Never commit `.env` or `firebase-service-account.json`

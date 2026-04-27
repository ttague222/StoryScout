# StoryScout — AI-powered story and book discovery

> **Proof of concept.** Built to validate AI-driven book recommendations with a mobile-first experience.

StoryScout helps readers discover their next book based on mood, genre, and reading history. The app pairs a React Native mobile client with a FastAPI recommendation engine backed by Firebase — the same architecture pattern used in Watchlight Interactive's production apps.

---

## Architecture

```
StoryScout/
├── api-service/     # FastAPI recommendation engine (Python)
│   ├── src/         # API routes, services, Firebase integration
│   └── scripts/     # Data ingestion scripts (Open Library API)
└── mobile-app/      # React Native + Expo (iOS & Android)
    └── src/         # Screens, navigation, services
```

---

## Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=flat&logo=Firebase&logoColor=white)

---

## Key Features

- **AI book recommendations** — personalized suggestions based on mood and reading history
- **Book cover scanning** — camera integration to scan and identify books
- **Open Library integration** — catalog ingestion from the Open Library API
- **Firebase backend** — Firestore for user profiles and book data, Firebase Auth for accounts
- **Dockerized API** — containerized FastAPI service for easy deployment

---

## Getting Started

```bash
# API service
cd api-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload

# Mobile app
cd mobile-app
npm install
npx expo start
```

---

> This is a proof of concept — not currently in active development or published to app stores.

Built by [Watchlight Interactive](https://watchlightinteractive.com)

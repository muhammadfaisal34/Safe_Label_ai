# SafeLabel AI

SafeLabel AI is organized as a React Native mobile client, a FastAPI backend, AI integration boundaries, and an admin panel.

## Layout

- `app/mobile/` — Expo app entry point and feature-oriented source paths
- `app/backend/app/` — FastAPI routes, services, schemas, models, and admin hooks
- `ai/` — OCR, NER, translation, and allergen detection integration boundaries
- `database/` — PostgreSQL schema and seed data
- `app/admin-panel/` — Next.js admin interface
- `tests/` — backend API and allergen tests

## Run the backend

  .venv\\Scripts\\Activate.ps1
  pip install -r app/backend/requirements.txt
  uvicorn app.backend.app.main:app --reload

For the complete backend with PostgreSQL, start the services from the repository root:

    docker compose up --build

The first start initializes PostgreSQL from `database/schema.sql` and
`database/seed_data.sql`. The API exposes `POST /auth/register` and
`POST /auth/login`, which return bearer tokens for authenticated requests such as
`GET /users/me`. Label images can be uploaded to `POST /scans/ocr` as multipart
form data using the `file` field. OCR uses Tesseract, spaCy NER identifies allergen
entities, and `GET /products/{barcode}` looks up products through Open Food Facts.

For native Windows development, install the OCR engine once:

  winget install --id tesseract-ocr.tesseract --exact

The API is available at `http://localhost:8000`; set `EXPO_PUBLIC_API_URL` for the mobile client.

## Run the mobile app

Requires Node.js 22.13 or newer.

    cd app/mobile
    npm install
    npx expo install expo-asset expo-constants expo-camera expo-image-picker expo-status-bar \
      @react-native-async-storage/async-storage react-native-screens react-native-safe-area-context
    npx expo-doctor
    npx expo start -c

`expo install` picks the exact versions Expo SDK 57 expects for each native package.

Expo Go for SDK 57 may not be on the App Store / Play Store yet:
- Android: `npx expo start` then press `a` (Expo CLI installs a compatible Expo Go).
- iOS: use `eas go`, or a development build (`npx expo run:ios`).

Barcode scans call OpenFoodFacts directly. Label photos use a demo OCR result until you set
`EXPO_PUBLIC_API_URL` to your FastAPI backend (`POST /ocr`, optional `POST /analyze`).

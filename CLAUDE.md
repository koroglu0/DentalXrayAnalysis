# Dental X-Ray AI Analysis System

AI-powered dental X-ray analysis using YOLO object detection. Detects cavities, abscesses, fillings, implants, and other pathologies. Provides risk scores, confidence levels, clinical recommendations, and PDF reports.

## Tech Stack

- **Backend**: Python 3.10+, Flask 3.1.2, Ultralytics YOLO, OpenCV, PyJWT, Flask-CORS
- **Web Frontend**: React 19.1, Vite 7.1, Tailwind CSS 3.4, React Router 7.9, Axios, jsPDF
- **Mobile**: React Native 0.81.5 (Expo 54), NativeWind, Tailwind CSS
- **Infrastructure**: AWS DynamoDB, AWS CDK (Python), optionally AWS Cognito auth

## Directory Structure

```
backend/             Flask API — routes/, services/, middleware/, config/, utils/, data/
dental-ai-web/       React web app — src/pages/, src/components/, src/services/
mobile/              Expo React Native app — app/(auth)/, (doctor)/, (patient)/, (admin)/
infrastructure/      AWS CDK stacks for DynamoDB
```

Key files:
- `backend/app.py` — Flask entry point
- `backend/best.pt` — YOLO model weights (not in git)
- `backend/config/settings.py` — Dev/Prod/Test config classes

## Running Locally

**Backend:**
```bash
cd backend && python app.py   # http://localhost:5000
```

**Web:**
```bash
cd dental-ai-web && npm run dev   # http://localhost:5173
```

**Mobile:**
```bash
cd mobile && npm start
```

**Docker (prod):**
```bash
docker build -t dental-ai . && docker run -p 5000:8000 dental-ai
```

## Environment Variables

**`backend/.env`:**
```
SECRET_KEY=
FLASK_ENV=development
USE_DYNAMODB=true
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
DYNAMODB_ENDPOINT=
USE_COGNITO=false
COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
```

**`dental-ai-web/.env`:**
```
VITE_API_URL=http://localhost:5000
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/register` | Register |
| POST | `/api/login` | Login (returns JWT) |
| GET | `/api/me` | Current user |
| POST | `/api/analyze` | Upload X-ray for YOLO analysis |
| GET | `/api/history` | Analysis history |
| GET | `/api/analysis/<id>` | Single analysis result |
| * | `/api/organizations` | Org CRUD |
| * | `/api/patients` | Patient CRUD |
| * | `/api/notes` | Notes CRUD |
| GET | `/api/health` | Health check |

## Storage

Toggle with `USE_DYNAMODB` env var:
- `false` → local JSON files in `backend/data/`
- `true` → AWS DynamoDB (deploy infra first: `cd infrastructure && .\deploy-stack.bat`)

## Roles

`admin`, `doctor`, `patient` — enforced via JWT middleware.

## Notes

- YOLO model file (`best.pt`) is large; not tracked in git — must be present at `backend/best.pt`
- Railway deploy: uses `backend/Dockerfile` + `Procfile` with gunicorn
- Web dark mode supported

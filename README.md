# GradGlow

### Early Student Risk Prediction & Academic Intervention Platform

GradGlow is a full-stack machine learning application that identifies students who may be academically at risk and provides advisors with information to support early intervention.

The system processes assessment and Virtual Learning Environment (VLE) activity data through an ETL and feature-engineering pipeline, applies checkpoint-specific machine learning models, and presents risk predictions through a FastAPI backend and React frontend.

> **Academic project:** GradGlow is a decision-support system. Its predictions are intended to assist academic advisors, not replace human judgment.

---

## Features

### Machine Learning
- Student risk prediction at Week 4, Week 8, and Week 12 checkpoints
- Low, Medium, and High risk classification
- Student-level risk probabilities
- Assessment and VLE engagement feature engineering
- Risk-factor explanations
- Recommended intervention actions

### Advisor Experience
- View students and current risk levels
- Inspect individual student risk details
- Review risk history
- View contributing risk factors
- Review recommended interventions

### Student Experience
- Student dashboard
- Academic risk information
- Support request submission
- Messages
- Appointments

### Administration & API
- Role-based authentication
- Student, advisor, and administrator workflows
- Dataset upload and ETL processing
- Prediction generation
- REST API
- Swagger/OpenAPI documentation
- API health monitoring

---

## How GradGlow Works

```text
Raw Educational Data
        │
        ▼
   ETL Pipeline
        │
        ▼
 Feature Engineering
        │
        ▼
Canonical Student Dataset
        │
        ▼
Checkpoint-Specific ML Model
   Week 4 / Week 8 / Week 12
        │
        ▼
  Risk Probability
        │
        ▼
Low / Medium / High Risk
        │
        ▼
Risk Factors + Recommended Actions
        │
        ▼
Advisor / Student Interface
```

---

## Machine Learning Features

The prediction pipeline uses academic and engagement indicators including:

- Average assessment score
- Weighted assessment score
- Assessments submitted
- Late submission rate
- Average submission delay
- Total VLE clicks
- Active learning days
- Weeks active
- Average clicks per week
- Engagement consistency
- First-four-week VLE activity
- First-four-week assessment submissions
- Previous attempts
- Studied credits

Checkpoint-specific models allow GradGlow to estimate risk using information available at different stages of a course.

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication

### Machine Learning & Data
- scikit-learn
- pandas
- NumPy
- joblib

### Database
- SQLite

### Development
- Git
- GitHub
- Uvicorn

---

## Project Structure

```text
GradGlow/
├── backend/
│   ├── etl/
│   ├── ml/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── app.py
│   ├── config.py
│   └── database.py
│
├── frontend/
│   └── src/
│
├── models/
├── .env.example
├── .gitignore
└── README.md
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YunishaBasnet/GradGlow.git
cd GradGlow
```

### 2. Create the backend virtual environment

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Replace the placeholder JWT secret in `.env` with a secure random value of at least 32 characters.

For example, generate one with:

```bash
python -c 'import secrets; print(secrets.token_urlsafe(48))'
```

Do **not** commit `.env`.

### 5. Start the backend

From the project root:

```bash
uvicorn backend.app:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health
```

### 6. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Demo Access

GradGlow includes local development/demo workflows for exploring the student and advisor interfaces.

Public demo credentials are **not currently published in this repository**.

Dedicated restricted demo accounts can be configured when running the application locally.

> Administrator credentials and private environment secrets should never be committed to the repository.

---

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate a user |
| `POST` | `/api/uploads/` | Upload educational data |
| `POST` | `/api/uploads/multiple` | Upload multiple datasets |
| `GET` | `/api/predictions/status` | Check prediction readiness |
| `POST` | `/api/predictions/generate` | Generate risk predictions |
| `GET` | `/api/advisor/students` | View advisor student list |
| `GET` | `/api/advisor/students/{student_id}` | View student risk details |
| `GET` | `/api/student/{student_id}/dashboard` | View student dashboard |
| `GET` | `/api/student/{student_id}/requests` | View support requests |
| `POST` | `/api/student/{student_id}/requests` | Create support request |
| `GET` | `/api/student/{student_id}/messages` | View messages |
| `GET` | `/api/student/{student_id}/appointments` | View appointments |
| `GET` | `/api/health` | Backend health check |

---

## Example Risk Prediction

```json
{
  "student_id": "30268",
  "course_key": "AAA-2013J",
  "checkpoint_week": 4,
  "risk_probability": 0.9415,
  "risk_label": "High",
  "top_factors": [
    "No assessments submitted",
    "Low weighted assessment score",
    "Low LMS engagement"
  ],
  "recommended_actions": [
    "Schedule advisor meeting as soon as possible",
    "Encourage student to access weekly learning materials",
    "Recommend academic tutoring or review sessions"
  ],
  "model_source": "AAA/2013J",
  "model_week": "week4"
}
```

---

## Data & Repository Safety

Large or runtime-specific files are intentionally excluded from Git source control, including:

- Raw uploaded datasets
- Generated ETL outputs
- Local SQLite databases
- `.env`
- Python virtual environments
- `node_modules`
- Runtime caches
- Oversized model artifacts

This keeps the repository lightweight and prevents local secrets and runtime data from being published.

---

## Validation

GradGlow has been tested across the core application workflow, including:

- Backend compilation and route imports
- ETL canonical dataset generation
- Assessment feature generation
- VLE engagement feature generation
- Checkpoint-specific ML prediction
- Prediction persistence
- Advisor student listing
- Advisor student detail and risk history
- JWT-protected student endpoints
- Student support requests
- Student messages and appointments
- Prediction readiness endpoint
- Backend health endpoint

---

## Future Improvements

- Cloud deployment
- PostgreSQL production database
- Restricted public demo environment
- Automated model retraining
- Model evaluation dashboard
- Advisor notification system
- Longitudinal risk visualization
- Automated testing
- CI/CD pipeline

---

## Author

**Yunisha Basnet**

GitHub: https://github.com/YunishaBasnet

---

## Disclaimer

GradGlow is an academic decision-support project. Machine learning predictions should be interpreted alongside academic context and professional judgment.

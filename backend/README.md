# Expense Tracker - Backend API

FastAPI backend providing RESTful APIs for user authentication, expense management, and real-time financial analytics with MongoDB Atlas.

---

## 🛠️ Requirements

- Python 3.10+ (Tested on Python 3.13)
- MongoDB Atlas cluster connection URI

---

## 📦 Installation & Local Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   # Or copy manually on Windows:
   copy .env.example .env
   ```

5. Run development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

API docs will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

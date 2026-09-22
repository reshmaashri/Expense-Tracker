# Cloud-Based Expense Tracker
> **A Scalable, Full-Stack Personal Finance & Budget Management System**  
> *Developed as a B.Tech College Mini-Project in Cloud Computing & Modern Web Engineering*

---

## 🌟 Project Overview

**Cloud-Based Expense Tracker** is a production-grade, full-stack cloud application engineered to solve student and personal budgeting challenges. It enables users to record, categorize, filter, and visualize daily expenditures in real time with interactive analytics and automated monthly summaries.

The system is built with a decoupled client-server architecture:
- **Client (Frontend)**: React 19, Vite, Tailwind CSS, React Router, Recharts, and Lucide Icons.
- **Server (Backend)**: Python 3.13, FastAPI (ASGI), PyMongo, Pydantic v2, and JWT Authentication (HS256).
- **Database**: MongoDB Atlas Cloud NoSQL Cluster with dynamic aggregation pipelines.
- **Cloud Readiness**: Pre-configured for deployment on **AWS Elastic Beanstalk** (Backend API) and **AWS S3 / CloudFront** (Frontend Single Page Application).

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER / CLIENT                           │
│  [ React 19 + Vite SPA | Tailwind CSS | Recharts | React Router v7 ]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        HTTPS / JSON REST Calls
                        Authorization: Bearer <JWT>
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND API                              │
│                [ Uvicorn ASGI Server | Port 8000 ]                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Security Middleware (CORS, Request Headers, Exception Handlers)     │
│ • JWT Authentication Subsystem (HS256 Token Issuance & Verification)   │
│ • Password Encryption Engine (bcrypt with cryptographic salt)          │
│ • Business Logic Layer (Expenses CRUD, Ownership Validation)           │
│ • Financial Analytics Aggregation Engine ($match, $group, $sort)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        PyMongo Connection Pool
                        TLS / SSL Encrypted Channel
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      MONGODB ATLAS NO-SQL CLUSTER                      │
│                    Database: `expense_tracker`                         │
├────────────────────────────────────────────────────────────────────────┤
│  Collection: `users`             Collection: `expenses`                │
│  - _id (ObjectId)                - _id (ObjectId)                      │
│  - name (string)                 - user_id (string, indexed)           │
│  - email (string, unique index)  - amount (float > 0)                  │
│  - password_hash (bcrypt string) - category (Enum)                     │
│  - created_at (UTC Timestamp)    - description (string)                │
│                                  - date (YYYY-MM-DD string)            │
│                                  - payment_method (Enum)               │
│                                  - created_at (UTC Timestamp)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. Robust Authentication & User Isolation
- **Secure Registration & Login**: Validates email format, password complexity, and prevents duplicate account creation.
- **Stateless JWT Authorization**: Generates signed JSON Web Tokens (HS256) with configurable TTL (default 24 hours).
- **Zero Credential Leaks**: Never returns `password_hash` in any response.
- **Multi-Tenant Ownership Security**: Every expense operation enforces strict `user_id` filtering. Users cannot access, view, modify, or delete records belonging to other users.

### 2. Real-Time Expense Management
- **Full CRUD Support**: Add, view, edit, and delete transactions with instant UI feedback.
- **8 Standard Expense Categories**: Food, Transport, Education, Shopping, Entertainment, Bills, Health, and Other.
- **6 Payment Modes**: Cash, UPI, Credit Card, Debit Card, Bank Transfer, and Other.
- **Real-time Validation**: Strict server-side and client-side checks ensuring `amount > 0` and non-empty descriptions.
- **Delete Confirmation Modal**: Guard against accidental deletions with contextual warnings.

### 3. Smart Search & Dynamic Filtering
- **Debounced Text Search**: Instant search matching transaction descriptions or category names.
- **Category Filter Dropdown**: Filter transactions by single or all categories.
- **Date Range Picker**: Filter by start date and end date with a single-click "Reset Filters" action.
- **Bidirectional Sorting**: Sort by date (newest/oldest) or monetary amount (highest/lowest).
- **Configurable Pagination**: Page sizes of 10, 25, or 50 items per page.

### 4. Interactive Financial Analytics & Visualizations
- **Summary KPI Cards**: Real-time cards displaying Total Expenses, Current Month Spending, Today's Spending, Total Transaction Count, and Highest Single Expense.
- **Category Distribution (Donut / Pie Chart)**: Recharts visualization depicting proportional expenditure per category with custom hover tooltips and interactive legend pills.
- **Monthly Spending Comparison (Bar Chart)**: Visualizes month-over-month expenditure volume.
- **Expenditure Velocity Trend (Line Chart)**: Chronological trajectory curve tracking spending momentum.
- **Detailed Category Breakdown Table**: Displays category badges, transaction counts, percentage progress bars, average expenditure per transaction, and total category volume.

### 5. Premium Responsive User Experience
- **Responsive Layout**: Fluid desktop grid, tablet breakpoint adaptations, and card-based mobile presentation.
- **State Handling**: Beautiful shimmering skeleton loaders, dedicated empty states for first-time users and empty filter results, and informative error banners with retry triggers.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | High-performance Single Page Application (SPA) |
| **Styling & Design** | Tailwind CSS | Modern responsive utility-first styling |
| **Routing** | React Router v7 | Client-side route management and route guards |
| **Data Visualization** | Recharts | Composable SVG-based chart library |
| **Icons** | Lucide React | Clean, scalable vector interface icons |
| **HTTP Client** | Axios | Request/response interceptors with automatic JWT injection |
| **Backend Framework** | FastAPI (Python 3.13) | High-performance asynchronous REST API |
| **ASGI Server** | Uvicorn | Production-ready asynchronous web server |
| **Data Validation** | Pydantic v2 | Robust schema validation and type enforcement |
| **Security** | PyJWT + bcrypt | Cryptographic password hashing and JWT token handling |
| **Database** | MongoDB Atlas | Cloud NoSQL database with flexible document model |
| **Database Driver** | PyMongo | Native Python driver with connection pooling |

---

## 📡 REST API Documentation

All protected endpoints require the HTTP header:  
`Authorization: Bearer <access_token>`

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT access token |
| `GET` | `/api/auth/me` | Protected | Fetch current logged-in user profile |

### Expenses Endpoints (`/api/expenses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/expenses` | Protected | Create a new expense entry |
| `GET` | `/api/expenses` | Protected | List user expenses with search, filters, sort, and pagination |
| `GET` | `/api/expenses/{id}` | Protected | Retrieve details of a specific expense |
| `PUT` | `/api/expenses/{id}` | Protected | Update an existing expense |
| `DELETE`| `/api/expenses/{id}` | Protected | Delete an expense permanently |

### Analytics Endpoints (`/api/analytics`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/summary` | Protected | Summary metrics (total, current month, today, count, max) |
| `GET` | `/api/analytics/category`| Protected | Category spending distribution, counts, and percentages |
| `GET` | `/api/analytics/monthly` | Protected | Monthly spending trajectory sorted chronologically |

### System Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Health check verifying API & MongoDB connection status |

---

## 💻 Local Installation & Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm** (Tested on Node v24)
- **MongoDB Atlas** account (or local MongoDB instance)

---

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "Expense Tracker"
```

---

### Step 2: Backend Setup
1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   *Example `.env` configuration:*
   ```ini
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=expense-tracker
   DATABASE_NAME=expense_tracker
   JWT_SECRET=your_super_secret_cryptographic_key_here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   PORT=8000
   DEBUG=True
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   *API will be available at:* `http://127.0.0.1:8000`  
   *Interactive Swagger Documentation:* `http://127.0.0.1:8000/docs`

---

### Step 3: Frontend Setup
1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Example `.env` configuration:*
   ```ini
   VITE_API_URL=http://127.0.0.1:8000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
   *Web application will be accessible at:* `http://127.0.0.1:5173`

---

## 🧪 Testing & Verification

The codebase includes automated unit, integration, and end-to-end verification suites:

```bash
# Run Authentication Tests
python backend/tests/test_auth.py

# Run Expense CRUD & Isolation Tests
python backend/tests/test_expenses.py

# Run Analytics Aggregation Tests
python backend/tests/test_analytics.py

# Run Full 19-Step End-to-End System Test
python backend/../scratch/test_e2e_stage9.py

# Run Frontend Linter
cd frontend && npx oxlint
```

---

## 🎓 College Mini-Project Viva Defense Guide

Here are standard questions asked by external examiners during B.Tech project evaluations and how this application addresses them:

### Q1: Why use MongoDB instead of a Relational Database (like MySQL/PostgreSQL)?
> **Answer**: Financial applications with diverse payment types and variable metadata benefit from NoSQL document models. MongoDB allows flexible schema evolution (e.g., adding receipts, split payments, tags). Furthermore, MongoDB's native Aggregation Pipeline (`$match`, `$group`, `$sum`, `$sort`) allows calculating real-time category breakdowns and monthly sums efficiently on indexed collections without expensive multi-table relational joins.

### Q2: How does the application ensure security and prevent unauthorized access?
> **Answer**:
> 1. **Password Encryption**: Uses `bcrypt` with automated salts, ensuring passwords cannot be reversed from database breaches.
> 2. **Stateless JWT Tokens**: Each token is cryptographically signed using `HS256`. Expired or tampered tokens are rejected with HTTP 401.
> 3. **Ownership Filtering**: Every database query explicitly binds `{"user_id": current_user["id"]}`. Even if a user knows another user's expense `_id`, queries return HTTP 404.
> 4. **Input Sanitization**: Pydantic models validate constraints (e.g., `amount > 0`, date format `YYYY-MM-DD`, valid enums).

### Q3: How is this application deployed to the Cloud (AWS)?
> **Answer**:
> 1. **Backend**: Deployed to **AWS Elastic Beanstalk** (Python platform). Uses `Procfile` with `web: uvicorn application:app --host 0.0.0.0 --port 5000` connected to environment variables stored in AWS parameter store.
> 2. **Frontend**: The Vite production bundle (`dist/`) is deployed to an **AWS S3 bucket** configured for Static Website Hosting and accelerated via **AWS CloudFront CDN** for worldwide low-latency caching and SSL termination.
> 3. **Database**: Managed on **MongoDB Atlas** across multi-availability zones.

### Q4: What design patterns are implemented in the React frontend?
> **Answer**:
> 1. **Context API**: Global state for user session and authentication tokens via `AuthContext`.
> 2. **Axios Interceptors**: Request interceptors automatically inject `Authorization: Bearer <token>`; response interceptors catch 401 errors to cleanly log out expired sessions.
> 3. **Route Guards**: `ProtectedRoute` and `PublicRoute` prevent unauthorized viewing and bounce visitors to `/login`.
> 4. **Debounced Search**: Avoids sending HTTP requests on every keystroke by delaying API calls until typing pauses.

---

## 📄 License & Academic Attribution
This project was developed for academic demonstration purposes as part of the B.Tech Degree Curriculum. Released under the **MIT License**.
#   E x p e n s e - T r a c k e r  
 
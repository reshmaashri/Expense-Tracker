# Expense Tracker - Frontend Client

Modern, responsive React web application for personal expense tracking and financial analytics. Built with **Vite**, **Tailwind CSS**, **React Router**, **Axios**, and **Recharts**.

---

## 🛠️ Tech Stack

- **React 18/19** with JavaScript
- **Vite** for fast HMR and optimized production bundling
- **Tailwind CSS** for responsive, utility-first styling
- **React Router** for declarative client-side routing & auth route guarding
- **Axios** with JWT interceptors for API communication
- **Recharts** for interactive financial charts and visualizations
- **Lucide React** for modern UI icons

---

## 🚀 Setup & Local Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   # Or on Windows:
   copy .env.example .env
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production (ready for AWS S3 / CloudFront deployment):
   ```bash
   npm run build
   ```

TASK MANAGER - STARTUP
----------------------

1) Backend
   cd backend
   cp .env.example .env
   # edit .env if needed (MONGO_URI, secrets)
   npm install
   npm run dev
   # backend runs on http://localhost:5001

2) Frontend
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   # frontend runs on http://localhost:5173

Notes:
- The backend uses httpOnly refresh token cookie at /api/auth/refresh
- The frontend axios has an interceptor to POST /auth/refresh on 401

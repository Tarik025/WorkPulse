# Project Camp (backend + frontend, working together)

## Run it
1. MongoDB 5+ running locally (or an Atlas URI).
2. Backend
   ```
   cd backend
   cp .env.example .env     # fill MONGO_URI, secrets and MAILTRAP_* values
   npm install
   npm run dev              # http://localhost:8000
   ```
3. Frontend
   ```
   cd frontend
   npm install
   npm run dev              # http://localhost:5173  (proxies /api and /images to :8000)
   ```
4. Open http://localhost:5173, register (username must be lowercase), open the
   verification mail in Mailtrap, click the link (it opens the frontend), log in.

Read CHANGES.md for every problem found and every change made.

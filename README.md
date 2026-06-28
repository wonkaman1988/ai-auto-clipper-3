# AI Auto-Clipper (fix/launch)

This branch contains a minimal, launch-ready prototype for AI Auto-Clipper.
It provides a static landing page and a simple backend that serves a dashboard-friendly API.

What I added
- Express server (server.js) with optional MongoDB support, /health, and GET /api/clips/:userId
- Mongoose Clip model (models/Clip.js)
- Clips route that returns DB clips when MONGODB_URI is set, otherwise seeded demo clips (routes/clips.js)
- Cron placeholder (cron.js) that creates demo clips when a DB is configured
- .env.example and updated package.json scripts (esbuild build step)

Quick start (local)
1. Install dependencies

   npm install

2. Build the client (this compiles dashboard.jsx -> public/dashboard.js using esbuild)

   npm run build

3. Start the server

   npm start

Development (auto-restarts)

   npm run dev

Notes
- The branch defaults to seeded demo data so you can run and demo the site without any secrets.
- To enable real data, set MONGODB_URI and restart. The cron job will create demo clips in the DB on schedule.
- Do NOT put real secrets into Git. Use environment variables or a secrets manager.

Next steps I recommend (follow-up PRs)
- Wire the production AI clipping worker and job queue (e.g., Bull / Redis) and replace cron placeholder.
- Add user auth (JWT) and signup/login endpoints.
- Add a proper client build and CI/CD pipeline for deployments.

# Project Camp Frontend

React + Vite + Tailwind client for the Project Camp backend API (`/api/v1`).

## Run it

1. Start your backend (note its port).
2. In this folder:

```bash
cp .env.example .env     # set VITE_BACKEND_URL to your backend, e.g. http://localhost:8000
npm install
npm run dev              # http://localhost:5173
```

The Vite dev server proxies `/api` and `/images` to the backend, so the browser
sees one origin: no CORS config needed and cookies work as-is.

## Screens

| Route | Screen |
|---|---|
| `/login`, `/register` | Auth |
| `/verify-email/:token` | Email verification (link from the email) |
| `/forgot-password`, `/reset-password/:token` | Password reset |
| `/` | Dashboard: project list with member count and your role |
| `/settings` | Account info, change password, resend verification |
| `/projects/:id/tasks` | Status board, task create/edit, subtasks, attachments |
| `/projects/:id/members` | List, add by email, change role, remove (Admin) |
| `/projects/:id/notes` | Notes CRUD (Admin writes, everyone reads) |

## Auth

Works with cookie JWTs (`withCredentials`) and also sends a Bearer token saved
from the login response. On a 401 the Axios interceptor calls
`/auth/refresh-token` once, then retries the original request.

## Role-based UI

Your role is read per project from the members list. The UI follows the PRD
permission matrix (e.g. Members can't create tasks, only Admin can edit notes),
but the backend remains the source of truth.

## If something doesn't match your API

All request/response shapes live in `src/api/*.js`, so adjustments are one-file fixes:

- Login/register body fields: `src/pages/auth/*`
- Reset password body (`newPassword`) and change password (`oldPassword`, `newPassword`): `src/pages/auth/ResetPassword.jsx`, `src/pages/Settings.jsx`
- Member role update body (`newRole` + `role` both sent): `src/api/projects.js`
- Task attachment field name (`attachments`): `src/api/tasks.js`

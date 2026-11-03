# What was wrong and what I changed

Verified with an automated end-to-end test (85 API checks: auth, refresh rotation, projects,
members, roles, tasks, attachments, subtasks, notes, cascade delete) and a real-browser test
of the UI (register, verify link, login, reload, project, task, note, members). All pass.

## Why the project did not work together
1. **Backend did not even start.** `validateProjectPermission` had no `return` (Express got
   `undefined` as a handler: "argument handler must be a function") and `mongoose` was not imported.
2. **Task and note routes did not exist** (`task.controllers.js` was empty, no task/note routers
   mounted in `app.js`), so the frontend's Tasks and Notes pages always got 404.
3. **Frontend and backend disagreed** on a few contracts (current-user method, note title,
   lowercase username, verify link target).
4. **Many small controller bugs** (listed below).

## Backend: REQUIRED changes (project would not work without them)
| File | Change |
|---|---|
| `middlewares/auth.middleware.js` | import mongoose; `validateProjectPermission` now returns the middleware |
| `index.js` | `import "dotenv/config"` first. ESM hoists imports, so `dotenv.config()` ran after `app.js` was loaded and env vars were undefined where used |
| `models/task.models.js` | `Task` model was not exported |
| `controllers/auth.controllers.js` | missing `crypto` import (verify/reset crashed); `fullName` was ignored on register; verification and reset links pointed to the API (`/api/v1/users/verify-email/..`, the "Cannot GET" you saw) and now point to the frontend `/verify-email/:token`; invalid status code `489` -> `400` |
| `controllers/project.controllers.js` | `getProjects` `$lookup` used wrong fields (dashboard data was wrong); `addMembersToProject` now upserts instead of failing or duplicating; `getProjectMembers` used the wrong query |
| `controllers/task.controllers.js` (new) | tasks, attachments (Multer), subtasks |
| `controllers/note.controllers.js` (new) | notes CRUD |
| `routes/task.routes.js`, `routes/note.routes.js` (new), `app.js` | routes per PRD, mounted at `/api/v1/tasks` and `/api/v1/notes` |
| `validators/index.js` | task, subtask and note validators |
| `app.js` | JSON error handler (Express returned HTML errors the frontend could not read): bad ids -> 400, duplicates -> 409, validation -> 400, Multer "file too large" -> 400; CORS default typo fixed |
| `routes/project.routes.js` | `GET /:projectId/members` allowed for every role (was admin-only, so members could not see the team) |

## Backend: small quality / security changes (optional but recommended)
- Task, subtask and note lookups are scoped to the `projectId` in the URL (otherwise a member of project A could read or delete project B's task by id: IDOR).
- Assignee must be a member of the project.
- Members can only tick a subtask complete; renaming needs admin or project_admin.
- Deleting a project also deletes its tasks, subtasks, notes and memberships.
- Attachment URL uses the stored file name (Multer prefixes a timestamp; the old code used `originalname`, so links were 404).
- Refresh token has a unique `jti`, so rotation really invalidates the old token even when issued in the same second.
- Added `.env.example`.

## Frontend changes
- `api/auth.js`: `current-user` is `POST` (backend route is POST); before, every page reload logged you out.
- `Register.jsx`: sends lowercase trimmed username (backend validator rejects uppercase) and labels the field.
- `Notes.jsx`: removed the note `title` field (the Note model only has `content`).
- `api/tasks.js`: empty `assignedTo` is sent on update so "Unassigned" works.
- `api/axios.js`: `errMsg` shows the first real validation message from 422 responses.

## Env you must set (backend/.env)
See `backend/.env.example`. Important: `FRONTEND_URL=http://localhost:5173`, `MONGO_URI`,
`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `MAILTRAP_SMTP_*`.

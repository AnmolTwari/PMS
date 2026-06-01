# ParkSy PMS

ParkSy PMS is a corporate-style parking management platform for schools, malls, and enterprise sites. It combines a React/Vite frontend, an Express API, MongoDB models, and Socket.io updates into one local demo experience.

## Highlights

- Modern public website with a professional landing page
- Separate admin and user dashboards
- Real-time parking updates and notifications
- Vehicle management, slot booking, releases, and reservations
- Guard tools, visitor passes, blocked vehicles, reports, and analytics
- Local demo database powered by `mongodb-memory-server`

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** MongoDB models with in-memory demo storage
- **Realtime:** Socket.io
- **Auth:** Cookie-based JWT

## Quick Start

```powershell
npm install
npm start
```

`npm start` builds the frontend and starts the backend on `http://localhost:3000`.

If port `3000` is already in use, stop the old Node process and run `npm start` again.

## Demo Login

The app seeds an initial admin account on startup.

```text
Email: admin@company.com
Username: superadmin
Password: SecurePass123!
```

The login form accepts email, mobile number, employee ID, username, or name.

## Available Roles

- `superAdmin`
- `admin`
- `securityGuard`
- `employee`
- `student`
- `visitor`

## What You Can Test

- **Public website:** landing page, login, registration, forgot/reset password
- **User portal:** profile, vehicle management, parking booking, releases, upcoming reservations
- **Admin portal:** dashboard, branches, analytics, reports, settings, users, notifications
- **Security tools:** check-in, check-out, visitor passes, blocked vehicle checks

## Project Structure

```text
backend/
  server.js               Express entry point
  src/config              Database bootstrap
  src/controllers         Request handlers
  src/middleware          Auth and maintenance middleware
  src/models              MongoDB schemas
  src/routes              API routes
  src/services            Startup, realtime, notifications, seed data
  src/utils               Shared helpers
client/
  src/App.jsx             Frontend router and app shell
  src/components          Shared UI pieces
  src/context             Auth context
  src/pages               Public pages and dashboards
  src/styles.css          Global corporate UI styling
```

## Scripts

```powershell
npm run build   # Build the frontend with Vite
npm start       # Build and launch the full app
```

## Notes

- This project uses a temporary in-memory MongoDB instance for demo mode, so data resets when the server restarts.
- The repo has been modernized away from the older EJS/public-page structure.
- Realtime updates and notifications are handled through Socket.io.

## GitHub Upload

Before pushing to GitHub, make sure you only commit source files and documentation.

Recommended flow:

```powershell
git status
git add README.md client backend package.json package-lock.json .gitignore
git add -u
git commit -m "Modernize ParkSy UI and documentation"
git push origin main
```

If you want to remove old tracked files from the GitHub repo, keep the deletions staged and push them together with the update.
# ParkSy PMS

ParkSy PMS is a polished parking-management demo application designed for schools, malls, and enterprise sites. It pairs a modern React + Vite single-page frontend with an Express API backend, Mongoose models, and Socket.io for realtime updates. A built-in demo database (mongodb-memory-server) makes it easy to run locally without external services.

## Quick Start (Local)

1. Install dependencies:

```powershell
npm install
```

2. Start the app (builds the frontend and launches the backend):

```powershell
npm start
```

3. Open the app in your browser:

```
http://localhost:3000
```

Available npm scripts:

```powershell
npm run build    # Build the frontend (Vite)
npm start        # Build and run the full app
npm run stop     # Stop local node/mongod processes (Windows PowerShell)
```

Notes:
- The demo seeds an initial admin user at first startup.
- The in-memory MongoDB resets on server restart — this is intentional for demo mode.

## Demo Credentials

The app seeds a default admin on startup. Use the seeded credentials to sign in and explore admin features.

Example (may differ in your seed):

```
Email: admin@company.com
Username: superadmin
Password: SecurePass123!
```

The login accepts email, username, employee ID or mobile number depending on the seeded data.

## Project Structure

```
backend/                # Express server and API
  server.js
  src/
    config/             # DB & app config
    controllers/        # Route handlers
    middleware/         # Auth, maintenance
    models/             # Mongoose schemas
    routes/             # API routes
    services/           # realtime, seed, notification helpers

client/                 # Vite + React SPA
  src/
    App.jsx
    main.jsx
    components/
    pages/
    styles.css          # global design tokens + component surfaces
```

## Common Tasks & Troubleshooting

- If port `3000` is in use, stop the running Node process. On Windows you can run:

```powershell
npm run stop
# or run directly:
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

- When pulling changes on Windows you may see file-lock errors for cached native binaries (examples: `mongodb-memory-server` cache, `bcrypt` prebuilds). Close running node processes and retry, or remove the cache folder:

```powershell
Remove-Item -Recurse -Force node_modules\.cache
```

- To rebuild the frontend only:

```powershell
npm run build
```

## Notifications & UI

- The header notification bell renders a floating `.notification-panel` whose styling lives in `client/src/styles.css`. If the panel appears off-screen in your layout you can tweak the panel positioning in that file (search for `.notification-panel`). For robust anchoring, the component is `client/src/components/NotificationBell.jsx`.

## Publishing & GitHub

- There is a `v1.0.0` tag in this repository representing the modernized UI and backend. To push changes:

```powershell
git add -A
git commit -m "Your message"
git push origin main
```

- If you removed legacy files locally, make sure deletions are staged before pushing so they are removed on GitHub as well.

## Contributing

If you want changes (styling tweaks, accessibility improvements, or test coverage), open an issue or create a branch and a PR. I can help prepare a clean PR and changelog entry.

---
If you'd like, I can: update this README with a short changelog entry, draft a GitHub Release body for `v1.0.0`, or open a PR with the README changes. Tell me which one to do next.
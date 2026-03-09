# Timeforge

A lightweight work hours tracker PWA built with React and Vite. Track your daily check-ins and check-outs, review your history, and edit past sessions — all stored locally in your browser.

## Features

- **Check in / Check out** — One-tap time tracking for the current day
- **Live timer** — Real-time display of elapsed time for the active session
- **Today's summary** — Aggregated hours for all sessions in the current day
- **History list** — Chronological log of past working days with total hours
- **Calendar view** — Monthly overview of logged days
- **Day edit modal** — Edit or delete individual sessions for any past day
- **Offline-first PWA** — Installable on any device, works without internet
- **Local storage** — No backend, no account — data stays on your device

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Data Storage

All session data is persisted in `localStorage` under the key `timeforge`. No data is sent to any server.

## License

See [LICENSE](./LICENSE).
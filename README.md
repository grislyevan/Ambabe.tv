# Ambabe.tv

Local karaoke queue app: one queue, singer sign-up, host reorder and remove. Runs on macOS Big Sur+ with no external hosting.

## Requirements

- **Node.js** 14+ (Big Sur: install from [nodejs.org](https://nodejs.org) LTS or via Homebrew: `brew install node`)
- No `npm install` needed — the app uses only Node built-ins.

## Single-click run (e.g. on a Big Sur laptop)

**Option A — Copy the folder and double-click**

1. Copy the whole `ambabe-tv` folder to your laptop.
2. Double-click **Ambabe Karaoke.command** (in that folder). Terminal will open and the server starts; your browser will open to the singer page. To stop, close the Terminal window or press Ctrl+C.

**Option B — Build an app, then copy**

1. On a Mac (this one or the laptop), run once: `node build-app.js`
2. Copy the created **Ambabe Karaoke.app** to the laptop (e.g. into Applications).
3. Double-click **Ambabe Karaoke.app**. The server starts and your browser opens; no Terminal window. Quit the app from the Dock (or Activity Monitor) to stop the server.

**Requirement:** Node.js 14+ must be installed on the laptop ([nodejs.org](https://nodejs.org)). If it’s missing, the launcher will show an alert.

## Run from Terminal

```bash
cd ambabe-tv
node server.js
```

Then open:

- **Singers:** http://localhost:3847/
- **Host:** http://localhost:3847/host
- **QR code:** http://localhost:3847/qr

To use a different port:

```bash
PORT=3000 node server.js
```

## Other devices & QR code

To let phones/tablets on the same Wi‑Fi join the queue, use your Mac’s local hostname so the URL stays the same across DHCP:

1. **Set the Mac’s local name** to `ambabe-tv`: **System Settings → General → Sharing** — set **Local Hostname** to `ambabe-tv` (or use **Computer Name**; the hostname is derived from it). Alternatively in Terminal: `sudo scutil --set LocalHostName ambabe-tv`
2. On other devices, open **http://ambabe-tv.local:3847/** (singers) or **http://ambabe-tv.local:3847/host** (host).
3. Open **http://ambabe-tv.local:3847/qr** (or use the “QR code” link on the host page) to show a QR code that points to **http://ambabe-tv.local:3847/** — scan it to open the singer page.

## Features

- **Single queue** — one event, one list.
- **Singers** — Enter name once; it’s added in order. No editing after submit.
- **Host** — Reorder (up/down) and remove no-shows. Queue persists in `queue.json` across restarts.

## Layout

- `server.js` — HTTP server, `/api/queue` (GET, POST, PATCH reorder, DELETE), static files.
- `public/` — `index.html` (singer), `host.html` (host), `qr.html` (QR code), `styles.css`, `app.js`, `host.js`.
- `queue.json` — Created automatically; holds the queue when the server restarts.

## Deploy as a website (Render)

To run Ambabe.tv on the internet so anyone can open it from any network, see **[DEPLOY-RENDER.md](DEPLOY-RENDER.md)** for a step-by-step Render setup (free tier).

## Later: other public hosting

The app is a normal Node HTTP server. To host it elsewhere:

1. Deploy `server.js` and `public/` to a Node host (e.g. Railway, Render, Fly.io, or a VPS).
2. Set `PORT` to the host’s port.
3. Optionally add auth for `/host` and HTTPS; the existing API and pages can stay as-is.
# Ambabe.tv
# Ambabe.tv

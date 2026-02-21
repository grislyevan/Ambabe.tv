# Deploy Ambabe Karaoke to Render

Follow these steps to run Ambabe.tv as a free website on Render. You’ll get a URL like `https://ambabe-tv-xxxx.onrender.com` that works from any device or network.

---

## 1. Put the app in GitHub

Render deploys from a Git repo. If the app isn’t in GitHub yet:

1. **Create a new repo** on [github.com](https://github.com) (e.g. `ambabe-tv`). Don’t add a README or .gitignore yet if the project already has them.

2. **On your Mac**, open Terminal and go to the project folder:
   ```bash
   cd path/to/ambabe-tv
   ```

3. **Initialize Git and push** (if you haven’t already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ambabe-tv.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `ambabe-tv` with your GitHub username and repo name.

If the folder is inside a larger repo (e.g. “Cursor”), either push that whole repo or create a new repo that contains only the `ambabe-tv` folder and push that.

---

## 2. Sign up and connect Render to GitHub

1. Go to **[render.com](https://render.com)** and sign up (e.g. “Get started for free”).
2. Log in with **GitHub** so Render can see your repos.
3. In the Render dashboard, click **New +** → **Web Service**.

---

## 3. Connect the repo

1. Under **Connect a repository**, find and select your **ambabe-tv** repo (or the repo that contains it).
2. If the repo has more than one folder and the app is in a subfolder (e.g. `ambabe-tv`), set **Root Directory** to that folder (e.g. `ambabe-tv`). If the repo root *is* the app (only `server.js`, `public/`, `package.json` at the top level), leave Root Directory blank.
3. Click **Connect** or **Continue**.

---

## 4. Configure the Web Service

Use these settings (leave anything not listed as default):

| Field | Value |
|--------|--------|
| **Name** | `ambabe-tv` (or any name; it becomes part of the URL) |
| **Region** | Pick one close to you |
| **Runtime** | **Node** |
| **Build Command** | Leave blank (or `npm install` — Render often runs this by default) |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

Under **Environment** (optional but recommended):

- **Key:** `AMBABE_HOST_PASSWORD`  
- **Value:** a password you choose for the host page (e.g. something other than `4321` for production).

Render sets `PORT` for you; the app already uses `process.env.PORT`.

---

## 5. Deploy

1. Click **Create Web Service**.
2. Render will clone the repo, run the build/start, and deploy. The first deploy can take a few minutes.
3. When it’s done, you’ll see a URL like **https://ambabe-tv-xxxx.onrender.com**. That’s your live site.

---

## 6. Use the site

- **Singers:** `https://your-app-name.onrender.com/`
- **Host:** `https://your-app-name.onrender.com/host` (use the password you set, or `4321` if you didn’t set `AMBABE_HOST_PASSWORD`)
- **QR code:** `https://your-app-name.onrender.com/qr` — the QR code and URL on that page now use your Render URL automatically, so you can share or print it for singers.

---

## Notes

- **Free tier:** The app may **sleep** after about 15 minutes with no traffic. The first request after that can take 30–60 seconds to respond; then it’s fast again. For events, open the host or singer page a minute before you need it.
- **Queue:** On the free tier, the queue is stored in the app’s filesystem. It can be reset on a new deploy or if the service restarts. Fine for a single event; for long-term persistence you’d add a database later.
- **HTTPS:** Render gives you HTTPS by default; no extra setup.

If something fails at deploy time, check the **Logs** tab for that service on Render; the error message there usually points to the problem (e.g. wrong Root Directory or Start Command).

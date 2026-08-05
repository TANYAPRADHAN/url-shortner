# ⚡ Snip.ly — URL Shortener

An ultra-fast, modern full-stack URL Shortener featuring a sleek **Glassmorphism UI**, **6-character unique short codes**, **URL deduplication**, **live visitor tracking**, and **301 redirect engine**.

Supports **MongoDB Atlas** for cloud deployment (with automatic fallback to local SQLite for zero-config offline development).

---

## ✨ Features

- 🔗 **6-Character Short Codes**: Generated using `nanoid` (~56 billion unique combinations).
- 🔄 **Automatic URL Deduplication**: Re-submitting an existing URL returns the existing short link instead of creating duplicates.
- 🍃 **MongoDB Atlas Support**: Production-ready cloud database support with Mongoose.
- 🚀 **Instant 301 Redirects**: Fast redirection to the original long URL with click counting.
- 🎨 **Glassmorphism UI**: Beautiful dark theme design with animated glowing background orbs, smooth micro-interactions, and toast notifications.
- 📋 **One-Click Clipboard Copy**: Instantly copy shortened links with a single click.
- 💾 **Recent Links History**: Persisted in `localStorage` so users can access their recently generated links across browser sessions.
- 👁️ **Live Visitor Counter**: Real-time total visitor counter backed by database.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile screens.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (via `mongoose`) with automatic SQLite fallback |
| **Short Code Generator** | `nanoid` (v3) |
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism), Vanilla JavaScript |
| **Deployment** | Vercel Serverless Ready (`vercel.json` included) |

---

## 🍃 Setting Up MongoDB Atlas (Free Cloud Database)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user (e.g. username and password).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere, required for Vercel serverless).
5. Click **Connect** -> **Drivers** and copy your **Connection String**:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/urlshortener?retryWrites=true&w=majority
   ```
6. Add `MONGODB_URI` to your Vercel Environment Variables or local `.env` file.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
PORT=3000
BASE_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster.mongodb.net/urlshortener
```
*(If `MONGODB_URI` is omitted, the app automatically falls back to local SQLite).*

### 3. Run the Development Server
```bash
npm run dev
```

Open your browser and visit: **`http://localhost:3000`**

---

## 🔌 API Documentation

### 1. Shorten a URL
- **Endpoint**: `POST /api/shorten`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "url": "https://www.example.com/very/long/url/path"
  }
  ```
- **Response (201 Created / 200 OK)**:
  ```json
  {
    "shortUrl": "http://localhost:3000/xwQwI6",
    "shortCode": "xwQwI6",
    "originalUrl": "https://www.example.com/very/long/url/path",
    "createdAt": "2026-08-05T16:34:00.000Z",
    "deduplicated": false
  }
  ```

### 2. Redirect to Original URL
- **Endpoint**: `GET /:code` (e.g. `http://localhost:3000/xwQwI6`)
- **Response**: `301 Moved Permanently` to `original_url` (or renders `404.html` if invalid).

### 3. Fetch Link Stats
- **Endpoint**: `GET /api/stats/:code`
- **Response (200 OK)**:
  ```json
  {
    "shortCode": "xwQwI6",
    "originalUrl": "https://www.example.com/very/long/url/path",
    "clickCount": 12,
    "createdAt": "2026-08-05T16:34:00.000Z"
  }
  ```

---

## ☁️ Deploying to Vercel with MongoDB

1. Push your repository to GitHub.
2. Import your repo in [Vercel Dashboard](https://vercel.com).
3. In **Environment Variables**, set:
   - `BASE_URL`: `https://your-app-name.vercel.app`
   - `MONGODB_URI`: `mongodb+srv://user:pass@cluster.mongodb.net/urlshortener`
4. Click **Deploy**.

---

## 📜 License & Credits

© 2026 **Snip.ly**. All rights reserved.

Made with ♥ by **Tanya Pradhan**

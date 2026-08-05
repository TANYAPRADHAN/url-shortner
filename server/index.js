require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Routes ─────────────────────────────────────────────────────────────────
const shortenRouter = require('./routes/shorten');
const redirectRouter = require('./routes/redirect');

// API routes (must be before redirect to avoid shadowing)
app.use('/api', shortenRouter);
app.use('/api', redirectRouter); // stats endpoint lives here too

// Redirect route (catch-all short codes)
app.use('/', redirectRouter);

// Ensure DB is initialized before handling requests
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
      return res.status(500).json({ error: 'Database failed to initialize' });
    }
  }
  next();
});

// Start local server if not running as a Vercel serverless function
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀  URL Shortener running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;

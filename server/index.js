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

const os = require('os');

// Helper to get local network IP address
function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Start server if not running as a Vercel serverless function
if (require.main === module) {
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    const netIp = getNetworkIp();
    console.log(`\n🚀  URL Shortener Live Server Running!`);
    console.log(`  ➜ Local:   http://localhost:${PORT}`);
    console.log(`  ➜ Network: http://${netIp}:${PORT}\n`);
  });
}

module.exports = app;

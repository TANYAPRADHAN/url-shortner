const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const initSqlJs = require('sql.js');

let isMongo = false;

// ─── Mongoose Schemas (MongoDB) ──────────────────────────────────────────────
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_code: { type: String, required: true, unique: true, index: true },
  click_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const visitorSchema = new mongoose.Schema({
  counter_id: { type: String, default: 'main', unique: true },
  count: { type: Number, default: 0 }
});

let UrlModel;
let VisitorModel;

// ─── SQLite Fallback Setup ───────────────────────────────────────────────────
let sqliteDb;
const dbDir = process.env.VERCEL || process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : path.join(__dirname, '..', 'database');
const dbPath = path.join(dbDir, 'urls.db');

function persistSqlite() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

// ─── Database Initialization ─────────────────────────────────────────────────
async function initDb() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    // Connect to MongoDB Atlas / Cloud DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        bufferCommands: false,
      });
      console.log('🍃 Connected to MongoDB Atlas');
    }
    UrlModel = mongoose.models.Url || mongoose.model('Url', urlSchema);
    VisitorModel = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);
    isMongo = true;
    return;
  }

  // Fallback to SQLite if MONGODB_URI is not set
  if (sqliteDb) return sqliteDb;

  if (!fs.existsSync(dbDir) && dbDir !== '/tmp') {
    try { fs.mkdirSync(dbDir, { recursive: true }); } catch { }
  }

  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT NOT NULL,
      short_code  TEXT NOT NULL UNIQUE,
      created_at  DATETIME DEFAULT (datetime('now')),
      click_count INTEGER DEFAULT 0
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      id    INTEGER PRIMARY KEY,
      count INTEGER DEFAULT 0
    )
  `);

  sqliteDb.run(`INSERT OR IGNORE INTO visitors (id, count) VALUES (1, 0)`);
  persistSqlite();
  console.log('📁 Connected to SQLite database');
  return sqliteDb;
}

// Ensure DB initialized before operations
async function ensureDb() {
  if (!isMongo && !sqliteDb) {
    await initDb();
  }
}

// ─── Database Operations (Support both MongoDB & SQLite) ──────────────────────

async function findByCode(code) {
  await ensureDb();
  if (isMongo) {
    const doc = await UrlModel.findOne({ short_code: code }).lean();
    if (!doc) return null;
    return {
      short_code: doc.short_code,
      original_url: doc.original_url,
      click_count: doc.click_count,
      created_at: doc.created_at
    };
  } else {
    const stmt = sqliteDb.prepare('SELECT * FROM urls WHERE short_code = ?');
    stmt.bind([code]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

async function findByUrl(url) {
  await ensureDb();
  if (isMongo) {
    const doc = await UrlModel.findOne({ original_url: url }).lean();
    if (!doc) return null;
    return {
      short_code: doc.short_code,
      original_url: doc.original_url,
      click_count: doc.click_count,
      created_at: doc.created_at
    };
  } else {
    const stmt = sqliteDb.prepare('SELECT * FROM urls WHERE original_url = ?');
    stmt.bind([url]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

async function insertUrl(originalUrl, shortCode) {
  await ensureDb();
  if (isMongo) {
    await UrlModel.create({
      original_url: originalUrl,
      short_code: shortCode,
    });
  } else {
    sqliteDb.run('INSERT INTO urls (original_url, short_code) VALUES (?, ?)', [originalUrl, shortCode]);
    persistSqlite();
  }
}

async function incrementClicks(code) {
  await ensureDb();
  if (isMongo) {
    await UrlModel.updateOne({ short_code: code }, { $inc: { click_count: 1 } });
  } else {
    sqliteDb.run('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?', [code]);
    persistSqlite();
  }
}

async function getVisitorCount() {
  await ensureDb();
  if (isMongo) {
    const doc = await VisitorModel.findOne({ counter_id: 'main' }).lean();
    return doc ? doc.count : 0;
  } else {
    const stmt = sqliteDb.prepare('SELECT count FROM visitors WHERE id = 1');
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.count || 0;
    }
    stmt.free();
    return 0;
  }
}

async function incrementVisitors() {
  await ensureDb();
  if (isMongo) {
    const doc = await VisitorModel.findOneAndUpdate(
      { counter_id: 'main' },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    return doc ? doc.count : 1;
  } else {
    sqliteDb.run('UPDATE visitors SET count = count + 1 WHERE id = 1');
    persistSqlite();
    return getVisitorCount();
  }
}

module.exports = {
  initDb,
  findByCode,
  findByUrl,
  insertUrl,
  incrementClicks,
  getVisitorCount,
  incrementVisitors
};

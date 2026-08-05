const express = require('express');
const router = express.Router();
const { findByUrl, insertUrl, getVisitorCount, incrementVisitors } = require('../db');
const { generateUniqueCode } = require('../utils/generateCode');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Validate that a string is a well-formed http/https URL.
 */
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * POST /api/shorten
 * Body: { "url": "https://example.com/..." }
 * Returns: { shortUrl, shortCode, originalUrl, createdAt }
 */
router.post('/shorten', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'A URL is required.' });
  }

  const trimmed = url.trim();

  if (!isValidUrl(trimmed)) {
    return res.status(400).json({ error: 'Please provide a valid http or https URL.' });
  }

  try {
    // Deduplication: return existing short code if URL already stored
    const existing = await findByUrl(trimmed);
    if (existing) {
      return res.status(200).json({
        shortUrl: `${BASE_URL}/${existing.short_code}`,
        shortCode: existing.short_code,
        originalUrl: existing.original_url,
        createdAt: existing.created_at,
        deduplicated: true,
      });
    }

    // Generate unique code and insert
    const code = await generateUniqueCode();
    await insertUrl(trimmed, code);

    return res.status(201).json({
      shortUrl: `${BASE_URL}/${code}`,
      shortCode: code,
      originalUrl: trimmed,
      createdAt: new Date().toISOString(),
      deduplicated: false,
    });
  } catch (err) {
    console.error('Error creating short URL:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

/**
 * GET /api/visit
 * Called by the frontend on each page load to increment visitor count.
 */
router.get('/visit', async (req, res) => {
  try {
    await incrementVisitors();
    const count = await getVisitorCount();
    return res.status(200).json({ visitors: count });
  } catch (err) {
    console.error('Error handling visitor count:', err);
    return res.status(200).json({ visitors: 0 });
  }
});

/**
 * GET /api/visitors
 * Returns current visitor count without incrementing.
 */
router.get('/visitors', async (req, res) => {
  try {
    const count = await getVisitorCount();
    return res.status(200).json({ visitors: count });
  } catch (err) {
    return res.status(200).json({ visitors: 0 });
  }
});

module.exports = router;

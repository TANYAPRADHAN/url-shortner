const express = require('express');
const router = express.Router();
const { findByCode, incrementClicks } = require('../db');

/**
 * GET /api/stats/:code
 * Returns metadata for a short link (click count, original URL, creation date).
 */
router.get('/stats/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const record = await findByCode(code);
    if (!record) {
      return res.status(404).json({ error: `No URL found for code: ${code}` });
    }
    return res.status(200).json({
      shortCode: record.short_code,
      originalUrl: record.original_url,
      clickCount: record.click_count,
      createdAt: record.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /:code
 * Redirects to the original URL associated with the short code.
 * Must be the LAST route registered to avoid shadowing API routes.
 */
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const record = await findByCode(code);
    if (!record) {
      return res.status(404).sendFile('404.html', {
        root: require('path').join(__dirname, '..', '..', 'public'),
      });
    }
    await incrementClicks(code);
    return res.redirect(301, record.original_url);
  } catch (err) {
    return res.status(500).sendFile('404.html', {
      root: require('path').join(__dirname, '..', '..', 'public'),
    });
  }
});

module.exports = router;

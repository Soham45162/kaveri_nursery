import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// GET /api/settings/billing
router.get('/billing', async (req, res) => {
  try {
    const result = await query(`
      SELECT key, value, (letterhead_data IS NOT NULL) AS has_custom_letterhead
      FROM app_settings
      WHERE key = 'billing'
    `);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let settings = { letterheadType: 'digital', customLetterheadUrl: '' };

    if (result.rows.length > 0) {
      settings = result.rows[0].value || settings;
      if (result.rows[0].has_custom_letterhead) {
        settings.customLetterheadUrl = `${baseUrl}/api/settings/billing/letterhead`;
      }
    }

    res.json(settings);
  } catch (err) {
    console.error('Error fetching billing settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/settings/billing/letterhead - Stream binary banner
router.get('/billing/letterhead', async (req, res) => {
  try {
    const result = await query(`
      SELECT letterhead_data, letterhead_mime_type
      FROM app_settings
      WHERE key = 'billing'
    `);

    if (result.rows.length === 0 || !result.rows[0].letterhead_data) {
      return res.status(404).send('No custom letterhead image uploaded.');
    }

    res.setHeader('Content-Type', result.rows[0].letterhead_mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(result.rows[0].letterhead_data);
  } catch (err) {
    console.error('Error streaming letterhead banner:', err);
    res.status(500).json({ error: 'Failed to load letterhead' });
  }
});

// PUT /api/settings/billing - Update billing letterhead preferences
router.put('/billing', authenticateToken, requireAdmin, upload.single('letterheadFile'), async (req, res) => {
  try {
    const { letterheadType } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (req.file) {
      await query(`
        INSERT INTO app_settings (key, value, letterhead_data, letterhead_mime_type)
        VALUES (
          'billing',
          $1::jsonb,
          $2,
          $3
        )
        ON CONFLICT (key)
        DO UPDATE SET
          value = $1::jsonb,
          letterhead_data = $2,
          letterhead_mime_type = $3,
          updated_at = NOW()
      `, [
        JSON.stringify({ letterheadType: letterheadType || 'custom', customLetterheadUrl: `${baseUrl}/api/settings/billing/letterhead` }),
        req.file.buffer,
        req.file.mimetype
      ]);
    } else {
      await query(`
        INSERT INTO app_settings (key, value)
        VALUES ('billing', $1::jsonb)
        ON CONFLICT (key)
        DO UPDATE SET
          value = app_settings.value || $1::jsonb,
          updated_at = NOW()
      `, [JSON.stringify({ letterheadType: letterheadType || 'digital' })]);
    }

    const updated = await query(`
      SELECT key, value, (letterhead_data IS NOT NULL) AS has_custom_letterhead
      FROM app_settings WHERE key = 'billing'
    `);

    const finalSettings = updated.rows[0].value || {};
    if (updated.rows[0].has_custom_letterhead) {
      finalSettings.customLetterheadUrl = `${baseUrl}/api/settings/billing/letterhead`;
    }

    res.json(finalSettings);
  } catch (err) {
    console.error('Error updating billing settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

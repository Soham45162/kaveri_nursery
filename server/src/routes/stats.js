import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// GET /api/stats/visitors
router.get('/visitors', async (req, res) => {
  try {
    const result = await query(`SELECT value FROM site_stats WHERE key = 'visitors'`);
    const count = result.rows.length > 0 ? Number(result.rows[0].value) : 0;
    res.json({ count });
  } catch (err) {
    console.error('Error fetching visitor stats:', err);
    res.status(500).json({ error: 'Failed to fetch visitor stats' });
  }
});

// POST /api/stats/visitors/increment
router.post('/visitors/increment', async (req, res) => {
  try {
    const result = await query(`
      INSERT INTO site_stats (key, value)
      VALUES ('visitors', 1)
      ON CONFLICT (key)
      DO UPDATE SET value = site_stats.value + 1, updated_at = NOW()
      RETURNING value
    `);
    res.json({ count: Number(result.rows[0].value) });
  } catch (err) {
    console.error('Error incrementing visitor count:', err);
    res.status(500).json({ error: 'Failed to increment visitors' });
  }
});

export default router;

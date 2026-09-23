import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function formatReview(row, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    rating: row.rating,
    text: row.text,
    approved: row.approved,
    photo: row.has_avatar ? `${baseUrl}/api/reviews/${row.id}/avatar` : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    plantPhoto: row.has_plant_photo ? `${baseUrl}/api/reviews/${row.id}/plant-photo` : 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80',
    createdAt: row.created_at
  };
}

// GET /api/reviews - Get all reviews (or filter approved)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, rating, text, approved, created_at,
        (avatar_data IS NOT NULL) AS has_avatar,
        (plant_photo_data IS NOT NULL) AS has_plant_photo
      FROM reviews
      ORDER BY created_at DESC
    `);
    res.json(result.rows.map(r => formatReview(r, req)));
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/admin - Get all reviews including pending (admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, rating, text, approved, created_at,
        (avatar_data IS NOT NULL) AS has_avatar,
        (plant_photo_data IS NOT NULL) AS has_plant_photo
      FROM reviews
      ORDER BY created_at DESC
    `);
    res.json(result.rows.map(r => formatReview(r, req)));
  } catch (err) {
    console.error('Error fetching admin reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/:id/plant-photo - Stream plant review photo BYTEA
router.get('/:id/plant-photo', async (req, res) => {
  try {
    const result = await query(`
      SELECT plant_photo_data, plant_photo_mime_type
      FROM reviews WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0 || !result.rows[0].plant_photo_data) {
      return res.redirect('https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80');
    }

    res.setHeader('Content-Type', result.rows[0].plant_photo_mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(result.rows[0].plant_photo_data);
  } catch (err) {
    console.error('Error streaming review photo:', err);
    res.status(500).json({ error: 'Failed to stream review photo' });
  }
});

// POST /api/reviews - Submit review (public)
router.post('/', upload.single('plantPhoto'), async (req, res) => {
  try {
    const { name, rating } = req.body;
    const reviewText = req.body.text || req.body.review;
    if (!name || !reviewText) {
      return res.status(400).json({ error: 'Name and review text are required' });
    }

    const plantPhotoData = req.file ? req.file.buffer : null;
    const plantPhotoMime = req.file ? req.file.mimetype : null;

    const result = await query(`
      INSERT INTO reviews (name, rating, text, plant_photo_data, plant_photo_mime_type, approved)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING *, (plant_photo_data IS NOT NULL) AS has_plant_photo, (avatar_data IS NOT NULL) AS has_avatar
    `, [name, parseInt(rating, 10) || 5, reviewText, plantPhotoData, plantPhotoMime]);

    res.status(201).json(formatReview(result.rows[0], req));
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// PUT /api/reviews/:id/approve - Approve review (admin only)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('UPDATE reviews SET approved = TRUE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Review approved' });
  } catch (err) {
    console.error('Error approving review:', err);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

// DELETE /api/reviews/:id - Delete review (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;

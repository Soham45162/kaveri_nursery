import { query, toApiRecord, toApiRecords } from '../config/db.js';

const reviewSelect = `
  r.id, r.name, r.email, r.rating, r.text, r.plant_id, r.photos, r.approved,
  r.created_at, r.updated_at,
  CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('id', p.id, '_id', p.id, 'name', p.name, 'image', p.image) END AS plant
`;

export async function getApprovedReviews(req, res) {
  const result = await query(`
    SELECT ${reviewSelect}
    FROM reviews r
    LEFT JOIN plants p ON p.id = r.plant_id
    WHERE r.approved = TRUE
    ORDER BY r.created_at DESC
  `);
  res.json(toApiRecords(result.rows));
}

export async function getAllReviews(req, res) {
  const result = await query(`
    SELECT ${reviewSelect}
    FROM reviews r
    LEFT JOIN plants p ON p.id = r.plant_id
    ORDER BY r.created_at DESC
  `);
  res.json(toApiRecords(result.rows));
}

export async function createReview(req, res) {
  const photos = req.files?.map((file) => `/uploads/${file.filename}`) || [];
  const result = await query(
    `INSERT INTO reviews (name, email, rating, text, plant_id, photos, approved)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)
     RETURNING id, name, email, rating, text, plant_id, photos, approved, created_at, updated_at`,
    [req.body.name, req.body.email, Number(req.body.rating), req.body.text, req.body.plant || req.body.plantId || null, JSON.stringify(photos)]
  );
  res.status(201).json(toApiRecord(result.rows[0]));
}

export async function approveReview(req, res) {
  const result = await query(
    'UPDATE reviews SET approved = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, rating, text, plant_id, photos, approved, created_at, updated_at',
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: 'Review not found' });
  res.json(toApiRecord(result.rows[0]));
}

export async function deleteReview(req, res) {
  const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ message: 'Review not found' });
  res.json({ message: 'Review deleted' });
}

export async function reviewStats(req, res) {
  const result = await query(`
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average, COUNT(*)::int AS count
    FROM reviews
    WHERE approved = TRUE
  `);
  res.json(result.rows[0]);
}

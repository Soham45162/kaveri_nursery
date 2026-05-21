import { query, toApiRecord, toApiRecords } from '../config/db.js';

export async function subscribe(req, res) {
  const result = await query(
    `INSERT INTO newsletters (email, interests, active)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET interests = EXCLUDED.interests, active = TRUE, updated_at = NOW()
     RETURNING id, email, interests, active, created_at, updated_at`,
    [req.body.email, JSON.stringify(req.body.interests || [])]
  );
  res.status(201).json({ message: 'Subscribed successfully', subscriber: toApiRecord(result.rows[0]) });
}

export async function getSubscribers(req, res) {
  const result = await query('SELECT id, email, interests, active, created_at, updated_at FROM newsletters ORDER BY created_at DESC');
  res.json(toApiRecords(result.rows));
}

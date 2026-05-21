import { query, toApiRecord, toApiRecords } from '../config/db.js';

export async function submitContact(req, res) {
  const result = await query(
    `INSERT INTO contacts (name, email, phone, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, message, status, created_at, updated_at`,
    [req.body.name, req.body.email, req.body.phone, req.body.message]
  );
  res.status(201).json({ message: 'Message received', contact: toApiRecord(result.rows[0]) });
}

export async function getContacts(req, res) {
  const result = await query('SELECT id, name, email, phone, message, status, created_at, updated_at FROM contacts ORDER BY created_at DESC');
  res.json(toApiRecords(result.rows));
}

export async function updateContactStatus(req, res) {
  const result = await query(
    `UPDATE contacts SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, phone, message, status, created_at, updated_at`,
    [req.body.status, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: 'Contact not found' });
  res.json(toApiRecord(result.rows[0]));
}

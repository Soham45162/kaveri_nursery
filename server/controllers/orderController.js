import { query, toApiRecord, toApiRecords } from '../config/db.js';

export async function createOrder(req, res) {
  const result = await query(
    `INSERT INTO orders (customer, items, total, status, payment_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, customer, items, total::float, status, payment_status, created_at, updated_at`,
    [
      JSON.stringify(req.body.customer || {}),
      JSON.stringify(req.body.items || []),
      Number(req.body.total || 0),
      req.body.status || 'pending',
      req.body.paymentStatus || 'pending'
    ]
  );
  res.status(201).json(toApiRecord(result.rows[0]));
}

export async function getOrders(req, res) {
  const result = await query('SELECT id, customer, items, total::float, status, payment_status, created_at, updated_at FROM orders ORDER BY created_at DESC');
  res.json(toApiRecords(result.rows));
}

export async function updateOrderStatus(req, res) {
  const current = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!current.rows.length) return res.status(404).json({ message: 'Order not found' });

  const existing = toApiRecord(current.rows[0]);
  const result = await query(
    `UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, customer, items, total::float, status, payment_status, created_at, updated_at`,
    [req.body.status || existing.status, req.body.paymentStatus || existing.paymentStatus, req.params.id]
  );
  res.json(toApiRecord(result.rows[0]));
}

export async function analytics(req, res) {
  const result = await query(`
    SELECT
      COALESCE(SUM(total), 0)::float AS revenue,
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders
    FROM orders
  `);
  res.json(toApiRecord(result.rows[0]));
}

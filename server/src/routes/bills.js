import express from 'express';
import { query, pool } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bills - Fetch all bills with lines
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const billsRes = await query(`SELECT * FROM bills ORDER BY date DESC, created_at DESC`);
    const itemsRes = await query(`SELECT * FROM bill_items ORDER BY created_at ASC`);

    const itemsByBill = {};
    for (const item of itemsRes.rows) {
      if (!itemsByBill[item.bill_id]) itemsByBill[item.bill_id] = [];
      itemsByBill[item.bill_id].push({
        id: item.id,
        plantName: item.plant_name,
        qty: Number(item.qty),
        rate: Number(item.rate),
        lineTotal: Number(item.line_total)
      });
    }

    const formattedBills = billsRes.rows.map(b => ({
      id: b.id,
      _id: b.id,
      number: b.bill_number,
      type: b.type,
      customerName: b.customer_name,
      customerPhone: b.customer_phone || '',
      date: b.date ? b.date.toISOString().slice(0, 10) : '',
      notes: b.notes || '',
      total: Number(b.total),
      lines: itemsByBill[b.id] || [],
      createdAt: b.created_at
    }));

    res.json(formattedBills);
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// POST /api/bills - Create new bill/quotation with items atomically
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { type, customerName, customerPhone, date, notes, lines } = req.body;
    if (!customerName || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'Customer name and line items are required' });
    }

    await client.query('BEGIN');

    // Generate unique bill number
    const countRes = await client.query('SELECT COUNT(*) FROM bills WHERE type = $1', [type || 'Quotation']);
    const count = parseInt(countRes.rows[0].count, 10) + 1;
    const prefix = type === 'Bill' ? 'BILL' : 'QT';
    const billNumber = `${prefix}-${String(count).padStart(4, '0')}`;

    const total = lines.reduce((sum, line) => sum + (Number(line.qty || 0) * Number(line.rate || 0)), 0);

    const billRes = await client.query(`
      INSERT INTO bills (bill_number, type, customer_name, customer_phone, date, total, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      billNumber,
      type || 'Quotation',
      customerName,
      customerPhone || null,
      date || new Date().toISOString().slice(0, 10),
      total,
      notes || ''
    ]);

    const bill = billRes.rows[0];
    const insertedLines = [];

    for (const line of lines) {
      if (line.plantName) {
        const itemRes = await client.query(`
          INSERT INTO bill_items (bill_id, plant_name, qty, rate)
          VALUES ($1, $2, $3, $4)
          RETURNING id, plant_name AS "plantName", qty, rate, line_total AS "lineTotal"
        `, [bill.id, line.plantName, Number(line.qty) || 1, Number(line.rate) || 0]);

        insertedLines.push({
          id: itemRes.rows[0].id,
          plantName: itemRes.rows[0].plantName,
          qty: Number(itemRes.rows[0].qty),
          rate: Number(itemRes.rows[0].rate),
          lineTotal: Number(itemRes.rows[0].lineTotal)
        });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: bill.id,
      _id: bill.id,
      number: bill.bill_number,
      type: bill.type,
      customerName: bill.customer_name,
      customerPhone: bill.customer_phone || '',
      date: bill.date ? bill.date.toISOString().slice(0, 10) : '',
      notes: bill.notes || '',
      total: Number(bill.total),
      lines: insertedLines,
      createdAt: bill.created_at
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating bill:', err);
    res.status(500).json({ error: 'Failed to create bill: ' + err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/bills/:id - Delete bill
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Bill deleted successfully' });
  } catch (err) {
    console.error('Error deleting bill:', err);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

export default router;

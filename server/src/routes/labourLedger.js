import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// ATTENDANCE ROUTES
// ==========================================

// GET /api/attendance?month=YYYY-MM
router.get('/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const monthKey = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const [year, month] = monthKey.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await query(`
      SELECT labour_id, EXTRACT(DAY FROM attendance_date)::int AS day, status, custom_amount
      FROM labour_attendance
      WHERE attendance_date >= $1 AND attendance_date <= $2
    `, [startDate, endDate]);

    // Format as map { [labourId]: { [day]: status, [`${day}_amount`]: amount } }
    const formatted = {};
    for (const row of result.rows) {
      if (!formatted[row.labour_id]) formatted[row.labour_id] = {};
      formatted[row.labour_id][row.day] = row.status;
      if (row.status === 'Custom' && row.custom_amount !== null) {
        formatted[row.labour_id][`${row.day}_amount`] = Number(row.custom_amount);
      }
    }

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/attendance - Mark attendance for a day
router.post('/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const labourId = req.body.labourId || req.body.labour_id;
    const { date, status, customAmount } = req.body;
    if (!labourId || !date) {
      return res.status(400).json({ error: 'labourId and date are required' });
    }

    if (!status) {
      // Clear attendance record
      await query(`
        DELETE FROM labour_attendance 
        WHERE labour_id = $1 AND attendance_date = $2
      `, [labourId, date]);
      return res.json({ ok: true, message: 'Attendance cleared' });
    }

    await query(`
      INSERT INTO labour_attendance (labour_id, attendance_date, status, custom_amount)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (labour_id, attendance_date)
      DO UPDATE SET status = EXCLUDED.status, custom_amount = EXCLUDED.custom_amount, updated_at = NOW()
    `, [labourId, date, status, customAmount !== undefined ? customAmount : null]);

    res.json({ ok: true, message: 'Attendance recorded' });
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// ==========================================
// PAYMENTS ROUTES
// ==========================================

// GET /api/payments?month=YYYY-MM
router.get('/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const monthKey = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthKey.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await query(`
      SELECT id, labour_id, payment_date, amount, notes, created_at
      FROM labour_payments
      WHERE payment_date >= $1 AND payment_date <= $2
      ORDER BY payment_date ASC, created_at ASC
    `, [startDate, endDate]);

    // Format as map { [labourId]: [ { id, date, amount, notes } ] }
    const formatted = {};
    for (const row of result.rows) {
      if (!formatted[row.labour_id]) formatted[row.labour_id] = [];
      formatted[row.labour_id].push({
        id: row.id,
        date: row.payment_date ? row.payment_date.toISOString().slice(0, 10) : '',
        amount: Number(row.amount),
        notes: row.notes || ''
      });
    }

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments - Record salary payment
router.post('/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const labourId = req.body.labourId || req.body.labour_id;
    const { date, amount, notes } = req.body;
    if (!labourId || !amount) {
      return res.status(400).json({ error: 'labourId and amount are required' });
    }

    const result = await query(`
      INSERT INTO labour_payments (labour_id, payment_date, amount, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, labour_id, payment_date, amount, notes
    `, [
      labourId,
      date || new Date().toISOString().slice(0, 10),
      Number(amount),
      notes || 'Salary Payment'
    ]);

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      labourId: row.labour_id,
      date: row.payment_date ? row.payment_date.toISOString().slice(0, 10) : '',
      amount: Number(row.amount),
      notes: row.notes
    });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// DELETE /api/payments/:id
router.delete('/payments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM labour_payments WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Payment record deleted' });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// ==========================================
// ADVANCES ROUTES
// ==========================================

// GET /api/advances?month=YYYY-MM
router.get('/advances', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const monthKey = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthKey.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await query(`
      SELECT id, labour_id, advance_date, amount, notes, created_at
      FROM labour_advances
      WHERE advance_date >= $1 AND advance_date <= $2
      ORDER BY advance_date ASC, created_at ASC
    `, [startDate, endDate]);

    // Format as map { [labourId]: [ { id, date, amount, notes } ] }
    const formatted = {};
    for (const row of result.rows) {
      if (!formatted[row.labour_id]) formatted[row.labour_id] = [];
      formatted[row.labour_id].push({
        id: row.id,
        date: row.advance_date ? row.advance_date.toISOString().slice(0, 10) : '',
        amount: Number(row.amount),
        notes: row.notes || ''
      });
    }

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching advances:', err);
    res.status(500).json({ error: 'Failed to fetch advances' });
  }
});

// POST /api/advances - Record salary advance
router.post('/advances', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const labourId = req.body.labourId || req.body.labour_id;
    const { date, amount, notes } = req.body;
    if (!labourId || !amount) {
      return res.status(400).json({ error: 'labourId and amount are required' });
    }

    const result = await query(`
      INSERT INTO labour_advances (labour_id, advance_date, amount, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, labour_id, advance_date, amount, notes
    `, [
      labourId,
      date || new Date().toISOString().slice(0, 10),
      Number(amount),
      notes || 'Salary Advance'
    ]);

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      labourId: row.labour_id,
      date: row.advance_date ? row.advance_date.toISOString().slice(0, 10) : '',
      amount: Number(row.amount),
      notes: row.notes
    });
  } catch (err) {
    console.error('Error recording advance:', err);
    res.status(500).json({ error: 'Failed to record advance' });
  }
});

// DELETE /api/advances/:id
router.delete('/advances/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM labour_advances WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Advance record deleted' });
  } catch (err) {
    console.error('Error deleting advance:', err);
    res.status(500).json({ error: 'Failed to delete advance' });
  }
});

export default router;

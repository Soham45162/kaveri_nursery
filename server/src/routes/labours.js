import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function formatLabour(row, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Get wage history
  const wageRes = await query(`
    SELECT effective_date, rate, notes 
    FROM labour_wage_history 
    WHERE labour_id = $1 
    ORDER BY effective_date ASC, created_at ASC
  `, [row.id]);

  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    skillType: row.skill_type,
    role: row.skill_type,
    phone: row.phone,
    address: row.address || '',
    joiningDate: row.joining_date ? row.joining_date.toISOString().slice(0, 10) : '',
    salaryType: row.salary_type,
    salaryRate: Number(row.salary_rate),
    photoUrl: row.has_photo ? `${baseUrl}/api/labours/${row.id}/photo` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isActive: row.is_active,
    dailyWageHistory: wageRes.rows.map(w => ({
      date: w.effective_date ? w.effective_date.toISOString().slice(0, 10) : '',
      rate: Number(w.rate),
      notes: w.notes || ''
    })),
    createdAt: row.created_at
  };
}

// GET /api/labours - Fetch all workers
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT *, (photo_data IS NOT NULL) AS has_photo 
      FROM labours 
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    const formatted = await Promise.all(result.rows.map(r => formatLabour(r, req)));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching labours:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// GET /api/labours/:id/photo - Stream labour photo binary from BYTEA
router.get('/:id/photo', async (req, res) => {
  try {
    const result = await query(`
      SELECT photo_data, photo_mime_type 
      FROM labours 
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0 || !result.rows[0].photo_data) {
      return res.redirect('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    }

    res.setHeader('Content-Type', result.rows[0].photo_mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(result.rows[0].photo_data);
  } catch (err) {
    console.error('Error streaming labour photo:', err);
    res.status(500).json({ error: 'Failed to load photo' });
  }
});

// POST /api/labours - Add new labour worker
router.post('/', authenticateToken, requireAdmin, upload.single('photoFile'), async (req, res) => {
  try {
    const b = req.body;
    const photoData = req.file ? req.file.buffer : null;
    const photoMime = req.file ? req.file.mimetype : null;
    const photoName = req.file ? req.file.originalname : null;
    const rateNum = Number(b.salaryRate || b.daily_wage || b.rate) || 0;
    const joiningDate = b.joiningDate || new Date().toISOString().slice(0, 10);
    const skillType = b.skillType || b.role || 'Gardener';

    const result = await query(`
      INSERT INTO labours (
        name, skill_type, phone, address, joining_date, salary_type, salary_rate,
        photo_data, photo_mime_type, photo_file_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *, (photo_data IS NOT NULL) AS has_photo
    `, [
      b.name, skillType, b.phone, b.address || '',
      joiningDate, b.salaryType || 'daily', rateNum,
      photoData, photoMime, photoName
    ]);

    const labour = result.rows[0];

    // Insert initial wage history
    await query(`
      INSERT INTO labour_wage_history (labour_id, effective_date, rate, notes)
      VALUES ($1, $2, $3, $4)
    `, [labour.id, joiningDate, rateNum, 'Initial Rate on Joining']);

    const formatted = await formatLabour(labour, req);
    res.status(201).json(formatted);
  } catch (err) {
    console.error('Error adding labourer:', err);
    res.status(500).json({ error: 'Failed to add worker: ' + err.message });
  }
});

// PUT /api/labours/:id - Update labour worker
router.put('/:id', authenticateToken, requireAdmin, upload.single('photoFile'), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body;
    const newRate = Number(b.salaryRate) || 0;

    // Get current rate
    const currentRes = await query('SELECT salary_rate FROM labours WHERE id = $1', [id]);
    const oldRate = currentRes.rows.length > 0 ? Number(currentRes.rows[0].salary_rate) : 0;

    if (req.file) {
      await query(`
        UPDATE labours SET
          name = $1, skill_type = $2, phone = $3, address = $4,
          salary_type = $5, salary_rate = $6,
          photo_data = $7, photo_mime_type = $8, photo_file_name = $9,
          updated_at = NOW()
        WHERE id = $10
      `, [
        b.name, b.skillType || 'Gardener', b.phone, b.address || '',
        b.salaryType || 'daily', newRate,
        req.file.buffer, req.file.mimetype, req.file.originalname,
        id
      ]);
    } else {
      await query(`
        UPDATE labours SET
          name = $1, skill_type = $2, phone = $3, address = $4,
          salary_type = $5, salary_rate = $6,
          updated_at = NOW()
        WHERE id = $7
      `, [
        b.name, b.skillType || 'Gardener', b.phone, b.address || '',
        b.salaryType || 'daily', newRate,
        id
      ]);
    }

    // If rate changed, append wage history
    if (newRate !== oldRate) {
      await query(`
        INSERT INTO labour_wage_history (labour_id, effective_date, rate, notes)
        VALUES ($1, CURRENT_DATE, $2, $3)
      `, [id, newRate, `Rate updated from ₹${oldRate} to ₹${newRate}`]);
    }

    const updatedRes = await query(`
      SELECT *, (photo_data IS NOT NULL) AS has_photo 
      FROM labours WHERE id = $1
    `, [id]);

    const formatted = await formatLabour(updatedRes.rows[0], req);
    res.json(formatted);
  } catch (err) {
    console.error('Error updating worker:', err);
    res.status(500).json({ error: 'Failed to update worker: ' + err.message });
  }
});

// DELETE /api/labours/:id - Soft delete/remove labourer
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM labours WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Worker deleted successfully' });
  } catch (err) {
    console.error('Error deleting worker:', err);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

export default router;

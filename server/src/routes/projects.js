import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to format project for React UI
async function formatProject(projectRow, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Get all images
  const imgRes = await query(`
    SELECT id, image_type, sort_order 
    FROM project_images 
    WHERE project_id = $1 
    ORDER BY sort_order ASC, created_at ASC
  `, [projectRow.id]);

  const beforeImg = imgRes.rows.find(r => r.image_type === 'before');
  const afterImg = imgRes.rows.find(r => r.image_type === 'after');
  const additionalImgs = imgRes.rows.filter(r => r.image_type === 'additional');

  // Get plants used
  const plantRes = await query(`
    SELECT plant_name FROM project_plants WHERE project_id = $1
  `, [projectRow.id]);

  const beforeUrl = beforeImg ? `${baseUrl}/api/projects/images/${beforeImg.id}` : 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=900&q=80';
  const afterUrl = afterImg ? `${baseUrl}/api/projects/images/${afterImg.id}` : 'https://images.unsplash.com/photo-1558904541-efa8c3a30fc9?auto=format&fit=crop&w=900&q=80';

  return {
    id: projectRow.id,
    _id: projectRow.id,
    title: projectRow.title,
    category: projectRow.category,
    location: projectRow.location || '',
    duration: projectRow.duration || '',
    scope: projectRow.scope || '',
    result: projectRow.result || '',
    description: projectRow.result || projectRow.scope || '',
    before: beforeUrl,
    after: afterUrl,
    beforeImage: beforeUrl,
    afterImage: afterUrl,
    plantsUsed: plantRes.rows.map(r => r.plant_name),
    additionalImages: additionalImgs.map(r => `${baseUrl}/api/projects/images/${r.id}`),
    createdAt: projectRow.created_at,
    updatedAt: projectRow.updated_at
  };
}

// GET /api/projects - All projects
router.get('/', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM projects ORDER BY created_at DESC`);
    const projects = await Promise.all(result.rows.map(r => formatProject(r, req)));
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/images/:imageId - Stream binary image from PostgreSQL BYTEA
router.get('/images/:imageId', async (req, res) => {
  try {
    const result = await query(`
      SELECT image_data, mime_type, file_name 
      FROM project_images 
      WHERE id = $1
    `, [req.params.imageId]);

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.redirect('https://images.unsplash.com/photo-1558904541-efa8c3a30fc9?auto=format&fit=crop&w=900&q=80');
    }

    const { image_data, mime_type } = result.rows[0];
    res.setHeader('Content-Type', mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(image_data);
  } catch (err) {
    console.error('Error streaming project image:', err);
    res.status(500).json({ error: 'Failed to stream project image' });
  }
});

// POST /api/projects - Add new project with before/after/additional image BYTEA
router.post('/', authenticateToken, requireAdmin, upload.fields([
  { name: 'beforeFile', maxCount: 1 },
  { name: 'afterFile', maxCount: 1 },
  { name: 'additionalFiles', maxCount: 10 }
]), async (req, res) => {
  try {
    const b = req.body;
    const projectRes = await query(`
      INSERT INTO projects (title, category, location, duration, scope, result)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      b.title, b.category || 'Garden Design', b.location || '',
      b.duration || '', b.scope || '', b.result || ''
    ]);

    const projectId = projectRes.rows[0].id;

    // Handle before image
    if (req.files && req.files['beforeFile'] && req.files['beforeFile'][0]) {
      const f = req.files['beforeFile'][0];
      await query(`
        INSERT INTO project_images (project_id, image_data, mime_type, file_name, image_type, sort_order)
        VALUES ($1, $2, $3, $4, 'before', 1)
      `, [projectId, f.buffer, f.mimetype, f.originalname]);
    }

    // Handle after image
    if (req.files && req.files['afterFile'] && req.files['afterFile'][0]) {
      const f = req.files['afterFile'][0];
      await query(`
        INSERT INTO project_images (project_id, image_data, mime_type, file_name, image_type, sort_order)
        VALUES ($1, $2, $3, $4, 'after', 2)
      `, [projectId, f.buffer, f.mimetype, f.originalname]);
    }

    // Handle additional images
    if (req.files && req.files['additionalFiles']) {
      for (let i = 0; i < req.files['additionalFiles'].length; i++) {
        const f = req.files['additionalFiles'][i];
        await query(`
          INSERT INTO project_images (project_id, image_data, mime_type, file_name, image_type, sort_order)
          VALUES ($1, $2, $3, $4, 'additional', $5)
        `, [projectId, f.buffer, f.mimetype, f.originalname, i + 3]);
      }
    }

    // Handle plants used
    let plantsUsed = [];
    if (b.plantsUsed) {
      plantsUsed = Array.isArray(b.plantsUsed) ? b.plantsUsed : JSON.parse(b.plantsUsed || '[]');
      for (const plantName of plantsUsed) {
        if (plantName && plantName.trim()) {
          await query(`
            INSERT INTO project_plants (project_id, plant_name)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [projectId, plantName.trim()]);
        }
      }
    }

    const formatted = await formatProject(projectRes.rows[0], req);
    res.status(201).json(formatted);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', authenticateToken, requireAdmin, upload.fields([
  { name: 'beforeFile', maxCount: 1 },
  { name: 'afterFile', maxCount: 1 },
  { name: 'additionalFiles', maxCount: 10 }
]), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body;

    await query(`
      UPDATE projects SET
        title = $1, category = $2, location = $3, duration = $4,
        scope = $5, result = $6, updated_at = NOW()
      WHERE id = $7
    `, [b.title, b.category || 'Garden Design', b.location || '', b.duration || '', b.scope || '', b.result || '', id]);

    if (req.files && req.files['beforeFile'] && req.files['beforeFile'][0]) {
      const f = req.files['beforeFile'][0];
      await query(`DELETE FROM project_images WHERE project_id = $1 AND image_type = 'before'`, [id]);
      await query(`
        INSERT INTO project_images (project_id, image_data, mime_type, file_name, image_type, sort_order)
        VALUES ($1, $2, $3, $4, 'before', 1)
      `, [id, f.buffer, f.mimetype, f.originalname]);
    }

    if (req.files && req.files['afterFile'] && req.files['afterFile'][0]) {
      const f = req.files['afterFile'][0];
      await query(`DELETE FROM project_images WHERE project_id = $1 AND image_type = 'after'`, [id]);
      await query(`
        INSERT INTO project_images (project_id, image_data, mime_type, file_name, image_type, sort_order)
        VALUES ($1, $2, $3, $4, 'after', 2)
      `, [id, f.buffer, f.mimetype, f.originalname]);
    }

    if (req.files && req.files['additionalFiles']) {
      for (let i = 0; i < req.files['additionalFiles'].length; i++) {
        const f = req.files['additionalFiles'][i];
        await query(`
          INSERT INTO project_images (project_id, image_data, mime_type, file_name, image_type, sort_order)
          VALUES ($1, $2, $3, $4, 'additional', $5)
        `, [id, f.buffer, f.mimetype, f.originalname, i + 3]);
      }
    }

    if (b.plantsUsed) {
      const plantsUsed = Array.isArray(b.plantsUsed) ? b.plantsUsed : JSON.parse(b.plantsUsed || '[]');
      await query('DELETE FROM project_plants WHERE project_id = $1', [id]);
      for (const plantName of plantsUsed) {
        if (plantName && plantName.trim()) {
          await query(`
            INSERT INTO project_plants (project_id, plant_name)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [id, plantName.trim()]);
        }
      }
    }

    const updated = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    const formatted = await formatProject(updated.rows[0], req);
    res.json(formatted);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;

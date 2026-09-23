import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Helper to format plant response for frontend
function formatPlant(row, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    discount: row.discount || 0,
    description: row.description || '',
    image: row.has_image ? `${baseUrl}/api/plants/${row.id}/image` : 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80',
    careLevel: row.care_level,
    waterSchedule: row.water_schedule || '',
    sunlightReq: row.sunlight_req || '',
    fertilizerGuide: row.fertilizer_guide || '',
    soilType: row.soil_type || '',
    growthRate: row.growth_rate || '',
    bloomingSeason: row.blooming_season || '',
    temperature: row.temperature || '18-32°C',
    commonDiseases: row.common_diseases || '',
    diseaseTreatment: row.disease_treatment || '',
    careTips: row.care_tips || '',
    seasonalCare: row.seasonal_care || '',
    benefits: row.benefits || '',
    // backward compat
    water: row.water_schedule || 'Moderate',
    sunlight: row.sunlight_req || 'Indirect light',
    soil: row.soil_type || 'Well-drained soil',
    growthTips: row.care_tips || '',
    fertilizer: row.fertilizer_guide || '',
    diseases: row.common_diseases || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /api/plants - Fetch all plants
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, scientific_name, category, price, stock, discount, description,
        care_level, water_schedule, sunlight_req, fertilizer_guide, soil_type,
        growth_rate, blooming_season, temperature, common_diseases, disease_treatment,
        care_tips, seasonal_care, benefits, created_at, updated_at,
        (image_data IS NOT NULL) AS has_image
      FROM plants
      ORDER BY created_at DESC
    `);

    res.json(result.rows.map(row => formatPlant(row, req)));
  } catch (err) {
    console.error('Error fetching plants:', err);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// GET /api/plants/:id - Fetch single plant
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, scientific_name, category, price, stock, discount, description,
        care_level, water_schedule, sunlight_req, fertilizer_guide, soil_type,
        growth_rate, blooming_season, temperature, common_diseases, disease_treatment,
        care_tips, seasonal_care, benefits, created_at, updated_at,
        (image_data IS NOT NULL) AS has_image
      FROM plants
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    res.json(formatPlant(result.rows[0], req));
  } catch (err) {
    console.error('Error fetching plant by ID:', err);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

// GET /api/plants/:id/image - Serve binary image directly from PostgreSQL BYTEA
router.get('/:id/image', async (req, res) => {
  try {
    const result = await query(`
      SELECT image_data, image_mime_type, image_file_name
      FROM plants
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.redirect('https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80');
    }

    const { image_data, image_mime_type } = result.rows[0];
    res.setHeader('Content-Type', image_mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    res.send(image_data);
  } catch (err) {
    console.error('Error streaming plant image:', err);
    res.status(500).json({ error: 'Failed to load plant image' });
  }
});

// POST /api/plants - Add new plant (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const b = req.body;
    let imageData = req.file ? req.file.buffer : null;
    let mimeType = req.file ? req.file.mimetype : null;
    let fileName = req.file ? req.file.originalname : null;

    const result = await query(`
      INSERT INTO plants (
        name, scientific_name, category, price, stock, discount, description,
        image_data, image_mime_type, image_file_name,
        care_level, water_schedule, sunlight_req, fertilizer_guide, soil_type,
        growth_rate, blooming_season, temperature, common_diseases, disease_treatment,
        care_tips, seasonal_care, benefits
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23
      )
      RETURNING *, (image_data IS NOT NULL) AS has_image
    `, [
      b.name, b.scientificName || 'Add scientific name', b.category || 'Indoor',
      Number(b.price) || 0, parseInt(b.stock, 10) || 0, parseInt(b.discount, 10) || 0, b.description || '',
      imageData, mimeType, fileName,
      b.careLevel || 'Easy', b.waterSchedule || b.water || '', b.sunlightReq || b.sunlight || '',
      b.fertilizerGuide || b.fertilizer || '', b.soilType || b.soil || '',
      b.growthRate || '', b.bloomingSeason || '', b.temperature || '18-32°C',
      b.commonDiseases || b.diseases || '', b.diseaseTreatment || '',
      b.careTips || b.growthTips || '', b.seasonalCare || '', b.benefits || ''
    ]);

    res.status(201).json(formatPlant(result.rows[0], req));
  } catch (err) {
    console.error('Error creating plant:', err);
    res.status(500).json({ error: 'Failed to create plant: ' + err.message });
  }
});

// PUT /api/plants/:id - Update plant (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const b = req.body;
    const id = req.params.id;

    if (req.file) {
      await query(`
        UPDATE plants SET
          name = $1, scientific_name = $2, category = $3, price = $4, stock = $5, discount = $6, description = $7,
          image_data = $8, image_mime_type = $9, image_file_name = $10,
          care_level = $11, water_schedule = $12, sunlight_req = $13, fertilizer_guide = $14, soil_type = $15,
          growth_rate = $16, blooming_season = $17, temperature = $18, common_diseases = $19, disease_treatment = $20,
          care_tips = $21, seasonal_care = $22, benefits = $23, updated_at = NOW()
        WHERE id = $24
      `, [
        b.name, b.scientificName || 'Add scientific name', b.category || 'Indoor',
        Number(b.price) || 0, parseInt(b.stock, 10) || 0, parseInt(b.discount, 10) || 0, b.description || '',
        req.file.buffer, req.file.mimetype, req.file.originalname,
        b.careLevel || 'Easy', b.waterSchedule || b.water || '', b.sunlightReq || b.sunlight || '',
        b.fertilizerGuide || b.fertilizer || '', b.soilType || b.soil || '',
        b.growthRate || '', b.bloomingSeason || '', b.temperature || '18-32°C',
        b.commonDiseases || b.diseases || '', b.diseaseTreatment || '',
        b.careTips || b.growthTips || '', b.seasonalCare || '', b.benefits || '',
        id
      ]);
    } else {
      await query(`
        UPDATE plants SET
          name = $1, scientific_name = $2, category = $3, price = $4, stock = $5, discount = $6, description = $7,
          care_level = $8, water_schedule = $9, sunlight_req = $10, fertilizer_guide = $11, soil_type = $12,
          growth_rate = $13, blooming_season = $14, temperature = $15, common_diseases = $16, disease_treatment = $17,
          care_tips = $18, seasonal_care = $19, benefits = $20, updated_at = NOW()
        WHERE id = $21
      `, [
        b.name, b.scientificName || 'Add scientific name', b.category || 'Indoor',
        Number(b.price) || 0, parseInt(b.stock, 10) || 0, parseInt(b.discount, 10) || 0, b.description || '',
        b.careLevel || 'Easy', b.waterSchedule || b.water || '', b.sunlightReq || b.sunlight || '',
        b.fertilizerGuide || b.fertilizer || '', b.soilType || b.soil || '',
        b.growthRate || '', b.bloomingSeason || '', b.temperature || '18-32°C',
        b.commonDiseases || b.diseases || '', b.diseaseTreatment || '',
        b.careTips || b.growthTips || '', b.seasonalCare || '', b.benefits || '',
        id
      ]);
    }

    const updated = await query(`
      SELECT *, (image_data IS NOT NULL) AS has_image FROM plants WHERE id = $1
    `, [id]);

    res.json(formatPlant(updated.rows[0], req));
  } catch (err) {
    console.error('Error updating plant:', err);
    res.status(500).json({ error: 'Failed to update plant: ' + err.message });
  }
});

// DELETE /api/plants/:id - Delete plant (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM plants WHERE id = $1', [req.params.id]);
    res.json({ ok: true, message: 'Plant deleted successfully' });
  } catch (err) {
    console.error('Error deleting plant:', err);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

export default router;

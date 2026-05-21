import { query, toApiRecord, toApiRecords } from '../config/db.js';

const plantColumns = `
  id, name, scientific_name, category, price::float, stock, discount::float, image,
  gallery, description, water, sunlight, soil, temperature, growth_tips,
  fertilizer, benefits, diseases, seasonal_care, is_featured, created_at, updated_at
`;

export async function getPlants(req, res) {
  const { search = '', category } = req.query;
  const filters = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    filters.push(`(name ILIKE $${values.length} OR scientific_name ILIKE $${values.length} OR category ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }

  if (category && category !== 'All') {
    values.push(category);
    filters.push(`category = $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const result = await query(`SELECT ${plantColumns} FROM plants ${where} ORDER BY created_at DESC`, values);
  res.json(toApiRecords(result.rows));
}

export async function getPlant(req, res) {
  const result = await query(`SELECT ${plantColumns} FROM plants WHERE id = $1`, [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ message: 'Plant not found' });
  res.json(toApiRecord(result.rows[0]));
}

export async function createPlant(req, res) {
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  const result = await query(
    `INSERT INTO plants (
      name, scientific_name, category, price, stock, discount, image, gallery,
      description, water, sunlight, soil, temperature, growth_tips, fertilizer,
      benefits, diseases, seasonal_care, is_featured
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING ${plantColumns}`,
    [
      req.body.name,
      req.body.scientificName,
      req.body.category,
      Number(req.body.price || 0),
      Number(req.body.stock || 0),
      Number(req.body.discount || 0),
      image,
      JSON.stringify(req.body.gallery || []),
      req.body.description,
      req.body.water,
      req.body.sunlight,
      req.body.soil,
      req.body.temperature,
      req.body.growthTips,
      req.body.fertilizer,
      req.body.benefits,
      req.body.diseases,
      req.body.seasonalCare,
      req.body.isFeatured === 'true' || req.body.isFeatured === true
    ]
  );
  res.status(201).json(toApiRecord(result.rows[0]));
}

export async function updatePlant(req, res) {
  const current = await query('SELECT * FROM plants WHERE id = $1', [req.params.id]);
  if (!current.rows.length) return res.status(404).json({ message: 'Plant not found' });
  const existing = toApiRecord(current.rows[0]);
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image ?? existing.image;

  const result = await query(
    `UPDATE plants SET
      name = $1, scientific_name = $2, category = $3, price = $4, stock = $5,
      discount = $6, image = $7, gallery = $8, description = $9, water = $10,
      sunlight = $11, soil = $12, temperature = $13, growth_tips = $14,
      fertilizer = $15, benefits = $16, diseases = $17, seasonal_care = $18,
      is_featured = $19, updated_at = NOW()
    WHERE id = $20 RETURNING ${plantColumns}`,
    [
      req.body.name ?? existing.name,
      req.body.scientificName ?? existing.scientificName,
      req.body.category ?? existing.category,
      Number(req.body.price ?? existing.price),
      Number(req.body.stock ?? existing.stock),
      Number(req.body.discount ?? existing.discount),
      image,
      JSON.stringify(req.body.gallery ?? existing.gallery ?? []),
      req.body.description ?? existing.description,
      req.body.water ?? existing.water,
      req.body.sunlight ?? existing.sunlight,
      req.body.soil ?? existing.soil,
      req.body.temperature ?? existing.temperature,
      req.body.growthTips ?? existing.growthTips,
      req.body.fertilizer ?? existing.fertilizer,
      req.body.benefits ?? existing.benefits,
      req.body.diseases ?? existing.diseases,
      req.body.seasonalCare ?? existing.seasonalCare,
      req.body.isFeatured ?? existing.isFeatured,
      req.params.id
    ]
  );
  res.json(toApiRecord(result.rows[0]));
}

export async function deletePlant(req, res) {
  const result = await query('DELETE FROM plants WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ message: 'Plant not found' });
  res.json({ message: 'Plant deleted' });
}

export async function inventorySummary(req, res) {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total_plants,
      COUNT(*) FILTER (WHERE stock <= 10)::int AS low_stock,
      COALESCE(SUM(stock * price), 0)::float AS inventory_value
    FROM plants
  `);
  res.json(toApiRecord(result.rows[0]));
}

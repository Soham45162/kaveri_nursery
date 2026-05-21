import { query, toApiRecord, toApiRecords } from '../config/db.js';

const galleryColumns = `
  id, title, category, image, before_image, after_image, location, duration,
  budget, scope, plants_used, result, description, featured, created_at, updated_at
`;

export async function getGallery(req, res) {
  const { category } = req.query;
  const params = [];
  const where = category && category !== 'All' ? 'WHERE category = $1' : '';
  if (where) params.push(category);

  const result = await query(
    `SELECT ${galleryColumns}
     FROM gallery ${where}
     ORDER BY created_at DESC`,
    params
  );
  res.json(toApiRecords(result.rows));
}

export async function createGalleryItem(req, res) {
  const image = getUploadedPath(req, 'image') || getUploadedPath(req, 'afterImage') || req.body.image;
  const beforeImage = getUploadedPath(req, 'beforeImage') || req.body.beforeImage;
  const afterImage = getUploadedPath(req, 'afterImage') || req.body.afterImage || image;
  const result = await query(
    `INSERT INTO gallery (
      title, category, image, before_image, after_image, location, duration,
      budget, scope, plants_used, result, description, featured
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING ${galleryColumns}`,
    [
      req.body.title,
      req.body.category,
      image,
      beforeImage,
      afterImage,
      req.body.location,
      req.body.duration,
      req.body.budget,
      req.body.scope,
      JSON.stringify(parsePlantsUsed(req.body.plantsUsed)),
      req.body.result,
      req.body.description,
      req.body.featured === 'true' || req.body.featured === true
    ]
  );
  res.status(201).json(toApiRecord(result.rows[0]));
}

export async function updateGalleryItem(req, res) {
  const current = await query(`SELECT ${galleryColumns} FROM gallery WHERE id = $1`, [req.params.id]);
  if (!current.rows.length) return res.status(404).json({ message: 'Gallery item not found' });

  const existing = toApiRecord(current.rows[0]);
  const image = getUploadedPath(req, 'image') || getUploadedPath(req, 'afterImage') || req.body.image || existing.image;
  const beforeImage = getUploadedPath(req, 'beforeImage') || req.body.beforeImage || existing.beforeImage;
  const afterImage = getUploadedPath(req, 'afterImage') || req.body.afterImage || existing.afterImage;
  const result = await query(
    `UPDATE gallery SET
      title = $1, category = $2, image = $3, before_image = $4, after_image = $5,
      location = $6, duration = $7, budget = $8, scope = $9, plants_used = $10,
      result = $11, description = $12, featured = $13, updated_at = NOW()
    WHERE id = $14
    RETURNING ${galleryColumns}`,
    [
      req.body.title ?? existing.title,
      req.body.category ?? existing.category,
      image,
      beforeImage,
      afterImage,
      req.body.location ?? existing.location,
      req.body.duration ?? existing.duration,
      req.body.budget ?? existing.budget,
      req.body.scope ?? existing.scope,
      JSON.stringify(req.body.plantsUsed ? parsePlantsUsed(req.body.plantsUsed) : existing.plantsUsed || []),
      req.body.result ?? existing.result,
      req.body.description ?? existing.description,
      req.body.featured ?? existing.featured,
      req.params.id
    ]
  );
  res.json(toApiRecord(result.rows[0]));
}

export async function deleteGalleryItem(req, res) {
  const result = await query('DELETE FROM gallery WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ message: 'Gallery item not found' });
  res.json({ message: 'Gallery item deleted' });
}

function parsePlantsUsed(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function getUploadedPath(req, field) {
  const file = req.files?.[field]?.[0];
  return file ? `/uploads/${file.filename}` : null;
}

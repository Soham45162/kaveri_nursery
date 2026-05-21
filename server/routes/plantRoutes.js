import express from 'express';
import { createPlant, deletePlant, getPlant, getPlants, inventorySummary, updatePlant } from '../controllers/plantController.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.get('/', getPlants);
router.get('/inventory/summary', protect, adminOnly, inventorySummary);
router.get('/:id', getPlant);
router.post('/', protect, adminOnly, upload.single('image'), createPlant);
router.put('/:id', protect, adminOnly, upload.single('image'), updatePlant);
router.delete('/:id', protect, adminOnly, deletePlant);

export default router;

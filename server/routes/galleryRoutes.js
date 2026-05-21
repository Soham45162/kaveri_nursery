import express from 'express';
import { createGalleryItem, deleteGalleryItem, getGallery, updateGalleryItem } from '../controllers/galleryController.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
const galleryUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]);

router.get('/', getGallery);
router.post('/', protect, adminOnly, galleryUpload, createGalleryItem);
router.put('/:id', protect, adminOnly, galleryUpload, updateGalleryItem);
router.delete('/:id', protect, adminOnly, deleteGalleryItem);

export default router;

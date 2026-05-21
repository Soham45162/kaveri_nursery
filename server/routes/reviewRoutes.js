import express from 'express';
import { approveReview, createReview, deleteReview, getAllReviews, getApprovedReviews, reviewStats } from '../controllers/reviewController.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.get('/', getApprovedReviews);
router.get('/stats', reviewStats);
router.get('/admin', protect, adminOnly, getAllReviews);
router.post('/', upload.array('photos', 4), createReview);
router.patch('/:id/approve', protect, adminOnly, approveReview);
router.delete('/:id', protect, adminOnly, deleteReview);

export default router;

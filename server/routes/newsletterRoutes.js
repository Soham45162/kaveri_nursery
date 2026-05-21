import express from 'express';
import { getSubscribers, subscribe } from '../controllers/newsletterController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', subscribe);
router.get('/', protect, adminOnly, getSubscribers);

export default router;

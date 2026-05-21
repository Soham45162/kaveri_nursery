import express from 'express';
import { login, profile, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, profile);

export default router;

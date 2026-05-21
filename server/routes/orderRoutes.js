import express from 'express';
import { analytics, createOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', createOrder);
router.get('/', protect, adminOnly, getOrders);
router.get('/analytics', protect, adminOnly, analytics);
router.patch('/:id', protect, adminOnly, updateOrderStatus);

export default router;

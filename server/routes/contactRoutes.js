import express from 'express';
import { getContacts, submitContact, updateContactStatus } from '../controllers/contactController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', submitContact);
router.get('/', protect, adminOnly, getContacts);
router.patch('/:id', protect, adminOnly, updateContactStatus);

export default router;

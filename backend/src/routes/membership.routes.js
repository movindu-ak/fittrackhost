import express from 'express';
import {
  createMembership,
  getUserMembership,
  getMembershipStatus,
  getAllMemberships,
  updatePaymentStatus
} from '../controllers/membership.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createMembership);
router.get('/status', protect, getMembershipStatus);   // active + queued membership
router.get('/my', protect, getUserMembership);
router.get('/', protect, admin, getAllMemberships);
router.put('/:id/payment', protect, updatePaymentStatus);

export default router;

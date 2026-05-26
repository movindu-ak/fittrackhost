import express from 'express';
import {
  createPaymentOrder,
  handlePayHereNotify,
  verifyPaymentStatus,
  getPaymentHistory
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTE (no JWT — called by PayHere server)
// ─────────────────────────────────────────────
router.post('/notify', handlePayHereNotify);

// ─────────────────────────────────────────────
// PROTECTED ROUTES (JWT required)
// ─────────────────────────────────────────────
router.post('/create-order',       protect, createPaymentOrder);
router.get('/verify/:orderId',     protect, verifyPaymentStatus);
router.get('/history',             protect, getPaymentHistory);

export default router;
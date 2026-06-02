import express from 'express';
import {
  createPaymentOrder,
  handlePayHereNotify,
  verifyPaymentStatus,
  getPaymentHistory,
  getTodayRevenue,
  getPendingPayments,
  acceptPayment,
  getDailyRevenueSummary,
  getPaymentsByDate
} from '../controllers/payment.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTE (no JWT — called by PayHere server)
// ─────────────────────────────────────────────
router.post('/notify', handlePayHereNotify);

// ─────────────────────────────────────────────
// PROTECTED ROUTES (JWT required)
// ─────────────────────────────────────────────
router.post('/create-order',              protect,       createPaymentOrder);
router.get('/verify/:orderId',            protect,       verifyPaymentStatus);
router.get('/history',                    protect,       getPaymentHistory);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────
router.get('/admin/today',               protect, admin, getTodayRevenue);
router.get('/admin/pending',             protect, admin, getPendingPayments);
router.patch('/admin/:id/accept',        protect, admin, acceptPayment);
router.get('/admin/daily-summary',       protect, admin, getDailyRevenueSummary);
router.get('/admin/by-date',             protect, admin, getPaymentsByDate);

export default router;
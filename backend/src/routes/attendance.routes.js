import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  scanQR,
  getTodayAttendance,
  getUserAttendance,
  getAttendanceStats
} from '../controllers/attendance.controller.js';
router.get('/weekly', authMiddleware, getWeeklyAttendance);

const router = express.Router();

// Admin/Trainer only middleware
const adminOrTrainer = (req, res, next) => {
  if (!['admin', 'trainer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or Trainer access required' });
  }
  next();
};

// POST /api/attendance/scan  — scan QR (entry or exit)
router.post('/scan', protect, adminOrTrainer, scanQR);

// GET  /api/attendance/today — today's list
router.get('/today', protect, adminOrTrainer, getTodayAttendance);

// GET  /api/attendance/stats — quick stats
router.get('/stats', protect, adminOrTrainer, getAttendanceStats);

// GET  /api/attendance/user/:userId — member history
router.get('/user/:userId', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, getUserAttendance);

export default router;
import express from 'express';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  completeBooking,
  getTrainerBookings,
  updateBookingStatus,
  confirmBooking,
  trainerCancelBooking,
  getTrainerAvailability,
  getTrainerBookingSummary,
  getTodayBookingsCount,
  getTodayBookingsDetails,
  getTrainerAvailabilityWeek,
  updateTrainerAvailability,
  updateTrainerSpots
} from '../controllers/booking.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const trainerOnly = (req, res, next) => {
  if (req.user?.role !== 'trainer') {
    return res.status(403).json({ message: 'Trainer access required' });
  }
  next();
};

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/', protect, getUserBookings);
router.get('/all', protect, admin, getAllBookings);
router.get('/today/count', protect, admin, getTodayBookingsCount);
router.get('/today/details', protect, admin, getTodayBookingsDetails);
router.get('/trainer', protect, getTrainerBookings);
router.get('/trainer/summary', protect, getTrainerBookingSummary);
router.get('/trainer/:trainerId/availability', protect, getTrainerAvailability);
router.get('/trainer/availability', protect, trainerOnly, getTrainerAvailabilityWeek);
router.put('/trainer/availability', protect, trainerOnly, updateTrainerAvailability);
router.put('/trainer/spots', protect, updateTrainerSpots);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/complete', protect, completeBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/confirm', protect, confirmBooking);
router.put('/:id/trainer-cancel', protect, trainerCancelBooking);

export default router;
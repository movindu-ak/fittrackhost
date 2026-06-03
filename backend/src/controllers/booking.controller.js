import Booking from '../models/Booking.js';
import Membership from '../models/Membership.js';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { type, date, timeSlot, trainer } = req.body;

    // ── Membership guard ──────────────────────────────────────
    const activeMembership = await Membership.findOne({
      user: req.user._id,
      status: 'active',
      paymentStatus: 'paid',
      endDate: { $gte: new Date() }
    });

    if (!activeMembership) {
      return res.status(403).json({
        message: 'An active membership is required to book sessions. Please purchase a membership plan first.'
      });
    }
    // ─────────────────────────────────────────────────────────

    // Check if user has already booked 2 timeslots for the same day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const userBookingsCount = await Booking.countDocuments({
      user: req.user._id,
      date: { $gte: bookingDate, $lt: nextDay },
      status: { $in: ['processing', 'confirmed'] }
    });

    if (userBookingsCount >= 2) {
      return res.status(400).json({ 
        message: 'You have already booked the maximum of 2 timeslots for this day. Please select a different date.' 
      });
    }

    // If booking type is trainer, check the 5-member limit per timeslot
    if (type === 'trainer' && trainer) {
      // Count existing confirmed bookings for this trainer at this timeslot
      const existingBookings = await Booking.countDocuments({
        trainer,
        date: new Date(date),
        timeSlot,
        status: { $in: ['processing', 'confirmed'] }
      });

      if (existingBookings >= 5) {
        return res.status(400).json({ 
          message: 'This trainer has reached the maximum capacity (5 members) for this timeslot. Please select another timeslot or trainer.' 
        });
      }
    }

    // Auto-confirm bookings without trainers, keep trainer bookings as processing
    const initialStatus = (type === 'trainer' && trainer) ? 'processing' : 'confirmed';

    const booking = await Booking.create({
      user: req.user._id,
      type,
      date,
      timeSlot,
      trainer: type === 'trainer' ? trainer : undefined,
      status: initialStatus
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('trainer', 'name email')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/all
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('trainer', 'name email')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trainer bookings
// @route   GET /api/bookings/trainer
// @access  Private/Trainer
export const getTrainerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ trainer: req.user._id })
      .populate('user', 'name email phone')
      .sort({ date: 1, timeSlot: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Trainer)
// @route   PUT /api/bookings/:id/status
// @access  Private/Trainer
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if trainer owns the booking
    if (booking.trainer && booking.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone');

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm booking (Trainer)
// @route   PUT /api/bookings/:id/confirm
// @access  Private/Trainer
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if trainer owns the booking
    if (booking.trainer && booking.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm this booking' });
    }

    booking.status = 'confirmed';
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone');

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking by trainer
// @route   PUT /api/bookings/:id/trainer-cancel
// @access  Private/Trainer
export const trainerCancelBooking = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    
    // Validate cancellation reason
    if (!cancelReason || cancelReason.trim().length === 0) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }

    if (cancelReason.trim().length < 10) {
      return res.status(400).json({ message: 'Cancellation reason must be at least 10 characters' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if trainer owns the booking
    if (booking.trainer && booking.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = cancelReason.trim();
    booking.cancelledBy = 'trainer';
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone');

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Require cancellation reason for trainer bookings
    if (booking.trainer) {
      if (!cancelReason || cancelReason.trim().length === 0) {
        return res.status(400).json({ message: 'Cancellation reason is required for trainer bookings' });
      }
      if (cancelReason.trim().length < 10) {
        return res.status(400).json({ message: 'Cancellation reason must be at least 10 characters' });
      }
      booking.cancelReason = cancelReason.trim();
    }

    booking.status = 'cancelled';
    booking.cancelledBy = 'member';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete booking
// @route   PUT /api/bookings/:id/complete
// @access  Private
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow completion for bookings without trainers
    if (booking.trainer) {
      return res.status(400).json({ message: 'Trainer bookings cannot be manually completed' });
    }

    booking.status = 'completed';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trainer availability for a specific date and timeslot
// @route   GET /api/bookings/trainer/:trainerId/availability
// @access  Private
export const getTrainerAvailability = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { date, timeSlot } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({ 
        message: 'Date and timeSlot are required' 
      });
    }

    const bookingCount = await Booking.countDocuments({
      trainer: trainerId,
      date: new Date(date),
      timeSlot,
      status: { $in: ['processing', 'confirmed'] }
    });

    const available = bookingCount < 5;
    const spotsRemaining = Math.max(0, 5 - bookingCount);

    res.json({
      available,
      spotsRemaining,
      totalCapacity: 5,
      currentBookings: bookingCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trainer booking summary grouped by timeslot
// @route   GET /api/bookings/trainer/summary
// @access  Private/Trainer
export const getTrainerBookingSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const trainerId = req.user._id;

    // If date is provided, filter by that date, otherwise get all upcoming bookings
    const dateFilter = date ? { date: new Date(date) } : { date: { $gte: new Date() } };

    const bookings = await Booking.find({
      trainer: trainerId,
      ...dateFilter,
      status: { $in: ['processing', 'confirmed'] }
    }).populate('user', 'name email');

    // Group bookings by date and timeSlot
    const summary = {};
    
    bookings.forEach(booking => {
      const dateKey = new Date(booking.date).toISOString().split('T')[0];
      if (!summary[dateKey]) {
        summary[dateKey] = {};
      }
      if (!summary[dateKey][booking.timeSlot]) {
        summary[dateKey][booking.timeSlot] = {
          timeSlot: booking.timeSlot,
          count: 0,
          capacity: 5,
          members: []
        };
      }
      summary[dateKey][booking.timeSlot].count++;
      summary[dateKey][booking.timeSlot].members.push({
        id: booking._id,
        name: booking.user?.name,
        email: booking.user?.email,
        status: booking.status
      });
    });

    // Convert to array format
    const formattedSummary = Object.entries(summary).map(([date, slots]) => ({
      date,
      slots: Object.values(slots)
    }));

    res.json(formattedSummary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get today's bookings count
// @route   GET /api/bookings/today/count
// @access  Private/Admin
export const getTodayBookingsCount = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Count bookings created today (based on createdAt)
    const count = await Booking.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      count,
      date: startOfDay.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get today's bookings details grouped by trainer and timeslot
// @route   GET /api/bookings/today/details
// @access  Private/Admin
export const getTodayBookingsDetails = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const filter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };

    const [bookings, totalCount] = await Promise.all([
      Booking.find(filter)
        .populate('trainer', 'name email')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter)
    ]);

    res.json({
      bookings,
      count: totalCount,
      pages: Math.ceil(totalCount / limit),
      currentPage: page,
      date: startOfDay.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


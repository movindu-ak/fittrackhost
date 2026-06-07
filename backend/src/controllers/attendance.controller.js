import { Attendance } from '../models/Attendance.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';

// ─────────────────────────────────────────────────────────
// POST /api/attendance/scan
// Scan QR — auto detects entry or exit
// ─────────────────────────────────────────────────────────
export const scanQR = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const scannedBy = req.user._id;

    if (!qrCode) {
      return res.status(400).json({ success: false, message: 'QR code is required' });
    }

    // 1. Find the user this QR belongs to
    const user = await User.findOne({ qrCode });
    if (!user) {
      return res.status(404).json({ success: false, message: '❌ Invalid QR code. Member not found.' });
    }

    // 2. Check active membership
    const now = new Date();
    const membership = await Membership.findOne({
      user: user._id,
      status: 'active',
      endDate: { $gte: now }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: `⚠️ ${user.name} does not have an active membership.`,
        user: { name: user.name, email: user.email }
      });
    }

    // 3. Get today's start (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 4. Find existing attendance record for today
    const existing = await Attendance.findOne({
      user: user._id,
      date: { $gte: todayStart }
    });

    // ── ENTRY ──────────────────────────────────────────────
    if (!existing || existing.status === 'checked-out') {
      const record = await Attendance.create({
        user:            user._id,
        qrCode,
        date:            new Date(),
        entryTime:       new Date(),
        exitTime:        null,
        duration:        null,
        status:          'checked-in',
        membershipActive: true,
        scannedBy
      });

      return res.status(201).json({
        success: true,
        action:  'entry',
        message: `✅ ${user.name} checked in at ${formatTime(new Date())}`,
        attendance: {
          _id:       record._id,
          userName:  user.name,
          userEmail: user.email,
          entryTime: record.entryTime,
          status:    'checked-in'
        }
      });
    }

    // ── EXIT ───────────────────────────────────────────────
    if (existing.status === 'checked-in') {
      const exitTime = new Date();
      const durationMinutes = Math.round((exitTime - existing.entryTime) / 60000);

      existing.exitTime = exitTime;
      existing.duration = durationMinutes;
      existing.status   = 'checked-out';
      await existing.save();

      return res.status(200).json({
        success: true,
        action:  'exit',
        message: `✅ ${user.name} checked out at ${formatTime(exitTime)} (${formatDuration(durationMinutes)})`,
        attendance: {
          _id:          existing._id,
          userName:     user.name,
          userEmail:    user.email,
          entryTime:    existing.entryTime,
          exitTime:     existing.exitTime,
          duration:     existing.duration,
          durationText: formatDuration(durationMinutes),
          status:       'checked-out'
        }
      });
    }

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/attendance/today
// Get today's full attendance list
// ─────────────────────────────────────────────────────────
export const getTodayAttendance = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ date: { $gte: todayStart } })
      .populate('user', 'name email phone')
      .sort({ entryTime: -1 });

    const checkedIn  = records.filter(r => r.status === 'checked-in');
    const checkedOut = records.filter(r => r.status === 'checked-out');

    res.json({
      total:          records.length,
      checkedInCount: checkedIn.length,
      checkedOutCount: checkedOut.length,
      checkedIn: checkedIn.map(r => ({
        _id:       r._id,
        name:      r.user?.name,
        email:     r.user?.email,
        entryTime: formatTime(r.entryTime),
        status:    'Inside Gym'
      })),
      checkedOut: checkedOut.map(r => ({
        _id:          r._id,
        name:         r.user?.name,
        email:        r.user?.email,
        entryTime:    formatTime(r.entryTime),
        exitTime:     formatTime(r.exitTime),
        durationText: formatDuration(r.duration),
        status:       'Left'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/attendance/user/:userId
// Get attendance history for a specific member
// ─────────────────────────────────────────────────────────
export const getUserAttendance = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Attendance.find({ user: req.params.userId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments({ user: req.params.userId })
    ]);

    res.json({
      records: records.map(r => ({
        _id:          r._id,
        date:         r.date.toLocaleDateString('en-US'),
        entryTime:    formatTime(r.entryTime),
        exitTime:     r.exitTime ? formatTime(r.exitTime) : '—',
        durationText: r.duration ? formatDuration(r.duration) : '—',
        status:       r.status
      })),
      total,
      pages:       Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/attendance/stats
// Quick stats for admin dashboard
// ─────────────────────────────────────────────────────────
export const getAttendanceStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [today, week, month] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: todayStart } }),
      Attendance.countDocuments({ date: { $gte: weekStart } }),
      Attendance.countDocuments({ date: { $gte: monthStart } })
    ]);

    res.json({ today, week, month });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { Attendance } from '../models/Attendance.js';

// @desc    Get admin alerts
// @route   GET /api/alerts
// @access  Private/Admin
export const getAdminAlerts = async (req, res) => {
  try {
    const alerts = [];
    const now = new Date();

    // ─────────────────────────────────────────────
    // 1. REAL LIVE OCCUPANCY from Attendance model
    // ─────────────────────────────────────────────
    const GYM_CAPACITY = 50; // change to your gym's max capacity

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count members currently INSIDE the gym
    const checkedInCount = await Attendance.countDocuments({
      status: 'checked-in',
      date: { $gte: todayStart }
    });

    const percentage = Math.min(
      Math.round((checkedInCount / GYM_CAPACITY) * 100),
      100
    );

    // Alert if occupancy >= 75%
    if (percentage >= 75) {
      alerts.push({
        id: 'occupancy-high',
        type: 'warning',
        message: `High gym occupancy — ${percentage}% capacity (${checkedInCount}/${GYM_CAPACITY} members inside)`,
        time: 'Now',
        timestamp: new Date()
      });
    }

    // ─────────────────────────────────────────────
    // 2. New member registrations in last 24 hours
    // ─────────────────────────────────────────────
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const newUsers = await User.find({
      createdAt: { $gte: last24Hours },
      role: 'member'
    }).sort({ createdAt: -1 });

    newUsers.forEach(user => {
      alerts.push({
        id: `user-${user._id}`,
        type: 'info',
        message: `New member registered: ${user.name}`,
        time: getTimeAgo(user.createdAt),
        timestamp: user.createdAt
      });
    });

    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      alerts: alerts.slice(0, 10),
      count: alerts.length,
      occupancyPercentage: percentage,
      checkedInCount,
      gymCapacity: GYM_CAPACITY
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs    = now - new Date(date);
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};
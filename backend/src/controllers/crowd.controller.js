import { Attendance } from '../models/Attendance.js';

// @desc    Get current crowd level
// @route   GET /api/crowd/current
// @access  Public
export const getCurrentCrowd = async (req, res) => {
  try {
    const GYM_CAPACITY = 50; // change to your gym's max capacity

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count members currently INSIDE the gym
    const currentOccupancy = await Attendance.countDocuments({
      status: 'checked-in',
      date: { $gte: todayStart }
    });

    const percentage = Math.min(
      Math.round((currentOccupancy / GYM_CAPACITY) * 100),
      100
    );

    let level;
    if (percentage < 40)      level = 'low';
    else if (percentage < 70) level = 'medium';
    else                      level = 'high';

    res.json({
      level,
      percentage,
      currentOccupancy,
      totalCapacity: GYM_CAPACITY,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get crowd forecast
// @route   GET /api/crowd/forecast
// @access  Public
export const getCrowdForecast = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const timeSlots = [
      { time: '6:00 AM - 7:30 AM',   crowd: 'high' },
      { time: '8:00 AM - 9:30 AM',   crowd: 'high' },
      { time: '10:00 AM - 11:30 AM', crowd: 'medium' },
      { time: '12:00 PM - 1:30 PM',  crowd: 'low' },
      { time: '2:00 PM - 3:30 PM',   crowd: 'low' },
      { time: '4:00 PM - 5:30 PM',   crowd: 'medium' },
      { time: '6:00 PM - 7:30 PM',   crowd: 'high' },
      { time: '8:00 PM - 9:30 PM',   crowd: 'medium' }
    ];

    res.json({
      date: targetDate,
      forecast: timeSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
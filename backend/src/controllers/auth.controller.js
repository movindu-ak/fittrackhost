import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Payment } from '../models/Payment.js';
import Membership from '../models/Membership.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ageRange, gender } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate role
    if (role && !['admin', 'trainer', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Validate age range
    if (ageRange && !['10-15', '16-21', '22-30', '31-40', '41-50', '51+'].includes(ageRange)) {
      return res.status(400).json({ message: 'Invalid age range specified' });
    }

    // Validate gender
    if (gender && !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender specified' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'member',
      ageRange,
      gender
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ageRange: user.ageRange,
          gender: user.gender,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If role is provided, verify it matches (for admin login)
    if (role && user.role !== role) {
      return res.status(403).json({ 
        message: `You are not registered as a ${role}. Please use the correct login page.` 
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ageRange: user.ageRange,
        gender: user.gender,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('membershipId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all trainers
// @route   GET /api/auth/trainers
// @access  Private
export const getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' }).select('name email phone');
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register trainer by admin
// @route   POST /api/auth/register-trainer
// @access  Private/Admin
export const registerTrainer = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create trainer
    const trainer = await User.create({
      name,
      email,
      password,
      phone,
      role: 'trainer'
    });

    if (trainer) {
      res.status(201).json({
        success: true,
        message: 'Trainer registered successfully',
        data: {
          _id: trainer._id,
          name: trainer.name,
          email: trainer.email,
          phone: trainer.phone,
          role: trainer.role
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { email, phone, ageRange } = req.body;
    const userId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate email if changing
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Validate age range
    if (ageRange && !['10-15', '16-21', '22-30', '31-40', '41-50', '51+'].includes(ageRange)) {
      return res.status(400).json({ message: 'Invalid age range specified' });
    }

    // Update user
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (ageRange) user.ageRange = ageRange;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ageRange: user.ageRange,
      gender: user.gender,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get admin stats (member count + today's revenue)
// @route   GET /api/auth/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [memberCount, todayRevenue, membershipDistributionData, monthlyRevenueRaw] = await Promise.all([
      // Total registered members (role = 'member')
      User.countDocuments({ role: 'member' }),

      // Sum of captured payments created today
      Payment.aggregate([
        {
          $match: {
            status: 'captured',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Membership Distribution (1 per member, newest active plan)
      Membership.aggregate([
        { $match: { status: 'active' } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$user', plan: { $first: '$plan' } } },
        { $group: { _id: '$plan', value: { $sum: 1 } } }
      ]),

      // Monthly Revenue
      Payment.aggregate([
        { $match: { status: 'captured' } },
        {
          $group: {
            _id: {
              year: { $year: '$capturedAt' },
              month: { $month: '$capturedAt' }
            },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 7 },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthlyRevenueRaw.map(item => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue
    }));

    res.json({
      memberCount,
      todayRevenue: todayRevenue[0]?.total || 0,
      membershipDistribution: membershipDistributionData,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registered members (paginated + searchable)
// @route   GET /api/auth/members?page=1&limit=10&search=
// @access  Private/Admin
export const getMembers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 10;
    const search = (req.query.search || '').trim();
    const skip   = (page - 1) * limit;

    // Build search filter
    const filter = { role: 'member' };
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [members, total] = await Promise.all([
      User.find(filter)
        .select('name email phone ageRange gender createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({
      members,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

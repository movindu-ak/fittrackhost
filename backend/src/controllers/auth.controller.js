import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Payment } from '../models/Payment.js';
import Membership from '../models/Membership.js';
import qrcode from 'qrcode';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ageRange, gender } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide all required fields' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (role && !['admin', 'trainer', 'member'].includes(role))
      return res.status(400).json({ message: 'Invalid role specified' });
    if (ageRange && !['10-15', '16-21', '22-30', '31-40', '41-50', '51+'].includes(ageRange))
      return res.status(400).json({ message: 'Invalid age range specified' });
    if (gender && !['male', 'female'].includes(gender))
      return res.status(400).json({ message: 'Invalid gender specified' });
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, phone, role: role || 'member', ageRange, gender });
    const qrString = `FITTRACK_USER_${user._id}_${Date.now()}`;
    const qrImage = await qrcode.toDataURL(qrString);
    await User.updateOne({ _id: user._id }, { qrCode: qrString });
    console.log('QR saved:', qrString);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, ageRange: user.ageRange, gender: user.gender, qrCode: qrString, qrImage: qrImage, token: generateToken(user._id) }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    if (role && user.role !== role)
      return res.status(403).json({ message: `You are not registered as a ${role}. Please use the correct login page.` });
    return res.json({
      success: true, message: 'Login successful',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, ageRange: user.ageRange, gender: user.gender, qrCode: user.qrCode, token: generateToken(user._id) }
    });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('membershipId');
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getUserQR = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.qrCode) {
      const qrString = `FITTRACK_USER_${user._id}_${Date.now()}`;
      await User.updateOne({ _id: user._id }, { qrCode: qrString });
      user.qrCode = qrString;
    }
    const qrImage = await qrcode.toDataURL(user.qrCode);
    return res.json({ qrCode: user.qrCode, qrImage });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

export const getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' }).select('name email phone');
    res.json(trainers);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const registerTrainer = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide all required fields' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User with this email already exists' });
    const trainer = await User.create({ name, email, password, phone, role: 'trainer' });
    return res.status(201).json({ success: true, message: 'Trainer registered successfully', data: { _id: trainer._id, name: trainer.name, email: trainer.email, phone: trainer.phone, role: trainer.role } });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

export const updateProfile = async (req, res) => {
  try {
    const { email, phone, ageRange } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'Email already in use' });
    }
    if (ageRange && !['10-15', '16-21', '22-30', '31-40', '41-50', '51+'].includes(ageRange))
      return res.status(400).json({ message: 'Invalid age range specified' });
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (ageRange) user.ageRange = ageRange;
    await user.save();
    return res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, ageRange: user.ageRange, gender: user.gender, createdAt: user.createdAt });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const [memberCount, todayRevenue, membershipDistributionData, monthlyRevenueRaw] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      Payment.aggregate([{ $match: { status: 'captured', createdAt: { $gte: startOfDay, $lte: endOfDay } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Membership.aggregate([{ $match: { status: 'active' } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$user', plan: { $first: '$plan' } } }, { $group: { _id: '$plan', value: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'captured' } }, { $group: { _id: { year: { $year: '$capturedAt' }, month: { $month: '$capturedAt' } }, revenue: { $sum: '$amount' } } }, { $sort: { '_id.year': -1, '_id.month': -1 } }, { $limit: 7 }, { $sort: { '_id.year': 1, '_id.month': 1 } }])
    ]);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRevenue = monthlyRevenueRaw.map(item => ({ month: monthNames[item._id.month - 1], revenue: item.revenue }));
    return res.json({ memberCount, todayRevenue: todayRevenue[0]?.total || 0, membershipDistribution: membershipDistributionData, monthlyRevenue });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

export const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').trim();
    const skip = (page - 1) * limit;
    const filter = { role: 'member' };
    if (search) { filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]; }
    const [members, total] = await Promise.all([
      User.find(filter).select('name email phone ageRange gender createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);
    return res.json({ members, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

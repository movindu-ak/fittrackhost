import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js'; // ✅ MISSING IMPORT ADDED

const getMerchantId = () => process.env.PAYHERE_MERCHANT_ID;
const getMerchantSecret = () => process.env.PAYHERE_MERCHANT_SECRET;
const getMode = () => process.env.PAYHERE_MODE || 'sandbox';
const getPayhereUrl = () => getMode() === 'live'
  ? 'https://www.payhere.lk/pay/checkout'
  : 'https://sandbox.payhere.lk/pay/checkout';

const generateHash = (orderId, amount) => {
  const hashedSecret = crypto
    .createHash('md5')
    .update(getMerchantSecret())
    .digest('hex')
    .toUpperCase();

  const hashString =
    getMerchantId() +
    orderId +
    parseFloat(amount).toFixed(2) +
    'LKR' +
    hashedSecret;

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
};

export const createPaymentOrder = async (req, res) => {
  try {
    const { membershipId, bookingId, amount, description } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount provided' });
    }

    if (!getMerchantId() || !getMerchantSecret()) {
      console.error('❌ PayHere credentials not configured in .env');
      return res.status(500).json({ message: 'Payment gateway not configured. Please contact support.' });
    }

    console.log('✅ PayHere Config:', getMerchantId(), 'Mode:', getMode());

    const orderId = `FITTRACK_${userId}_${Date.now()}`;
    const hash = generateHash(orderId, amount);

    const payment = await Payment.create({
      user: userId,
      membershipId: membershipId || null,
      bookingId: bookingId || null,
      amount,
      currency: 'LKR',
      orderId,
      description: description || 'FitTrack Membership Payment',
      status: 'created'
    });

    res.status(201).json({
      merchantId: getMerchantId(),
      orderId,
      amount: parseFloat(amount).toFixed(2),
      currency: 'LKR',
      hash,
      payhereUrl: getPayhereUrl(),
      paymentRecordId: payment._id,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      notifyUrl: `${process.env.BACKEND_URL}/api/payments/notify`
    });

  } catch (error) {
    console.error('❌ Create Order Error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

export const handlePayHereNotify = async (req, res) => {
  try {
    const {
      merchant_id, order_id, payment_id,
      payhere_amount, payhere_currency,
      status_code, md5sig, method
    } = req.body;

    console.log(`📩 PayHere Notify: order=${order_id}, status=${status_code}`);

    const hashedSecret = crypto
      .createHash('md5')
      .update(getMerchantSecret())
      .digest('hex')
      .toUpperCase();

    const localHash = crypto
      .createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
      .digest('hex')
      .toUpperCase();

    if (localHash !== md5sig) {
      console.error('❌ PayHere signature mismatch');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const statusMap = { '2': 'captured', '0': 'pending', '-1': 'cancelled', '-2': 'failed', '-3': 'refunded' };
    const newStatus = statusMap[String(status_code)] || 'pending';

    const payment = await Payment.findOneAndUpdate(
      { orderId: order_id },
      {
        payherePaymentId: payment_id,
        status: newStatus,
        paymentMethod: method || null,
        capturedAt: newStatus === 'captured' ? new Date() : null
      },
      { new: true }
    );

    if (!payment) {
      console.error(`❌ Payment not found for orderId: ${order_id}`);
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // ✅ Activate membership ONLY on successful payment
    if (newStatus === 'captured' && payment.membershipId) {
      const membership = await Membership.findById(payment.membershipId);

      if (membership) {
        const isImmediate = membership.activationMode === 'immediate' ||
          membership.startDate <= new Date();

        if (isImmediate) {
          // Expire existing active memberships
          await Membership.updateMany(
            { user: membership.user, status: 'active', _id: { $ne: membership._id } },
            { $set: { status: 'expired' } }
          );

          // Activate new membership
          await Membership.findByIdAndUpdate(payment.membershipId, {
            status: 'active',
            paymentStatus: 'paid',
            paymentId: payment._id,
            paymentDate: new Date(),
            paymentMethod: method || null
          });

          // Update user pointer
          await User.findByIdAndUpdate(membership.user, { membershipId: payment.membershipId });
          console.log(`✅ Membership activated for user ${membership.user}`);

        } else {
          // Queued — activated later when current plan expires
          await Membership.findByIdAndUpdate(payment.membershipId, {
            status: 'queued',
            paymentStatus: 'paid',
            paymentId: payment._id,
            paymentDate: new Date(),
            paymentMethod: method || null
          });
          console.log(`✅ Membership queued for user ${membership.user}`);
        }
      }
    }

    // Keep membership as pending if payment failed/cancelled
    if ((newStatus === 'failed' || newStatus === 'cancelled') && payment.membershipId) {
      await Membership.findByIdAndUpdate(payment.membershipId, { paymentStatus: 'failed' });
      console.log(`❌ Payment ${newStatus} — membership stays pending`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Notify Error:', error);
    res.status(500).json({ message: 'Notify processing failed' });
  }
};

export const verifyPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({ orderId, user: userId })
      .populate('membershipId', 'plan status startDate endDate');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.json({
      success: payment.status === 'captured',
      status: payment.status,
      orderId: payment.orderId,
      amount: payment.amount,
      membership: payment.membershipId
    });
  } catch (error) {
    console.error('❌ Verify Error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ user: userId })
        .populate('membershipId', 'plan status startDate endDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ user: userId })
    ]);

    res.json({ payments, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    console.error('❌ History Error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

export const getTodayRevenue = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [payments, totalCount, aggResult] = await Promise.all([
      Payment.find({ status: 'captured', capturedAt: { $gte: startOfDay, $lte: endOfDay } })
        .populate('user', 'name email phone')
        .populate('membershipId', 'plan')
        .sort({ capturedAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments({ status: 'captured', capturedAt: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { status: 'captured', capturedAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({ payments, total: aggResult[0]?.total || 0, count: totalCount, pages: Math.ceil(totalCount / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'created' })
      .populate('user', 'name email phone')
      .populate('membershipId', 'plan startDate endDate')
      .sort({ createdAt: -1 });
    res.json({ payments, count: payments.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'created') return res.status(400).json({ message: `Payment is already ${payment.status}` });

    payment.status = 'captured';
    payment.capturedAt = new Date();
    await payment.save();

    if (payment.membershipId) {
      const membership = await Membership.findById(payment.membershipId);
      if (membership) {
        await Membership.updateMany(
          { user: membership.user, status: 'active', _id: { $ne: membership._id } },
          { $set: { status: 'expired' } }
        );
        await Membership.findByIdAndUpdate(payment.membershipId, {
          status: 'active', paymentStatus: 'paid', paymentId: payment._id, paymentDate: new Date()
        });
        await User.findByIdAndUpdate(membership.user, { membershipId: payment.membershipId });
      }
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDailyRevenueSummary = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$capturedAt' } }, totalRevenue: { $sum: '$amount' }, transactionCount: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $facet: { metadata: [{ $count: 'total' }], data: [{ $skip: skip }, { $limit: limit }] } }
    ]);

    const totalCount = result[0].metadata[0]?.total || 0;
    const days = result[0].data.map(d => ({ date: d._id, totalRevenue: d.totalRevenue, transactionCount: d.transactionCount }));
    res.json({ days, count: totalCount, pages: Math.ceil(totalCount / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [year, month, day] = date.split('-');
    const localStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const localEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

    const [payments, totalCount, aggResult] = await Promise.all([
      Payment.find({ status: 'captured', capturedAt: { $gte: localStart, $lte: localEnd } })
        .populate('user', 'name email phone').populate('membershipId', 'plan')
        .sort({ capturedAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments({ status: 'captured', capturedAt: { $gte: localStart, $lte: localEnd } }),
      Payment.aggregate([
        { $match: { status: 'captured', capturedAt: { $gte: localStart, $lte: localEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({ payments, total: aggResult[0]?.total || 0, count: totalCount, pages: Math.ceil(totalCount / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
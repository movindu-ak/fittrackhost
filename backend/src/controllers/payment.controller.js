import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import Membership from '../models/Membership.js';

const PAYHERE_MERCHANT_ID     = process.env.PAYHERE_MERCHANT_ID;
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
const PAYHERE_MODE            = process.env.PAYHERE_MODE || 'sandbox';

console.log('PayHere Config Check:');
console.log('Merchant ID:', PAYHERE_MERCHANT_ID);
console.log('Secret length:', PAYHERE_MERCHANT_SECRET?.length);
console.log('Mode:', PAYHERE_MODE);

// PayHere checkout URLs
const PAYHERE_URL = PAYHERE_MODE === 'live'
  ? 'https://www.payhere.lk/pay/checkout'
  : 'https://sandbox.payhere.lk/pay/checkout';

// ─────────────────────────────────────────────────────────
// HELPER: Generate PayHere MD5 Hash
// ─────────────────────────────────────────────────────────
const generateHash = (orderId, amount) => {
  // Step 1: Hash merchant secret
  const hashedSecret = crypto
    .createHash('md5')
    .update(PAYHERE_MERCHANT_SECRET)
    .digest('hex')
    .toUpperCase();

  // Step 2: Build hash string — ORDER MATTERS!
  const hashString =
    PAYHERE_MERCHANT_ID +
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
// ─────────────────────────────────────────────────────────
// 1. CREATE PAYMENT ORDER
// POST /api/payments/create-order
// ─────────────────────────────────────────────────────────
export const createPaymentOrder = async (req, res) => {
  try {
    const { membershipId, bookingId, amount, description } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount provided' });
    }

    // Generate unique order ID
    const orderId = `FITTRACK_${userId}_${Date.now()}`;

    // Generate PayHere hash
    const hash = generateHash(orderId, amount);

    // Save payment record to MongoDB (status = 'created')
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

    // Send everything frontend needs to build the form
    res.status(201).json({
      merchantId:   PAYHERE_MERCHANT_ID,
      orderId,
      amount:       parseFloat(amount).toFixed(2),
      currency:     'LKR',
      hash,
      payhereUrl:   PAYHERE_URL,
      paymentRecordId: payment._id,
      returnUrl:    `${process.env.FRONTEND_URL}/payment/success`,
      cancelUrl:    `${process.env.FRONTEND_URL}/payment/cancel`,
      notifyUrl:    `${process.env.BACKEND_URL}/api/payments/notify`
    });

   } catch (error) {
    console.error('❌ Create Order Error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
  // ✅ Nothing here — logs removed
};

// ─────────────────────────────────────────────────────────
// 2. PAYHERE NOTIFY (Webhook from PayHere server)
// POST /api/payments/notify
// Called by PayHere server after payment — NOT by user browser
// ─────────────────────────────────────────────────────────
export const handlePayHereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method
    } = req.body;

    console.log(`📩 PayHere Notify: order=${order_id}, status=${status_code}`);

    // Step 1: Verify the signature from PayHere
    const hashedSecret = crypto
      .createHash('md5')
      .update(PAYHERE_MERCHANT_SECRET)
      .digest('hex')
      .toUpperCase();

    const localHash = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        hashedSecret
      )
      .digest('hex')
      .toUpperCase();

    if (localHash !== md5sig) {
      console.error('❌ PayHere signature mismatch');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Step 2: Map PayHere status codes to our status
    // 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = refunded
    const statusMap = {
      '2':  'captured',
      '0':  'pending',
      '-1': 'cancelled',
      '-2': 'failed',
      '-3': 'refunded'
    };
    const newStatus = statusMap[status_code] || 'pending';

    // Step 3: Update payment record
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

    // Step 4: Update Membership if payment succeeded
    if (newStatus === 'captured' && payment.membershipId) {
      await Membership.findByIdAndUpdate(payment.membershipId, {
        paymentStatus:  'paid',
        paymentId:      payment._id,
        paymentDate:    new Date(),
        paymentMethod:  method || null,
        status:         'active'
      });
    }

    // Step 5: Handle failed/cancelled
    if ((newStatus === 'failed' || newStatus === 'cancelled') && payment.membershipId) {
      await Membership.findByIdAndUpdate(payment.membershipId, {
        paymentStatus: newStatus === 'cancelled' ? 'pending' : 'failed'
      });
    }

    // PayHere expects a 200 OK response
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Notify Error:', error);
    res.status(500).json({ message: 'Notify processing failed' });
  }
};

// ─────────────────────────────────────────────────────────
// 3. VERIFY PAYMENT (called by frontend on return_url)
// GET /api/payments/verify/:orderId
// ─────────────────────────────────────────────────────────
export const verifyPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({ orderId, user: userId })
      .populate('membershipId', 'plan status startDate endDate');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      success: payment.status === 'captured',
      status:  payment.status,
      orderId: payment.orderId,
      amount:  payment.amount,
      membership: payment.membershipId
    });

  } catch (error) {
    console.error('❌ Verify Error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ─────────────────────────────────────────────────────────
// 4. GET PAYMENT HISTORY
// GET /api/payments/history
// ─────────────────────────────────────────────────────────
export const getPaymentHistory = async (req, res) => {
  try {
    const userId  = req.user._id;
    const page    = parseInt(req.query.page)  || 1;
    const limit   = parseInt(req.query.limit) || 10;
    const skip    = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ user: userId })
        .populate('membershipId', 'plan status startDate endDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ user: userId })
    ]);

    res.json({
      payments,
      total,
      pages:       Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('❌ History Error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

// ─────────────────────────────────────────────────────────
// 5. TODAY'S CAPTURED PAYMENTS (Admin)
// GET /api/payments/admin/today
// ─────────────────────────────────────────────────────────
export const getTodayRevenue = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [payments, totalCount, aggResult] = await Promise.all([
      Payment.find({ status: 'captured', capturedAt: { $gte: startOfDay, $lte: endOfDay } })
        .populate('user', 'name email phone')
        .populate('membershipId', 'plan')
        .sort({ capturedAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ status: 'captured', capturedAt: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { status: 'captured', capturedAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      payments,
      total:       aggResult[0]?.total || 0,
      count:       totalCount,
      pages:       Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ─────────────────────────────────────────────────────────
// 6. PENDING (CREATED) PAYMENTS (Admin)
// GET /api/payments/admin/pending
// ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────
// 7. ACCEPT PAYMENT (Admin) — created → captured
// PATCH /api/payments/admin/:id/accept
// ─────────────────────────────────────────────────────────
export const acceptPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'created') {
      return res.status(400).json({ message: `Payment is already ${payment.status}` });
    }

    // Mark payment as captured
    payment.status     = 'captured';
    payment.capturedAt = new Date();
    await payment.save();

    // Activate linked membership if present
    if (payment.membershipId) {
      await Membership.findByIdAndUpdate(payment.membershipId, {
        paymentStatus: 'paid',
        paymentId:     payment._id,
        paymentDate:   new Date(),
        status:        'active'
      });
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 8. DAILY REVENUE SUMMARY (Admin)
// GET /api/payments/admin/daily-summary
// ─────────────────────────────────────────────────────────
export const getDailyRevenueSummary = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const pipeline = [
      { $match: { status: 'captured' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$capturedAt' } },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await Payment.aggregate(pipeline);
    const totalCount = result[0].metadata[0]?.total || 0;
    const days = result[0].data.map(d => ({
      date: d._id,
      totalRevenue: d.totalRevenue,
      transactionCount: d.transactionCount
    }));

    res.json({
      days,
      count: totalCount,
      pages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 9. PAYMENTS BY DATE (Admin)
// GET /api/payments/admin/by-date?date=YYYY-MM-DD
// ─────────────────────────────────────────────────────────
export const getPaymentsByDate = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Use local time matching getTodayRevenue logic
    const [year, month, day] = date.split('-');
    const localStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const localEnd   = new Date(year, month - 1, day, 23, 59, 59, 999);

    const [payments, totalCount, aggResult] = await Promise.all([
      Payment.find({ status: 'captured', capturedAt: { $gte: localStart, $lte: localEnd } })
        .populate('user', 'name email phone')
        .populate('membershipId', 'plan')
        .sort({ capturedAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ status: 'captured', capturedAt: { $gte: localStart, $lte: localEnd } }),
      Payment.aggregate([
        { $match: { status: 'captured', capturedAt: { $gte: localStart, $lte: localEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      payments,
      total: aggResult[0]?.total || 0,
      count: totalCount,
      pages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

# FitTrack Payment Integration - Architecture & Code Templates

---

## 🏗️ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FITTRACK PAYMENT SYSTEM                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   FRONTEND (React)  │
│                     │
│ MembershipPlans.jsx │
│        ↓            │
│ PaymentPage.jsx     │  (Enhanced with Razorpay Checkout)
│ Checkout Modal      │
│        ↓            │
│ POST /api/payments/ │
│ create-order        │
└──────────┬──────────┘
           │ HTTPS
           ↓
┌──────────────────────────────────────────────────────┐
│         BACKEND (Express + MongoDB)                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Payment Routes                                      │
│  ├── POST /create-order     → Payment Controller    │
│  ├── POST /verify-payment   → Payment Controller    │
│  ├── POST /webhook          → Payment Controller    │
│  ├── GET /history           → Payment Controller    │
│  └── POST /:id/refund       → Payment Controller    │
│                                                      │
│  Membership Routes                                   │
│  └── Link with Payment Records (Updated)            │
│                                                      │
│  Authentication Middleware (JWT)                    │
│  └── Protect all payment endpoints                  │
│                                                      │
└──────────┬────────────────────┬─────────────────────┘
           │                    │
           ↓ API Call           ↓ Webhook
┌──────────────────────────────────────────────────────┐
│  MongoDB (Database)                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Collections:                                        │
│  ├── users                                           │
│  ├── memberships (linked with payments)             │
│  ├── bookings                                        │
│  ├── payments (NEW)                                  │
│  │   ├── user (ref)                                 │
│  │   ├── membershipId (ref, optional)               │
│  │   ├── razorpayOrderId (unique)                   │
│  │   ├── razorpayPaymentId                          │
│  │   ├── razorpaySignature                          │
│  │   ├── status: created|pending|captured|failed    │
│  │   ├── amount, currency                           │
│  │   └── timestamps                                 │
│  └── invoices (NEW, optional)                       │
│                                                      │
└──────────────────────────────────────────────────────┘
           ↑              ↑
           │ Request      │ Webhook Callback
           │              │
┌──────────┴──────────────┴──────────────────────────┐
│        RAZORPAY API (Payment Gateway)              │
├───────────────────────────────────────────────────┤
│                                                   │
│  API Endpoints:                                   │
│  ├── Create Order                                │
│  ├── Capture Payment                             │
│  ├── Process Refund                              │
│  ├── Verify Signature                            │
│  └── Send Webhooks                               │
│                                                   │
│  Test Mode Available for Development              │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 📋 PAYMENT WORKFLOW SEQUENCE

```
USER ACTION                    FRONTEND                   BACKEND                  RAZORPAY

User selects           
membership plan
   │
   ├──────────────────> Show Payment Summary
   │                    + Order Details
   │
   ├──────────────────> Click "Proceed to Payment"
   │
   ├──────────────────> POST /api/payments/
   │                    create-order
   │                            │
   │                            ├────────────────────────> POST /orders
   │                            │                         (Create Order)
   │                            │ (Get orderId,
   │                            │  orderAmount)
   │                            │<────────────────────────
   │<──────────────────────────────────────────────────
   │
   ├──────────────────> Display Razorpay 
   │                    Checkout Modal
   │
   │ User enters payment details
   │ (card, UPI, NetBanking, etc.)
   │
   ├──────────────────> Razorpay Checkout
   │                    Processes Payment
   │                            │
   │                            ├───────────────────────> Bank/Payment
   │                            │                        Provider
   │                            │<───────────────────────
   │                            │
   │                    Get Payment ID +
   │                    Signature
   │<──────────────────
   │
   ├──────────────────> POST /api/payments/
   │                    verify-payment
   │                    (with signature)
   │                            │
   │                            ├─ Verify Signature
   │                            │  (Using secret key)
   │                            │
   │                            ├─ Create Payment Record
   │                            │  in MongoDB
   │                            │
   │                            ├─ Update Membership
   │                            │  (paymentStatus='paid')
   │                            │
   │                            ├─ Send Confirmation
   │                            │  Email
   │                            │
   │<──────────────────────────────────────────────────
   │ {success: true}
   │
   ├──────────────────> Show Success Page
   │
   └──────────────────> Redirect to Dashboard
```

---

## 💾 DATABASE SCHEMA - PAYMENT MODEL

```javascript
// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    index: true
  },

  // Payment Amount
  amount: {
    type: Number,
    required: [true, 'Please provide amount'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },

  // Razorpay Details
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true,
    index: true
  },
  razorpaySignature: {
    type: String,
    sparse: true
  },

  // Payment Status
  status: {
    type: String,
    enum: ['created', 'pending', 'captured', 'failed', 'refunded'],
    default: 'created',
    index: true
  },

  // Payment Metadata
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi', null],
    sparse: true
  },
  description: String,
  notes: mongoose.Schema.Types.Mixed,

  // Refund Information
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: [null, 'pending', 'processed', 'failed'],
    default: null,
    sparse: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  capturedAt: {
    type: Date,
    sparse: true
  }
});

// Indexes for better query performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
```

---

## 🔑 PAYMENT CONTROLLER - CORE FUNCTIONS

```javascript
// controllers/payment.controller.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Membership } from '../models/Membership.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. CREATE PAYMENT ORDER
export const createPaymentOrder = async (req, res) => {
  try {
    const { membershipId, bookingId, amount, description } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create Razorpay Order
    const options = {
      amount: amount * 100, // Convert to paise (₹ to paise)
      currency: 'INR',
      receipt: `fittrack_${userId}_${Date.now()}`,
      description: description || 'FitTrack Membership Payment',
      customer_notify: 1,
      notes: {
        userId: userId.toString(),
        membershipId: membershipId?.toString() || null,
        bookingId: bookingId?.toString() || null
      }
    };

    const order = await razorpay.orders.create(options);

    // Store Payment Record
    const payment = await Payment.create({
      user: userId,
      membershipId,
      bookingId,
      amount,
      currency: 'INR',
      razorpayOrderId: order.id,
      description,
      status: 'created'
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 2. VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user._id;

    // Verify Signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpaySignature;

    if (!isSignatureValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid payment signature' 
      });
    }

    // Update Payment Record
    const payment = await Payment.findOneAndUpdate(
      { 
        razorpayOrderId,
        user: userId 
      },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'captured',
        capturedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ 
        message: 'Payment record not found' 
      });
    }

    // Update Membership if applicable
    if (payment.membershipId) {
      await Membership.findByIdAndUpdate(
        payment.membershipId,
        { 
          paymentStatus: 'paid',
          paymentId: payment._id,
          paymentDate: new Date()
        }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: payment._id,
      status: payment.status
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 3. WEBHOOK HANDLER
export const handlePaymentWebhook = async (req, res) => {
  try {
    const { body } = req;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = body.event;
    const eventData = body.payload;

    console.log(`Processing webhook: ${event}`);

    switch (event) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentCaptured(eventData);
        break;

      case 'payment.failed':
        await handlePaymentFailed(eventData);
        break;

      case 'refund.created':
        await handleRefundCreated(eventData);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper: Handle Payment Captured
const handlePaymentCaptured = async (eventData) => {
  const paymentData = eventData.payment.entity;
  
  await Payment.findOneAndUpdate(
    { razorpayPaymentId: paymentData.id },
    { 
      status: 'captured',
      capturedAt: new Date()
    }
  );

  // Update membership status
  // Send confirmation email
  // Log transaction
};

// Helper: Handle Payment Failed
const handlePaymentFailed = async (eventData) => {
  const paymentData = eventData.payment.entity;
  
  await Payment.findOneAndUpdate(
    { razorpayPaymentId: paymentData.id },
    { status: 'failed' }
  );

  // Notify user
  // Log failure
};

// Helper: Handle Refund
const handleRefundCreated = async (eventData) => {
  const refundData = eventData.refund.entity;
  
  await Payment.findOneAndUpdate(
    { razorpayPaymentId: refundData.payment_id },
    { 
      refundId: refundData.id,
      refundAmount: refundData.amount / 100,
      refundStatus: 'processed'
    }
  );
};

// 4. GET PAYMENT HISTORY
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ user: userId })
      .populate('membershipId', 'plan amount status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ user: userId });

    res.json({
      payments,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. REFUND PAYMENT
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user._id;

    const payment = await Payment.findOne({ 
      _id: paymentId,
      user: userId 
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'captured') {
      return res.status(400).json({ 
        message: 'Only captured payments can be refunded' 
      });
    }

    // Call Razorpay Refund API
    const refundAmount = (amount || payment.amount) * 100; // Convert to paise
    
    const refund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: refundAmount,
        notes: { reason, refundedBy: userId.toString() }
      }
    );

    // Update Payment Record
    await Payment.findByIdAndUpdate(
      paymentId,
      {
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        refundStatus: 'pending'
      }
    );

    res.json({
      success: true,
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      message: 'Refund initiated successfully'
    });
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(500).json({ message: error.message });
  }
};
```

---

## 🛣️ PAYMENT ROUTES

```javascript
// routes/payment.routes.js
import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentWebhook,
  getPaymentHistory,
  refundPayment
} from '../controllers/payment.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);
router.post('/:paymentId/refund', protect, refundPayment);

// Webhook (no authentication - Razorpay will use signature)
router.post('/webhook', handlePaymentWebhook);

export default router;
```

---

## ⚛️ FRONTEND - PAYMENT CHECKOUT COMPONENT

```jsx
// components/PaymentCheckout.jsx
import { useState } from 'react';
import axios from 'axios';

export function PaymentCheckout({ membershipId, amount, plan }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Create Order
      const { data } = await axios.post(
        'https://fittrackhost.onrender.com/api/payments/create-order',
        {
          membershipId,
          amount,
          description: `FitTrack ${plan} Membership`
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'FitTrack',
        description: `Subscription: ${plan}`,
        order_id: data.orderId,
        handler: async (response) => {
          // Step 2: Verify Payment
          try {
            const verifyRes = await axios.post(
              'https://fittrackhost.onrender.com/api/payments/verify-payment',
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (verifyRes.data.success) {
              alert('Payment successful!');
              window.location.href = '/member/dashboard';
            }
          } catch (err) {
            setError('Payment verification failed');
            console.error(err);
          }
        },
        prefill: {
          name: localStorage.getItem('userName'),
          email: localStorage.getItem('userEmail')
        },
        theme: {
          color: '#2563eb'
        }
      };

      // Step 3: Open Razorpay Checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-checkout">
      <h2>Complete Your Payment</h2>
      <div className="order-summary">
        <p>Plan: {plan}</p>
        <p>Amount: ₹{amount}</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="btn-pay"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}
```

---

## 📝 ENVIRONMENT SETUP

```env
# backend/.env

# Database
MONGODB_URI=mongodb://localhost:27017/fittrack

# Authentication
JWT_SECRET=your_super_secret_key_here

# Razorpay (Get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=https://fittrackhost.onrender.com

# Email (Optional, for receipts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Environment
NODE_ENV=development
PORT=5000
```

---

## 🔧 INSTALLATION COMMANDS

```bash
# Backend dependencies
cd backend
npm install razorpay crypto nodemailer joi helmet express-rate-limit

# Frontend dependencies
cd frontend
npm install axios react-toastify date-fns

# Update server.js to include payment routes
# Update membership controller to link with payments
```

---

## 📝 MONGODB INDEX COMMANDS

```javascript
// Run these in MongoDB to optimize queries
db.payments.createIndex({ "user": 1, "createdAt": -1 });
db.payments.createIndex({ "razorpayOrderId": 1 });
db.payments.createIndex({ "status": 1, "createdAt": -1 });
db.payments.createIndex({ "createdAt": -1 });
```

---

**These templates & architectures are ready to share with Claude AI for implementation**

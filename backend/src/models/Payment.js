import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    default: null
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },

  // Payment Amount
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'LKR'           // ← LKR for PayHere (Sri Lanka)
  },

  // PayHere specific fields
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  payherePaymentId: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null            // 'VISA', 'MASTER', 'AMEX', etc.
  },

  // Payment Status
  status: {
    type: String,
    enum: ['created', 'pending', 'captured', 'failed', 'refunded', 'cancelled'],
    default: 'created',
    index: true
  },

  description: {
    type: String,
    default: ''
  },

  // Refund Info
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: [null, 'pending', 'processed', 'failed'],
    default: null
  },

  capturedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true           // adds createdAt and updatedAt
});

// Indexes for query performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
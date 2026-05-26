import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'elite'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  // ADD these fields to your existing Membership schema:

paymentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Payment',
  default: null
},
paymentDate: {
  type: Date,
  default: null
},
paymentMethod: {
  type: String,
  default: null
},
renewalDueDate: {
  type: Date,
  default: null
}
});

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    qrCode: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    entryTime: {
      type: Date,
      required: true
    },
    exitTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // minutes
      default: null
    },
    status: {
      type: String,
      enum: ['checked-in', 'checked-out'],
      default: 'checked-in'
    },
    membershipActive: {
      type: Boolean,
      default: true
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes for fast lookups
attendanceSchema.index({ user: 1, date: -1 });
attendanceSchema.index({ qrCode: 1 });
attendanceSchema.index({ date: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
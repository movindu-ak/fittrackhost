import mongoose from 'mongoose';

const trainerAvailabilitySchema = new mongoose.Schema({
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },       // local midnight of the day, same convention as Booking.date
  timeSlot: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  spots: { type: Number, default: 5, min: 1, max: 50 }
});

trainerAvailabilitySchema.index({ trainer: 1, date: 1, timeSlot: 1 }, { unique: true });

const TrainerAvailability = mongoose.model('TrainerAvailability', trainerAvailabilitySchema);
export default TrainerAvailability;

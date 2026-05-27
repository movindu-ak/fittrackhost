import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import crowdRoutes from './routes/crowd.routes.js';
import alertRoutes from './routes/alert.routes.js';
import paymentRoutes from './routes/payment.routes.js';


// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ⚠️ IMPORTANT: Webhook needs raw body, so register it BEFORE express.json()
app.use('/api/payments/notify', express.raw({ type: '*/*' }));

// middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// ✅ Add payment routes
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FitTrack API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add this simple test route
app.get('/', (req, res) => {
  res.json({ message: 'FitTrack API is running!' });
});
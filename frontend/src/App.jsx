import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { MembershipPlanSelection } from './pages/MembershipPlanSelection';
import PaymentPage from './pages/PaymentPage';
import { MemberDashboard } from './pages/MemberDashboard';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { BookingPage } from './pages/BookingPage';
import MembershipPayments from './pages/MembershipPayments';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import PaymentSuccess from './pages/PaymentSuccess';
import API_URL from '../config.js';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-neutral-800">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/select-membership" element={<MembershipPlanSelection />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel"  element={<PaymentPage />} />

          {/* Protected Routes */}
         <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/trainer-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <TrainerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <BookingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/membership" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MembershipPayments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['member', 'trainer', 'admin']}>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Dumbbell, Shield } from 'lucide-react';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const response = await fetch('https://fittrackhost.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'admin'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Verify admin role
      if (data.data.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.');
      }

      // Save token and user data to localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.data._id,
        name: data.data.name,
        email: data.data.email,
        role: data.data.role
      }));

      // Redirect to admin dashboard
      navigate('/admin-dashboard');
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-green-500/30">
                <Shield className="w-12 h-12 text-black" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Admin Portal
            </h2>
            <p className="text-neutral-400 text-lg">FitTrack Management System</p>
          </div>

          {/* Login Form */}
          <div className="bg-neutral-800/50 backdrop-blur-xl border border-neutral-700 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {apiError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {apiError}
                </div>
              )}

              <Input
                label="Admin Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@fittrack.com"
                error={errors.email}
                required
              />

              <Input
                label="Admin Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                error={errors.password}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Admin Sign In'}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-neutral-700">
              <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs mb-3">
                <Shield className="w-3 h-3" />
                <span>Secure Admin Access Only</span>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs">
                <p className="text-green-400 font-semibold mb-2">Default Admin Credentials:</p>
                <p className="text-neutral-300">Email: admin@fittrack.com</p>
                <p className="text-neutral-300">Password: admin123</p>
                <p className="text-yellow-400 text-xs mt-2">⚠️ Change password after first login</p>
              </div>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-neutral-400 hover:text-white text-sm transition"
            >
              ← Back to Member Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

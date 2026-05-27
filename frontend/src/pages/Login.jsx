import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Dumbbell, ArrowLeft } from 'lucide-react';

export const Login = () => {
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
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data to localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.data._id,
        name: data.data.name,
        email: data.data.email,
        role: data.data.role
      }));

      // Redirect based on role
      switch (data.data.role) {
        case 'trainer':
          navigate('/trainer-dashboard');
          break;
        case 'member':
          navigate('/member-dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900/95 to-black z-10" />
        <img
          src="https://images.unsplash.com/photo-1761971975769-97e598bf526b"
          alt="Gym background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/40 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Home</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 hover:opacity-80 transition"
          >
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              FitTrack
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-20 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
              Welcome Back to
              <span className="block bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                FitTrack
              </span>
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg">Sign in to continue your fitness journey</p>
          </div>

          {/* Login Form */}
          <div className="bg-neutral-900/80 backdrop-blur-lg border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {apiError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {apiError}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                error={errors.email}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                error={errors.password}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 pt-6 border-t border-neutral-800 text-center">
              <p className="text-neutral-400 text-sm">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-green-400 font-semibold hover:text-green-300 transition"
                >
                  Sign up
                </Link>
              </p>
              <p className="text-neutral-500 text-xs mt-3">
                Admin?{' '}
                <Link 
                  to="/admin" 
                  className="text-neutral-400 hover:text-white transition"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-neutral-500 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

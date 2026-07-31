import {
  ArrowRight,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Dumbbell,
  Clock,
  Shield,
  Check,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CrowdLevel } from '../components/CrowdLevel';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import API_URL from '../config.js';

export function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [crowdLevel, setCrowdLevel] = useState('low');
  const [crowdPercentage, setCrowdPercentage] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    fetchCrowdStatus();
    const interval = setInterval(fetchCrowdStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCrowdStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/crowd/current`);
      if (response.ok) {
        const data = await response.json();
        setCrowdLevel(data.level);
        setCrowdPercentage(data.percentage);
      }
    } catch (error) {
      console.error('Error fetching crowd status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-black/40 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              FitTrack
            </span>
          </div>

          {!user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-neutral-400 hover:text-white text-sm sm:text-base"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base"
              >
                Join Now
              </button>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  if (user.role === 'admin') {
                    navigate('/admin-dashboard');
                  } else if (user.role === 'trainer') {
                    navigate('/trainer-dashboard');
                  } else {
                    navigate('/member-dashboard');
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base border border-neutral-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Welcome Message */}
      {user && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <p className="text-lg sm:text-xl font-semibold text-white">
              Welcome back, <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">{user.name || user.email}</span>!
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px] sm:min-h-[700px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
        <div className="absolute inset-0 opacity-40">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1761971975769-97e598bf526b"
            alt="Modern gym"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Train Smarter
            <span className="block bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-neutral-300 mb-6 sm:mb-8 max-w-3xl">
            Next-gen gym management with real-time crowd monitoring and smart booking.
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                Join Gym <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => navigate('/member-dashboard')}
                className="bg-neutral-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl border border-neutral-700 text-sm sm:text-base"
              >
                View Crowd Status
              </button>
            </div>
          )}

          <div className="max-w-sm">
            <p className="text-neutral-400 text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Gym Status
            </p>
            <CrowdLevel level={crowdLevel} percentage={crowdPercentage} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 md:py-20 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
              Powerful features designed for the modern gym experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Users, title: 'Crowd Control', color: 'green' },
              { icon: Calendar, title: 'Smart Booking', color: 'blue' },
              { icon: CreditCard, title: 'Flexible Plans', color: 'purple' },
              { icon: BarChart3, title: 'Analytics', color: 'orange' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl p-6"
                >
                  <Icon className="w-6 h-6 text-green-400 mb-4" />
                  <h3 className="text-xl text-white font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400">
                    Modern tools for smarter gym management.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose FitTrack */}
      <section className="py-12 sm:py-16 md:py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Features */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 sm:mb-12">
                Why Choose FitTrack?
              </h2>
              
              <div className="space-y-6 sm:space-y-8">
                {/* Save Time */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                      Save Time
                    </h3>
                    <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                      No more waiting. Check crowd levels and book your perfect workout window.
                    </p>
                  </div>
                </div>

                {/* Premium Experience */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                      Premium Experience
                    </h3>
                    <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                      Professional management system trusted by leading fitness centers.
                    </p>
                  </div>
                </div>

                {/* Data-Driven */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                      Data-Driven
                    </h3>
                    <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                      Make informed decisions with real-time analytics and insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="relative rounded-2xl overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470"
                alt="Modern gym interior"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="py-12 sm:py-16 md:py-20 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
              Flexible membership options to fit your fitness goals and budget
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Basic Plan */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 sm:p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-white">LKR 5,000</span>
                  <span className="text-neutral-400 ml-2">/month</span>
                </div>
                <p className="text-neutral-400 text-sm">Perfect for beginners</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Access to gym equipment</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Locker facility</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Basic workout guidance</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Valid for 1 month</span>
                </li>
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-neutral-800 border-2 border-green-500 rounded-2xl p-6 sm:p-8 md:scale-105 shadow-lg shadow-green-500/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-white">LKR 12,000</span>
                  <span className="text-neutral-400 ml-2">/3 months</span>
                </div>
                <p className="text-neutral-400 text-sm">Best value for money</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">All Basic features</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">2 personal training sessions</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Diet consultation</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Valid for 3 months</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Priority booking</span>
                </li>
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-green-500/30"
              >
                Get Started
              </button>
            </div>

            {/* Platinum Plan */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 sm:p-8 hover:border-green-500/50 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Platinum</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-white">LKR 40,000</span>
                  <span className="text-neutral-400 ml-2">/year</span>
                </div>
                <p className="text-neutral-400 text-sm">Ultimate fitness experience</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">All Premium features</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited personal training</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced analytics</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Valid for 12 months</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Guest passes (2 per month)</span>
                </li>
                <li className="flex items-start gap-3 text-neutral-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Exclusive member events</span>
                </li>
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 bg-black text-center px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                    Ready to Transform Your Fitness Journey?

        </h2>
        <button
          onClick={() => navigate('/signup')}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-black px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base"
        >
          Get Started Today
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-neutral-800 py-6 text-center">
        <p className="text-neutral-400 text-sm">
          © 2026 FitTrack. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

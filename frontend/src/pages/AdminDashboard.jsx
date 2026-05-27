import { Users, TrendingUp, DollarSign, AlertCircle, Calendar, Clock, UserPlus, X, User } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { StatCard } from '../components/StatCard';
import { CrowdLevel } from '../components/CrowdLevel';
import { useState, useEffect } from 'react';
import { Input } from '../components/ui/Input';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function AdminDashboard({ onNavigate }) {
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [occupancyPercentage, setOccupancyPercentage] = useState(35);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [todayBookingsDetails, setTodayBookingsDetails] = useState(null);
  const [loadingBookingsDetails, setLoadingBookingsDetails] = useState(false);
  const [trainerFormData, setTrainerFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrainers();
    fetchAlerts();
    fetchTodayBookings();
    
    // Refresh alerts and bookings every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts();
      fetchTodayBookings();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/auth/trainers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrainers(data);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoadingTrainers(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setOccupancyPercentage(data.occupancyPercentage || 35);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchTodayBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/bookings/today/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayBookingsCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching today bookings:', error);
    }
  };

  const fetchTodayBookingsDetails = async () => {
    setLoadingBookingsDetails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/bookings/today/details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayBookingsDetails(data);
      }
    } catch (error) {
      console.error('Error fetching today bookings details:', error);
    } finally {
      setLoadingBookingsDetails(false);
    }
  };

  const handleBookingsCardClick = () => {
    setShowBookingsModal(true);
    fetchTodayBookingsDetails();
  };

  const handleTrainerFormChange = (e) => {
    const { name, value } = e.target;
    setTrainerFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateTrainerForm = () => {
    const errors = {};
    
    if (!trainerFormData.name || trainerFormData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!trainerFormData.email || !/\S+@\S+\.\S+/.test(trainerFormData.email)) {
      errors.email = 'Valid email is required';
    }
    
    if (!trainerFormData.password || trainerFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (trainerFormData.phone && !/^\d{10}$/.test(trainerFormData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone must be 10 digits';
    }
    
    return errors;
  };

  const handleRegisterTrainer = async (e) => {
    e.preventDefault();
    
    const errors = validateTrainerForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/auth/register-trainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trainerFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register trainer');
      }

      // Success
      alert('Trainer registered successfully!');
      setShowTrainerModal(false);
      setTrainerFormData({ name: '', email: '', password: '', phone: '' });
      fetchTrainers(); // Refresh trainer list
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  const attendanceData = [
    { day: 'Mon', members: 145 },
    { day: 'Tue', members: 168 },
    { day: 'Wed', members: 152 },
    { day: 'Thu', members: 178 },
    { day: 'Fri', members: 195 },
    { day: 'Sat', members: 210 },
    { day: 'Sun', members: 185 },
  ];

  const revenueData = [
    { month: 'Jul', revenue: 24500 },
    { month: 'Aug', revenue: 26800 },
    { month: 'Sep', revenue: 28200 },
    { month: 'Oct', revenue: 31500 },
    { month: 'Nov', revenue: 29800 },
    { month: 'Dec', revenue: 33200 },
    { month: 'Jan', revenue: 35600 },
  ];

  const membershipDistribution = [
    { name: 'Basic', value: 120, color: '#3b82f6' },
    { name: 'Premium', value: 85, color: '#10b981' },
    { name: 'Annual', value: 45, color: '#a855f7' },
  ];




  return (
    <div className="min-h-screen">
      <Navigation currentPage="admin" role="admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-neutral-400">Monitor gym operations and analytics</p>
          </div>
          <button
            onClick={() => setShowTrainerModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Register Trainer
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Active Members" value="250" icon={Users} trend={{ value: '12%', isPositive: true }} accentColor="green" />
          <StatCard title="Today's Revenue" value="LKR 320,000" icon={DollarSign} trend={{ value: '8%', isPositive: true }} accentColor="blue" />
          <StatCard title="Current Occupancy" value={`${occupancyPercentage}%`} icon={TrendingUp} accentColor="purple" />
          <div onClick={handleBookingsCardClick} className="cursor-pointer hover:scale-105 transition-transform">
            <StatCard 
              title="Bookings Today" 
              value={todayBookingsCount.toString()} 
              icon={Calendar} 
              trend={{ value: `${todayBookingsCount} bookings`, isPositive: true }} 
              accentColor="orange" 
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Live Occupancy */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Live Gym Occupancy</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Live</span>
                </div>
              </div>

              <CrowdLevel level={occupancyPercentage < 40 ? 'low' : occupancyPercentage < 70 ? 'medium' : 'high'} percentage={occupancyPercentage} />
            </div>

            {/* Attendance */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Weekly Attendance</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="members" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-6">
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Alerts</h3>
                </div>
                {alerts.length > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">
                    {alerts.length}
                  </span>
                )}
              </div>

              {loadingAlerts ? (
                <div className="text-center py-4">
                  <p className="text-neutral-400 text-sm">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">No alerts at this time</p>
                  <p className="text-neutral-500 text-xs mt-1">You'll be notified when gym reaches 75% capacity or new members register</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-3 ${
                        alert.type === 'warning' 
                          ? 'bg-orange-500/10 border-orange-500/30' 
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`w-4 h-4 mt-0.5 ${
                          alert.type === 'warning' ? 'text-orange-400' : 'text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-white">{alert.message}</p>
                          <p className="text-neutral-400 text-xs mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Membership */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Membership Mix</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={membershipDistribution} innerRadius={60} outerRadius={80} dataKey="value">
                    {membershipDistribution.map((item, index) => (
                      <Cell key={index} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {membershipDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-neutral-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{item.value} members</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip formatter={(value) => `LKR ${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trainers Management */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Registered Trainers</h2>
            <span className="text-neutral-400 text-sm">{trainers.length} Total</span>
          </div>
          
          {loadingTrainers ? (
            <div className="text-center py-8">
              <p className="text-neutral-400">Loading trainers...</p>
            </div>
          ) : trainers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 mb-4">No trainers registered yet</p>
              <button
                onClick={() => setShowTrainerModal(true)}
                className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-medium transition-all"
              >
                Register First Trainer
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainers.map((trainer) => (
                <div
                  key={trainer._id}
                  className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 hover:border-green-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{trainer.name}</h3>
                  <p className="text-neutral-400 text-sm mb-1">{trainer.email}</p>
                  {trainer.phone && (
                    <p className="text-neutral-500 text-xs">📱 {trainer.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Register Trainer Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Register New Trainer</h2>
              <button
                onClick={() => {
                  setShowTrainerModal(false);
                  setTrainerFormData({ name: '', email: '', password: '', phone: '' });
                  setFormErrors({});
                }}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegisterTrainer} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={trainerFormData.name}
                onChange={handleTrainerFormChange}
                placeholder="Enter trainer's full name"
                error={formErrors.name}
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={trainerFormData.email}
                onChange={handleTrainerFormChange}
                placeholder="trainer@fittrack.com"
                error={formErrors.email}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={trainerFormData.password}
                onChange={handleTrainerFormChange}
                placeholder="Minimum 6 characters"
                error={formErrors.password}
                required
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                name="phone"
                value={trainerFormData.phone}
                onChange={handleTrainerFormChange}
                placeholder="07XXXXXXXX"
                error={formErrors.phone}
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTrainerModal(false);
                    setTrainerFormData({ name: '', email: '', password: '', phone: '' });
                    setFormErrors({});
                  }}
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Registering...' : 'Register Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today's Bookings Modal */}
      {showBookingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Today's Bookings</h2>
                {todayBookingsDetails && (
                  <p className="text-sm text-gray-600 mt-1">
                    {todayBookingsDetails.date} - Total: {todayBookingsDetails.totalBookings} bookings
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingBookingsDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : todayBookingsDetails ? (
                <div className="space-y-6">
                  {/* Trainer Bookings */}
                  {todayBookingsDetails.trainers && todayBookingsDetails.trainers.length > 0 ? (
                    todayBookingsDetails.trainers.map((trainer) => (
                      <div key={trainer.trainerId} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-orange-600" />
                            {trainer.trainerName}
                          </h3>
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                            {trainer.totalBookings} bookings
                          </span>
                        </div>

                        <div className="space-y-3">
                          {trainer.timeslots.map((slot, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-600" />
                                  <span className="font-medium text-gray-800">{slot.timeSlot}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  slot.count === 5 ? 'bg-red-100 text-red-700' :
                                  slot.count >= 3 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {slot.count}/5
                                </span>
                              </div>
                              <div className="ml-6 space-y-1">
                                {slot.members.map((member, mIndex) => (
                                  <div key={mIndex} className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    {member.name} {member.phone && `(${member.phone})`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : null}

                  {/* General Bookings */}
                  {todayBookingsDetails.generalBookings && todayBookingsDetails.generalBookings.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          General Bookings
                        </h3>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {todayBookingsDetails.generalBookingsCount} bookings
                        </span>
                      </div>

                      <div className="space-y-2">
                        {todayBookingsDetails.generalBookings.map((booking, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{booking.userName}</p>
                                <p className="text-sm text-gray-600">{booking.userPhone}</p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {booking.timeSlot}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{booking.date}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Bookings */}
                  {(!todayBookingsDetails.trainers || todayBookingsDetails.trainers.length === 0) &&
                   (!todayBookingsDetails.generalBookings || todayBookingsDetails.generalBookings.length === 0) && (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings today</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load bookings details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


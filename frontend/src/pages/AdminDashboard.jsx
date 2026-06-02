import { Users, TrendingUp, DollarSign, AlertCircle, Calendar, Clock, UserPlus, X, User, Search, ChevronLeft, ChevronRight, Phone, Mail, CheckCircle, BadgeDollarSign } from 'lucide-react';
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

const API_URL = 'http://localhost:5000/api';

export function AdminDashboard({ onNavigate }) {
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [occupancyPercentage, setOccupancyPercentage] = useState(35);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [todayBookingsDetails, setTodayBookingsDetails] = useState([]);
  const [loadingBookingsDetails, setLoadingBookingsDetails] = useState(false);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingsCount, setBookingsCount] = useState(0);
  // Live stat card data
  const [memberCount, setMemberCount] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [membershipDistribution, setMembershipDistribution] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  // Members modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const [membersTotalPages, setMembersTotalPages] = useState(1);
  const [membersTotal, setMembersTotal] = useState(0);
  const [memberSearch, setMemberSearch] = useState('');
  // Revenue modal
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenuePayments, setRevenuePayments] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenuePage, setRevenuePage] = useState(1);
  const [revenueTotalPages, setRevenueTotalPages] = useState(1);
  const [revenueCount, setRevenueCount] = useState(0);
  // Daily Summary table
  const [dailySummary, setDailySummary] = useState([]);
  const [dailySummaryLoading, setDailySummaryLoading] = useState(false);
  const [dailySummaryPage, setDailySummaryPage] = useState(1);
  const [dailySummaryTotalPages, setDailySummaryTotalPages] = useState(1);
  // Historical Payments modal
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [historicalDate, setHistoricalDate] = useState(null);
  const [historicalPayments, setHistoricalPayments] = useState([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalTotal, setHistoricalTotal] = useState(0);
  const [historicalPage, setHistoricalPage] = useState(1);
  const [historicalTotalPages, setHistoricalTotalPages] = useState(1);
  const [historicalCount, setHistoricalCount] = useState(0);
  // Pending payments (for alerts)
  const [pendingPayments, setPendingPayments] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
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
    fetchStats();
    fetchPendingPayments();
    fetchDailySummary(1);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts();
      fetchTodayBookings();
      fetchStats();
      fetchPendingPayments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMemberCount(data.memberCount);
        setTodayRevenue(data.todayRevenue);
        setRevenueData(data.monthlyRevenue || []);

        if (data.membershipDistribution) {
          const colorMap = {
            basic: '#3b82f6',
            premium: '#10b981',
            elite: '#a855f7'
          };
          const mapped = data.membershipDistribution.map(item => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.value,
            color: colorMap[item._id] || '#8884d8'
          }));
          setMembershipDistribution(mapped);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTodayRevenue = async (page = 1) => {
    setRevenueLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page, limit: 10 });
      const res = await fetch(`${API_URL}/payments/admin/today?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRevenuePayments(data.payments || []);
        setRevenueTotal(data.total || 0);
        setRevenuePage(data.currentPage || 1);
        setRevenueTotalPages(data.pages || 1);
        setRevenueCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching revenue:', err);
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payments/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching pending payments:', err);
    }
  };

  const handleAcceptPayment = async (paymentId) => {
    setAcceptingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payments/admin/${paymentId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from pending list and refresh stats
        setPendingPayments(prev => prev.filter(p => p._id !== paymentId));
        fetchStats(); // refresh revenue card
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to accept payment');
      }
    } catch (err) {
      console.error('Error accepting payment:', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleOpenRevenueModal = () => {
    setShowRevenueModal(true);
    setRevenuePage(1);
    fetchTodayRevenue(1);
  };

  const handleRevenuePageChange = (newPage) => {
    setRevenuePage(newPage);
    fetchTodayRevenue(newPage);
  };

  const fetchDailySummary = async (page = 1) => {
    setDailySummaryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page, limit: 10 });
      const res = await fetch(`${API_URL}/payments/admin/daily-summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailySummary(data.days || []);
        setDailySummaryPage(data.currentPage || 1);
        setDailySummaryTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching daily summary:', err);
    } finally {
      setDailySummaryLoading(false);
    }
  };

  const handleDailySummaryPageChange = (newPage) => {
    setDailySummaryPage(newPage);
    fetchDailySummary(newPage);
  };

  const fetchPaymentsByDate = async (date, page = 1) => {
    setHistoricalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ date, page, limit: 10 });
      const res = await fetch(`${API_URL}/payments/admin/by-date?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoricalPayments(data.payments || []);
        setHistoricalTotal(data.total || 0);
        setHistoricalPage(data.currentPage || 1);
        setHistoricalTotalPages(data.pages || 1);
        setHistoricalCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching historical payments:', err);
    } finally {
      setHistoricalLoading(false);
    }
  };

  const handleOpenHistoricalModal = (date) => {
    setHistoricalDate(date);
    setShowHistoricalModal(true);
    setHistoricalPage(1);
    fetchPaymentsByDate(date, 1);
  };

  const handleHistoricalPageChange = (newPage) => {
    setHistoricalPage(newPage);
    fetchPaymentsByDate(historicalDate, newPage);
  };

  const fetchMembers = async (page = 1, search = '') => {
    setMembersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page, limit: 10, search });
      const res = await fetch(`${API_URL}/auth/members?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setMembersTotalPages(data.pages || 1);
        setMembersTotal(data.total || 0);
        setMembersPage(data.currentPage || 1);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleOpenMembersModal = () => {
    setShowMembersModal(true);
    setMemberSearch('');
    setMembersPage(1);
    fetchMembers(1, '');
  };

  const handleMemberSearch = (e) => {
    const val = e.target.value;
    setMemberSearch(val);
    setMembersPage(1);
    fetchMembers(1, val);
  };

  const handleMembersPageChange = (newPage) => {
    setMembersPage(newPage);
    fetchMembers(newPage, memberSearch);
  };

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/trainers`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch(`${API_URL}/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch(`${API_URL}/bookings/today/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTodayBookingsCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching today bookings:', error);
    }
  };

  const fetchTodayBookingsDetails = async (page = 1) => {
    setLoadingBookingsDetails(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page, limit: 10 });
      const response = await fetch(`${API_URL}/bookings/today/details?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTodayBookingsDetails(data.bookings || []);
        setBookingsPage(data.currentPage || 1);
        setBookingsTotalPages(data.pages || 1);
        setBookingsCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching today bookings details:', error);
    } finally {
      setLoadingBookingsDetails(false);
    }
  };

  const handleBookingsCardClick = () => {
    setShowBookingsModal(true);
    setBookingsPage(1);
    fetchTodayBookingsDetails(1);
  };

  const handleBookingsPageChange = (newPage) => {
    setBookingsPage(newPage);
    fetchTodayBookingsDetails(newPage);
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
      const response = await fetch(`${API_URL}/auth/register-trainer`, {
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
    { day: 'Sun', members: 185 },
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
          <div
            onClick={handleOpenMembersModal}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <StatCard
              title="Active Members"
              value={memberCount === null ? '...' : memberCount.toString()}
              icon={Users}
              trend={{ value: 'Total registered', isPositive: true }}
              accentColor="green"
            />
          </div>
          <div
            onClick={handleOpenRevenueModal}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <StatCard
              title="Today's Revenue"
              value={todayRevenue === null ? '...' : `LKR ${todayRevenue.toLocaleString('en-LK')}`}
              icon={DollarSign}
              trend={{ value: 'Captured today · click to view', isPositive: true }}
              accentColor="blue"
            />
          </div>
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

          {/* Alerts — pending payments awaiting acceptance */}
          <div className="space-y-6">
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Alerts</h3>
                </div>
                {(alerts.length + pendingPayments.length) > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">
                    {alerts.length + pendingPayments.length}
                  </span>
                )}
              </div>

              {loadingAlerts ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-neutral-700/50 animate-pulse" />)}
                </div>
              ) : (alerts.length + pendingPayments.length) === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">No alerts at this time</p>
                  <p className="text-neutral-500 text-xs mt-1">Pending payments and capacity alerts will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Pending payments — actionable alerts */}
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <BadgeDollarSign className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">
                            New payment from <span className="text-emerald-300">{payment.user?.name || 'Unknown'}</span>
                          </p>
                          <p className="text-neutral-400 text-xs mt-0.5">
                            LKR {payment.amount?.toLocaleString()} · {payment.membershipId?.plan ? `${payment.membershipId.plan} plan` : 'General'} · {new Date(payment.createdAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAcceptPayment(payment._id)}
                          disabled={acceptingId === payment._id}
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                     bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold
                                     transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acceptingId === payment._id ? (
                            <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          {acceptingId === payment._id ? 'Accepting...' : 'Accept'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* System alerts (occupancy etc.) */}
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
                        <AlertCircle className={`w-4 h-4 mt-0.5 ${alert.type === 'warning' ? 'text-orange-400' : 'text-blue-400'}`} />
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

        {/* Daily Payments Summary */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Daily Payments Summary</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-700 text-neutral-400 text-sm">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Transactions</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {dailySummaryLoading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-neutral-400">Loading summary...</td>
                  </tr>
                ) : dailySummary.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-neutral-500">No payment data available</td>
                  </tr>
                ) : (
                  dailySummary.map((day) => (
                    <tr key={day.date} className="hover:bg-neutral-700/20 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{day.date}</td>
                      <td className="py-3 px-4 text-neutral-300">
                        <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {day.transactionCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-medium text-right">
                        LKR {day.totalRevenue.toLocaleString('en-LK')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenHistoricalModal(day.date)}
                          className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-lg transition"
                        >
                          View Transactions
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {dailySummaryTotalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-700/50">
              <p className="text-neutral-500 text-sm">Page {dailySummaryPage} of {dailySummaryTotalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDailySummaryPageChange(dailySummaryPage - 1)}
                  disabled={dailySummaryPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => handleDailySummaryPageChange(dailySummaryPage + 1)}
                  disabled={dailySummaryPage === dailySummaryTotalPages}
                  className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
                    Total: {bookingsCount} bookings
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
              ) : todayBookingsDetails && todayBookingsDetails.length > 0 ? (
                <div className="space-y-4">
                  {todayBookingsDetails.map((booking) => (
                    <div key={booking._id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">{booking.user?.name || 'Unknown'}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {booking.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {booking.user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {booking.user?.email || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 md:items-end">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                          <Clock className="w-4 h-4 text-orange-600" />
                          {booking.timeSlot}
                        </div>
                        {booking.type === 'trainer' && booking.trainer ? (
                          <div className="flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                            <User className="w-3.5 h-3.5" />
                            <span>Trainer: {booking.trainer.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>General Workout</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {bookingsTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                      <p className="text-gray-500 text-sm">
                        Page {bookingsPage} of {bookingsTotalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBookingsPageChange(bookingsPage - 1)}
                          disabled={bookingsPage === 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        
                        <div className="flex gap-1">
                          {Array.from({ length: bookingsTotalPages }, (_, i) => i + 1)
                            .filter(n => n === 1 || n === bookingsTotalPages || Math.abs(n - bookingsPage) <= 1)
                            .reduce((acc, n, idx, arr) => {
                              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                              acc.push(n);
                              return acc;
                            }, [])
                            .map((n, i) =>
                              n === '...' ? (
                                <span key={`dot-${i}`} className="px-2 py-1.5 text-gray-500 text-sm">…</span>
                              ) : (
                                <button
                                  key={n}
                                  onClick={() => handleBookingsPageChange(n)}
                                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                                    bookingsPage === n
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {n}
                                </button>
                              )
                            )}
                        </div>

                        <button
                          onClick={() => handleBookingsPageChange(bookingsPage + 1)}
                          disabled={bookingsPage === bookingsTotalPages}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings today</p>
                </div>
              )}
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load bookings details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Revenue Modal ─────────────────────────────── */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  Today's Revenue
                </h2>
                <p className="text-neutral-400 text-sm mt-0.5">
                  {revenueCount} captured payment{revenueCount !== 1 ? 's' : ''} ·
                  Total: <span className="text-white font-semibold">LKR {revenueTotal.toLocaleString('en-LK')}</span>
                </p>
              </div>
              <button onClick={() => setShowRevenueModal(false)} className="text-neutral-400 hover:text-white transition p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {revenueLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-neutral-800 animate-pulse" />)}
                </div>
              ) : revenuePayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <DollarSign className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No captured payments today yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {revenuePayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/60
                                 border border-neutral-700/50 hover:border-neutral-600 transition"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30
                                      border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 font-bold text-sm">
                          {payment.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{payment.user?.name || '—'}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-neutral-400 text-xs">
                            <Mail className="w-3 h-3" />{payment.user?.email}
                          </span>
                          {payment.membershipId?.plan && (
                            <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                              {payment.membershipId.plan} plan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount + time */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-emerald-400 font-bold text-sm">LKR {payment.amount?.toLocaleString('en-LK')}</p>
                        <p className="text-neutral-500 text-xs mt-0.5">
                          {new Date(payment.capturedAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer total */}
            {revenuePayments.length > 0 && (
              <div className="px-6 py-4 border-t border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Total today</span>
                <span className="text-white font-bold text-lg">LKR {revenueTotal.toLocaleString('en-LK')}</span>
              </div>
            )}

            {/* Pagination */}
            {revenueTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800">
                <p className="text-neutral-500 text-sm">
                  Page {revenuePage} of {revenueTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRevenuePageChange(revenuePage - 1)}
                    disabled={revenuePage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: revenueTotalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === revenueTotalPages || Math.abs(n - revenuePage) <= 1)
                      .reduce((acc, n, idx, arr) => {
                        if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === '...' ? (
                          <span key={`dot-${i}`} className="px-2 py-1.5 text-neutral-500 text-sm">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => handleRevenuePageChange(n)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition
                              ${revenuePage === n
                                ? 'bg-emerald-500 text-black'
                                : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700'
                              }`}
                          >
                            {n}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    onClick={() => handleRevenuePageChange(revenuePage + 1)}
                    disabled={revenuePage === revenueTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Historical Payments Modal ─────────────────────────────── */}
      {showHistoricalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Payments for {historicalDate}
                </h2>
                <p className="text-neutral-400 text-sm mt-0.5">
                  {historicalCount} transaction{historicalCount !== 1 ? 's' : ''} ·
                  Total: <span className="text-white font-semibold">LKR {historicalTotal.toLocaleString('en-LK')}</span>
                </p>
              </div>
              <button onClick={() => setShowHistoricalModal(false)} className="text-neutral-400 hover:text-white transition p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {historicalLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-neutral-800 animate-pulse" />)}
                </div>
              ) : historicalPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <DollarSign className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No transactions found for this date</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historicalPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/60
                                 border border-neutral-700/50 hover:border-neutral-600 transition"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-600/30
                                      border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 font-bold text-sm">
                          {payment.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{payment.user?.name || '—'}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-neutral-400 text-xs">
                            <Mail className="w-3 h-3" />{payment.user?.email}
                          </span>
                          {payment.membershipId?.plan && (
                            <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                              {payment.membershipId.plan} plan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount + time */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-emerald-400 font-bold text-sm">LKR {payment.amount?.toLocaleString('en-LK')}</p>
                        <p className="text-neutral-500 text-xs mt-0.5">
                          {new Date(payment.capturedAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer total */}
            {historicalPayments.length > 0 && (
              <div className="px-6 py-4 border-t border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Total for {historicalDate}</span>
                <span className="text-white font-bold text-lg">LKR {historicalTotal.toLocaleString('en-LK')}</span>
              </div>
            )}

            {/* Pagination */}
            {historicalTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800">
                <p className="text-neutral-500 text-sm">
                  Page {historicalPage} of {historicalTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHistoricalPageChange(historicalPage - 1)}
                    disabled={historicalPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: historicalTotalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === historicalTotalPages || Math.abs(n - historicalPage) <= 1)
                      .reduce((acc, n, idx, arr) => {
                        if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === '...' ? (
                          <span key={`dot-${i}`} className="px-2 py-1.5 text-neutral-500 text-sm">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => handleHistoricalPageChange(n)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition
                              ${historicalPage === n
                                ? 'bg-emerald-500 text-black'
                                : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700'
                              }`}
                          >
                            {n}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    onClick={() => handleHistoricalPageChange(historicalPage + 1)}
                    disabled={historicalPage === historicalTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Members Modal ───────────────────────────────── */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Registered Members
                </h2>
                <p className="text-neutral-400 text-sm mt-0.5">
                  {membersTotal} member{membersTotal !== 1 ? 's' : ''} total
                </p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-neutral-400 hover:text-white transition p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={memberSearch}
                  onChange={handleMemberSearch}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700
                             rounded-xl text-white placeholder-neutral-500 text-sm
                             focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {membersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-neutral-800 animate-pulse" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <Users className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">
                    {memberSearch ? `No members found for "${memberSearch}"` : 'No members registered yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member, idx) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/60
                                 border border-neutral-700/50 hover:border-neutral-600 transition"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-green-600/30
                                      border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 font-bold text-sm">
                          {member.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{member.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-neutral-400 text-xs">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1 text-neutral-400 text-xs">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Registered date */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-neutral-500 text-[10px] uppercase tracking-wider mb-0.5">Registered</p>
                        <p className="text-neutral-300 text-xs font-medium">
                          {new Date(member.createdAt).toLocaleDateString('en-LK', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {membersTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800">
                <p className="text-neutral-500 text-sm">
                  Page {membersPage} of {membersTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMembersPageChange(membersPage - 1)}
                    disabled={membersPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  {/* Page number pills */}
                  <div className="flex gap-1">
                    {Array.from({ length: membersTotalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === membersTotalPages || Math.abs(n - membersPage) <= 1)
                      .reduce((acc, n, idx, arr) => {
                        if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === '...' ? (
                          <span key={`dot-${i}`} className="px-2 py-1.5 text-neutral-500 text-sm">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => handleMembersPageChange(n)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition
                              ${membersPage === n
                                ? 'bg-emerald-500 text-black'
                                : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700'
                              }`}
                          >
                            {n}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    onClick={() => handleMembersPageChange(membersPage + 1)}
                    disabled={membersPage === membersTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


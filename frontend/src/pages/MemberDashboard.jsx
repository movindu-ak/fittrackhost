import { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, UserCircle, Dumbbell, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { CrowdLevel } from '../components/CrowdLevel';
import { StatCard } from '../components/StatCard';

export function MemberDashboard() {
  const navigate = useNavigate();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [allUpcomingBookings, setAllUpcomingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [monthlyWorkouts, setMonthlyWorkouts] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  useEffect(() => {
    fetchBookings();
    fetchUserProfile();
    
    // Load user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembership(data.membershipId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const now = new Date();
        
        // Calculate monthly workouts count
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthlyCount = data.filter(booking => {
          const bookingDate = new Date(booking.date);
          return bookingDate.getMonth() === currentMonth &&
                 bookingDate.getFullYear() === currentYear &&
                 (booking.status === 'confirmed' || booking.status === 'completed');
        }).length;
        setMonthlyWorkouts(monthlyCount);
        
        // Calculate streak days (only for completed workouts without trainers)
        const completedWorkouts = data
          .filter(booking => booking.status === 'completed' && !booking.trainer)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        if (completedWorkouts.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Get unique dates
          const uniqueDates = [...new Set(completedWorkouts.map(b => {
            const d = new Date(b.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          }))].sort((a, b) => b - a).map(t => new Date(t));
          
          // Check if workout was done today or yesterday to start streak
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          let currentCheckDate = today;
          let foundRecent = false;
          
          // Check if there's a workout today or yesterday
          for (const workoutDate of uniqueDates) {
            if (workoutDate.getTime() === today.getTime() || workoutDate.getTime() === yesterday.getTime()) {
              foundRecent = true;
              break;
            }
          }
          
          if (foundRecent) {
            // Calculate consecutive days
            for (const workoutDate of uniqueDates) {
              if (workoutDate.getTime() === currentCheckDate.getTime() ||
                  workoutDate.getTime() === new Date(currentCheckDate.getTime() - 86400000).getTime()) {
                streak++;
                currentCheckDate = new Date(workoutDate);
                currentCheckDate.setDate(currentCheckDate.getDate() - 1);
              } else {
                break;
              }
            }
          }
        }
        setStreakDays(streak);
        
        // Filter for upcoming bookings (future dates or recent cancelled ones)
        const upcoming = data
          .filter(booking => {
            const bookingDate = new Date(booking.date);
            // Show upcoming bookings or recently cancelled ones
            return (bookingDate >= now && booking.status !== 'completed') || 
                   (booking.status === 'cancelled' && bookingDate >= now);
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Store all upcoming bookings
        setAllUpcomingBookings(upcoming);
        
        // Set paginated bookings for current page
        const startIndex = (currentPage - 1) * bookingsPerPage;
        const endIndex = startIndex + bookingsPerPage;
        setUpcomingBookings(upcoming.slice(startIndex, endIndex));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCancelBooking = async (bookingId, hasTrainer) => {
    let cancelReason = '';
    
    if (hasTrainer) {
      // Require cancellation reason for trainer bookings
      cancelReason = prompt('Please provide a reason for cancellation (minimum 10 characters):');
      
      if (cancelReason === null) {
        return; // User clicked cancel
      }
      
      if (!cancelReason || cancelReason.trim().length < 10) {
        alert('Cancellation reason must be at least 10 characters');
        return;
      }
    } else {
      // Simple confirmation for non-trainer bookings
      if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fittrackhost.onrender.com/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancelReason })
      });
      
      if (response.ok) {
        // Refresh bookings after cancellation
        fetchBookings();
        alert('Booking cancelled successfully');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!confirm('Mark this workout as completed?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fittrackhost.onrender.com/api/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Refresh bookings after completion
        fetchBookings();
        alert('Workout completed! Great job! 💪');
      } else {
        alert('Failed to mark booking as completed');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Error completing booking');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasBookingTimePassed = (bookingDate, timeSlot) => {
    const now = new Date();
    const booking = new Date(bookingDate);
    
    // Extract end time from timeSlot (e.g., "09:00 AM - 11:00 AM")
    const timeMatch = timeSlot.match(/- (\d{1,2}):(\d{2}) (AM|PM)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3];
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      booking.setHours(hours, minutes, 0, 0);
    }
    
    return now >= booking;
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      processing: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      confirmed: 'bg-green-500/20 text-green-400 border border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    };

    const statusLabels = {
      processing: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      completed: 'Completed'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.processing}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  // Get next session info
  const getNextSession = () => {
    if (allUpcomingBookings.length === 0) {
      return 'No bookings';
    }

    const nextBooking = allUpcomingBookings[0];
    const bookingDate = new Date(nextBooking.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (bookingDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      const diffTime = bookingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `In ${diffDays} days`;
    }
  };

  // Pagination handlers
  const totalPages = Math.ceil(allUpcomingBookings.length / bookingsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    const startIndex = (pageNumber - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    setUpcomingBookings(allUpcomingBookings.slice(startIndex, endIndex));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Update pagination when bookings change
  useEffect(() => {
    if (allUpcomingBookings.length > 0) {
      const startIndex = (currentPage - 1) * bookingsPerPage;
      const endIndex = startIndex + bookingsPerPage;
      setUpcomingBookings(allUpcomingBookings.slice(startIndex, endIndex));
    }
  }, [allUpcomingBookings, currentPage]);

  return (
    <div className="min-h-screen">
      <Navigation currentPage="member-dashboard" role="member" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user?.name || 'Member'}!
          </h1>
          <p className="text-neutral-400">Here's your fitness overview for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Workouts This Month"
            value={loadingBookings ? '...' : monthlyWorkouts.toString()}
            icon={Dumbbell}
            trend={{ value: '15%', isPositive: true }}
            accentColor="green"
          />
          <StatCard
            title="Active Membership"
            value={membership?.planName || 'No Plan'}
            icon={CreditCard}
            accentColor="blue"
          />
          <StatCard
            title="Next Session"
            value={loadingBookings ? 'Loading...' : getNextSession()}
            icon={Clock}
            accentColor="purple"
          />
          <StatCard
            title="Streak Days"
            value={loadingBookings ? '...' : streakDays.toString()}
            icon={TrendingUp}
            trend={streakDays > 0 ? { value: `${streakDays} days`, isPositive: true } : undefined}
            accentColor="orange"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Crowd Status */}
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Live Gym Status</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Live</span>
                </div>
              </div>
              <CrowdLevel level="low" percentage={35} />
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
                  {allUpcomingBookings.length > 0 && (
                    <p className="text-sm text-neutral-400 mt-1">
                      Total: {allUpcomingBookings.length} {allUpcomingBookings.length === 1 ? 'session' : 'sessions'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/booking')}
                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                >
                  Book New
                </button>
              </div>

              {loadingBookings ? (
                <div className="text-center py-8">
                  <p className="text-neutral-400">Loading bookings...</p>
                </div>
              ) : allUpcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 mb-4">No upcoming bookings</p>
                  <button
                    onClick={() => navigate('/booking')}
                    className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Book Your First Session
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 hover:border-green-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="w-4 h-4 text-green-400" />
                              <span className="text-white font-medium">
                                {booking.type === 'trainer' ? 'Personal Training' : 'Workout Slot'}
                              </span>
                            </div>
                            <p className="text-neutral-400 text-sm mb-1">
                              {formatDate(booking.date)}
                            </p>
                            <p className="text-neutral-300 text-sm">{booking.timeSlot}</p>
                            {booking.trainer && (
                              <p className="text-green-400 text-sm mt-2">
                                with {booking.trainer.name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(booking.status)}
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                              <>
                                <button 
                                  onClick={() => handleCancelBooking(booking._id, booking.trainer ? true : false)}
                                  className="text-red-400 hover:text-red-300 text-sm mt-2"
                                >
                                  Cancel
                                </button>
                                {!booking.trainer && booking.status === 'confirmed' && (
                                  <button 
                                    onClick={() => handleCompleteBooking(booking._id)}
                                    disabled={!hasBookingTimePassed(booking.date, booking.timeSlot)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                      hasBookingTimePassed(booking.date, booking.timeSlot)
                                        ? 'bg-green-500 hover:bg-green-600 text-black cursor-pointer'
                                        : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                                    }`}
                                    title={!hasBookingTimePassed(booking.date, booking.timeSlot) ? 'Available after workout time ends' : 'Mark as complete'}
                                  >
                                    Complete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {booking.status === 'processing' && booking.trainer && (
                          <div className="mt-3 pt-3 border-t border-neutral-700">
                            <p className="text-yellow-400 text-xs flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Waiting for trainer confirmation
                            </p>
                          </div>
                        )}
                        {booking.status === 'cancelled' && booking.cancelReason && (
                          <div className="mt-3 pt-3 border-t border-red-500/30">
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                              <p className="text-red-400 text-xs font-semibold mb-1">
                                Cancellation Reason:
                              </p>
                              <p className="text-neutral-300 text-sm">
                                {booking.cancelReason}
                              </p>
                              {booking.cancelledBy && (
                                <p className="text-neutral-500 text-xs mt-2">
                                  Cancelled by {booking.cancelledBy}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-neutral-700 pt-4">
                      <div className="text-sm text-neutral-400">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all ${
                            currentPage === 1
                              ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                              : 'bg-neutral-700 text-white hover:bg-neutral-600'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>
                        
                        <div className="flex space-x-1">
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Show first page, last page, current page, and pages around current
                            if (
                              pageNumber === 1 ||
                              pageNumber === totalPages ||
                              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => goToPage(pageNumber)}
                                  className={`px-3 py-2 rounded-lg font-medium transition-all ${
                                    currentPage === pageNumber
                                      ? 'bg-green-500 text-black'
                                      : 'bg-neutral-700 text-white hover:bg-neutral-600'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            } else if (
                              pageNumber === currentPage - 2 ||
                              pageNumber === currentPage + 2
                            ) {
                              return (
                                <span key={pageNumber} className="px-2 py-2 text-neutral-500">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all ${
                            currentPage === totalPages
                              ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                              : 'bg-neutral-700 text-white hover:bg-neutral-600'
                          }`}
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg shadow-green-500/20">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-green-100 text-sm mb-1">Membership</p>
                  <h3 className="text-2xl font-bold">Premium</h3>
                </div>
                <UserCircle className="w-12 h-12 text-green-100" />
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-green-100">Member ID</span>
                  <span className="font-semibold">#FT-2024-1847</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-100">Valid Until</span>
                  <span className="font-semibold">Dec 31, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-100">Plan Type</span>
                  <span className="font-semibold">Annual</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/membership')}
                className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg font-medium transition-all backdrop-blur-sm"
              >
                Manage Membership
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/booking')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Workout Slot</span>
                </button>

                <button className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2">
                  <Dumbbell className="w-4 h-4" />
                  <span>Hire Trainer</span>
                </button>

                <button
                  onClick={() => navigate('/membership')}
                  className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>View Payments</span>
                </button>
              </div>
            </div>

            {/* Workout Streak */}
            <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/5 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Current Streak</p>
                  <p className="text-white text-2xl font-bold">{loadingBookings ? '...' : `${streakDays} Days`}</p>
                </div>
              </div>
              <p className="text-neutral-400 text-sm">
                {streakDays > 0 ? "Keep it up! You're on fire 🔥" : "Complete a workout to start your streak!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

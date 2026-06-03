import { useNavigate } from 'react-router-dom';
import { Dumbbell, LogOut, Calendar, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useEffect, useState } from 'react';

export const TrainerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [bookings, setBookings] = useState([]);
  const [bookingSummary, setBookingSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainerBookings();
    fetchBookingSummary();
  }, []);

  const fetchTrainerBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/bookings/trainer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/bookings/trainer/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookingSummary(data);
      }
    } catch (error) {
      console.error('Error fetching booking summary:', error);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fittrackhost.onrender.com/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchTrainerBookings();
        fetchBookingSummary();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fittrackhost.onrender.com/api/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTrainerBookings();
        fetchBookingSummary();
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    // Prompt for cancellation reason
    const cancelReason = prompt('Please provide a reason for cancellation (minimum 10 characters):');

    if (cancelReason === null) {
      // User clicked cancel
      return;
    }

    if (!cancelReason || cancelReason.trim().length < 10) {
      alert('Cancellation reason must be at least 10 characters long.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fittrackhost.onrender.com/api/bookings/${bookingId}/trainer-cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cancelReason: cancelReason.trim() })
      });

      if (response.ok) {
        fetchTrainerBookings();
        fetchBookingSummary();
        alert('Booking cancelled successfully.');
      } else {
        const error = await response.json();
        alert(`Failed to cancel booking: ${error.message}`);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('An error occurred while cancelling the booking.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'processing': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Filter bookings by status
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today && (b.status === 'confirmed' || b.status === 'processing');
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate < today || b.status !== 'confirmed';
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-neutral-800">
      {/* Header */}
      <header className="bg-neutral-800/50 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FitTrack</h1>
                <p className="text-sm text-gray-400">Trainer Dashboard</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="secondary">
              <LogOut className="h-4 w-4 mr-2 inline" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-400">
            Manage your training sessions and track your client progress
          </p>
        </div>

        {/* Booking Summary Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <Users className="h-6 w-6 mr-2 text-green-400" />
              Timeslot Capacity Overview
            </h3>
          </div>

          {bookingSummary.length === 0 ? (
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No upcoming bookings to display</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookingSummary.map((daySummary) => (
                <div
                  key={daySummary.date}
                  className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6"
                >
                  <h4 className="text-lg font-semibold text-white mb-4">
                    📅 {new Date(daySummary.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySummary.slots.map((slot) => (
                      <div
                        key={slot.timeSlot}
                        className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-purple-400" />
                            <span className="text-white font-medium text-sm">{slot.timeSlot}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${slot.count >= 5
                            ? 'bg-red-500/20 text-red-400'
                            : slot.count >= 3
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                            }`}>
                            {slot.count}/{slot.capacity}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="w-full bg-neutral-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${slot.count >= 5
                                ? 'bg-red-500'
                                : slot.count >= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                }`}
                              style={{ width: `${(slot.count / slot.capacity) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 font-medium mb-1">Members:</p>
                          {slot.members.map((member, idx) => (
                            <div key={member.id} className="flex items-center text-xs text-gray-300">
                              <span className="w-4 text-gray-500">{idx + 1}.</span>
                              <span className="truncate">{member.name}</span>
                              <span className={`ml-auto px-2 py-0.5 rounded text-xs ${member.status === 'confirmed'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {member.status === 'confirmed' ? '✓' : '⏳'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {slot.count < slot.capacity && (
                          <p className="text-xs text-gray-500 mt-2">
                            {slot.capacity - slot.count} spot{slot.capacity - slot.count !== 1 ? 's' : ''} available
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <Clock className="h-6 w-6 mr-2 text-yellow-400" />
              Upcoming Sessions
            </h3>
            <span className="text-gray-400 text-sm">
              {upcomingBookings.length} session{upcomingBookings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-2xl p-8 text-center">
              <p className="text-gray-400">Loading bookings...</p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-2xl p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:border-neutral-600 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {booking.user?.name || 'Unknown User'}
                          </h4>
                          <p className="text-gray-400 text-sm">{booking.user?.email}</p>
                          {booking.user?.phone && (
                            <p className="text-gray-400 text-sm">📱 {booking.user.phone}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                          {formatDate(booking.date)}
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Clock className="h-4 w-4 mr-2 text-purple-400" />
                          {booking.timeSlot}
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Dumbbell className="h-4 w-4 mr-2 text-green-400" />
                          {booking.type === 'trainer' ? 'Personal Training' : 'Workout Session'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {booking.status === 'processing' && (
                        <>
                          <Button
                            onClick={() => handleConfirmBooking(booking._id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm
                          </Button>
                          <Button
                            onClick={() => handleCancelBooking(booking._id)}
                            variant="secondary"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <>
                          <Button
                            onClick={() => updateBookingStatus(booking._id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                          <Button
                            onClick={() => handleCancelBooking(booking._id)}
                            variant="secondary"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-gray-400" />
              Session History
            </h3>
            <span className="text-gray-400 text-sm">
              {pastBookings.length} session{pastBookings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {pastBookings.length === 0 ? (
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No past sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastBookings.slice(0, 10).map((booking) => (
                <div
                  key={booking._id}
                  className="bg-neutral-800/30 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-4 opacity-75"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-medium text-white">
                          {booking.user?.name || 'Unknown User'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>📅 {formatDate(booking.date)}</span>
                        <span>🕐 {booking.timeSlot}</span>
                        <span>{booking.type === 'trainer' ? '💪 Personal Training' : '🏋️ Workout'}</span>
                      </div>
                      {booking.status === 'cancelled' && booking.cancelReason && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs">
                          <span className="text-red-400 font-medium">Cancellation Reason: </span>
                          <span className="text-gray-300">{booking.cancelReason}</span>
                          {booking.cancelledBy && (
                            <span className="text-gray-500 ml-2">(by {booking.cancelledBy})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pastBookings.length > 10 && (
                <p className="text-center text-gray-500 text-sm py-2">
                  Showing 10 of {pastBookings.length} sessions
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

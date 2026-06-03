import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Check, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import API_URL from '../config.js';

export function BookingPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingType, setBookingType] = useState('workout');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [trainerAvailability, setTrainerAvailability] = useState({});
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);

  // Check for active membership on mount
  useEffect(() => {
    const checkMembership = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/memberships/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // active membership that is paid and not expired
          if (
            data.active &&
            data.active.paymentStatus === 'paid' &&
            new Date(data.active.endDate) >= new Date()
          ) {
            setMembership(data.active);
          }
        }
      } catch (err) {
        console.error('Membership check failed:', err);
      } finally {
        setMembershipLoading(false);
      }
    };
    checkMembership();
  }, []);

  useEffect(() => {
    if (bookingType === 'trainer') {
      fetchTrainers();
    }
  }, [bookingType]);

  useEffect(() => {
    if (bookingType === 'trainer' && selectedTrainer && selectedSlots.length > 0) {
      checkTrainerAvailability();
    }
  }, [selectedTrainer, selectedSlots, selectedDate, bookingType]);

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

  const checkTrainerAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const availabilityData = {};

      for (const timeSlot of selectedSlots) {
        const response = await fetch(
          `https://fittrackhost.onrender.com/api/bookings/trainer/${selectedTrainer}/availability?date=${selectedDate.toISOString()}&timeSlot=${encodeURIComponent(timeSlot)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          availabilityData[timeSlot] = data;
        }
      }

      setTrainerAvailability(availabilityData);
    } catch (error) {
      console.error('Error checking trainer availability:', error);
    }
  };

  const timeSlots = [
    { time: '6:00 AM - 7:30 AM', available: 15, total: 20, crowd: 'low' },
    { time: '8:00 AM - 9:30 AM', available: 5, total: 20, crowd: 'high' },
    { time: '10:00 AM - 11:30 AM', available: 12, total: 20, crowd: 'medium' },
    { time: '12:00 PM - 1:30 PM', available: 18, total: 20, crowd: 'low' },
    { time: '2:00 PM - 3:30 PM', available: 16, total: 20, crowd: 'low' },
    { time: '4:00 PM - 5:30 PM', available: 8, total: 20, crowd: 'medium' },
    { time: '6:00 PM - 7:30 PM', available: 2, total: 20, crowd: 'high' },
    { time: '8:00 PM - 9:30 PM', available: 10, total: 20, crowd: 'medium' },
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));

    return days;
  };

  const isTimeSlotPassed = (timeSlot) => {
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);

    // Only check for today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj.getTime() !== today.getTime()) {
      return false; // Not today, so time slot is not passed
    }

    // Extract end time from timeSlot (e.g., "6:00 AM - 7:30 AM")
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

      const slotEndTime = new Date();
      slotEndTime.setHours(hours, minutes, 0, 0);

      return now >= slotEndTime;
    }

    return false;
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    // Check if any trainer slots are fully booked
    if (bookingType === 'trainer' && selectedTrainer) {
      for (const slot of selectedSlots) {
        if (trainerAvailability[slot] && !trainerAvailability[slot].available) {
          alert(`Cannot book: The selected trainer is fully booked (5/5) for ${slot}. Please select a different timeslot or trainer.`);
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem('token');

      // Create multiple bookings for each selected slot
      const bookingPromises = selectedSlots.map(async (timeSlot) => {
        const bookingData = {
          type: bookingType,
          date: selectedDate,
          timeSlot
        };

        // Add trainer ID if it's a trainer booking
        if (bookingType === 'trainer' && selectedTrainer) {
          bookingData.trainer = selectedTrainer;
        }

        const response = await fetch('https://fittrackhost.onrender.com/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        return await response.json();
      });

      await Promise.all(bookingPromises);

      const trainerName = trainers.find(t => t._id === selectedTrainer)?.name;
      alert(
        `${selectedSlots.length} booking(s) confirmed! ${bookingType === 'trainer' && trainerName
          ? `with ${trainerName}`
          : ''
        }\n\nRedirecting to your dashboard...`
      );

      // Redirect to dashboard after successful booking
      setTimeout(() => {
        navigate('/member-dashboard');
      }, 500);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`Booking failed: ${error.message}`);
    }
  };

  const days = getDaysInMonth(selectedDate);
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ── Membership gate ───────────────────────────────────────
  if (membershipLoading) {
    return (
      <div className="min-h-screen">
        <Navigation currentPage="booking" role="member" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-neutral-400 animate-pulse">Checking membership...</p>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen">
        <Navigation currentPage="booking" role="member" />
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-md w-full text-center">
            {/* Lock icon */}
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping opacity-30" />
              <div className="w-24 h-24 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-red-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Membership Required</h2>
            <p className="text-neutral-400 mb-2">
              You need an <span className="text-green-400 font-semibold">active, paid membership</span> to book workout slots or personal trainer sessions.
            </p>
            <p className="text-neutral-500 text-sm mb-8">
              Purchase a plan to unlock full access to all bookings.
            </p>

            {/* Feature list */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-5 mb-6 text-left space-y-3">
              {[
                'Book up to 2 workout slots per day',
                'Hire personal trainers',
                'Track your workout streak',
                'Access all gym time slots',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feat}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/select-membership')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black
                         font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600
                         hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center
                         justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              View Membership Plans
            </button>

            <button
              onClick={() => navigate('/member-dashboard')}
              className="mt-3 w-full text-neutral-400 hover:text-white text-sm transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Navigation currentPage="booking" role="member" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Book Workout Slot</h1>

        {/* Booking Type */}
        <div className="inline-flex bg-neutral-800 rounded-xl p-2 mb-8">
          <button
            onClick={() => setBookingType('workout')}
            className={`px-6 py-2 rounded-lg ${bookingType === 'workout' ? 'bg-green-500 text-black' : 'text-neutral-400'
              }`}
          >
            Workout Slot
          </button>
          <button
            onClick={() => setBookingType('trainer')}
            className={`px-6 py-2 rounded-lg ${bookingType === 'trainer' ? 'bg-green-500 text-black' : 'text-neutral-400'
              }`}
          >
            Personal Trainer
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar and Time Slots */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-neutral-800 rounded-xl p-6">
              <div className="flex justify-between mb-6">
                <h2 className="text-xl text-white">{monthName}</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="text-white hover:text-green-400"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="text-white hover:text-green-400"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-neutral-400 text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (!day) return <div key={index} />;

                  // Check if day is in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dayDate = new Date(day);
                  dayDate.setHours(0, 0, 0, 0);
                  const isPast = dayDate < today;

                  return (
                    <button
                      key={index}
                      onClick={() => !isPast && setSelectedDate(day)}
                      disabled={isPast}
                      className={`p-2 rounded ${isPast
                        ? 'text-neutral-600 cursor-not-allowed opacity-50'
                        : day.getDate() === selectedDate.getDate() &&
                          day.getMonth() === selectedDate.getMonth()
                          ? 'bg-green-500 text-black font-semibold'
                          : 'text-white hover:bg-neutral-700'
                        }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-neutral-800 rounded-xl p-6">
              <h2 className="text-xl text-white mb-4">Available Time Slots</h2>
              {selectedSlots.length > 0 && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">
                    {selectedSlots.length} / 2 slot{selectedSlots.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {timeSlots.map((slot, index) => {
                  const isSelected = selectedSlots.includes(slot.time);
                  const isPassed = isTimeSlotPassed(slot.time);
                  const isDisabled = slot.available === 0 || isPassed;

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (isSelected) {
                          // Deselect the slot
                          setSelectedSlots(selectedSlots.filter(s => s !== slot.time));
                        } else {
                          // Check if maximum slots are already selected
                          if (selectedSlots.length >= 2) {
                            alert('Maximum 2 time slots can be selected');
                            return;
                          }
                          // Select the slot
                          setSelectedSlots([...selectedSlots, slot.time]);
                        }
                      }}
                      disabled={isDisabled}
                      className={`p-4 rounded-lg border text-left transition-all ${isSelected
                        ? 'bg-green-500/20 border-green-500'
                        : isDisabled
                          ? 'bg-neutral-900/50 border-neutral-700 opacity-50 cursor-not-allowed'
                          : 'bg-neutral-900 border-neutral-700 hover:border-neutral-600'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">{slot.time}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isPassed ? 'text-neutral-500' :
                          slot.crowd === 'low' ? 'text-green-400' :
                            slot.crowd === 'medium' ? 'text-yellow-400' :
                              'text-red-400'
                          }`}>
                          {isPassed ? '🔒 Passed' :
                            slot.crowd === 'low' ? '🟢 Low' :
                              slot.crowd === 'medium' ? '🟡 Medium' :
                                '🔴 High'} {!isPassed && 'crowd'}
                        </span>
                        <span className="text-neutral-400">
                          {slot.available}/{slot.total} spots
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trainer Selection or Summary */}
          {bookingType === 'trainer' ? (
            <div className="space-y-4">
              <div className="bg-neutral-900 rounded-xl p-6">
                <h3 className="text-lg text-white mb-4">Select Trainer</h3>
                {loadingTrainers ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-400">Loading trainers...</p>
                  </div>
                ) : trainers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-400">No trainers available</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {trainers.map((trainer) => (
                      <button
                        key={trainer._id}
                        onClick={() => setSelectedTrainer(trainer._id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedTrainer === trainer._id
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">👤</div>
                            <h4 className="text-white font-semibold">{trainer.name}</h4>
                          </div>
                          {selectedTrainer === trainer._id && (
                            <Check className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-neutral-900 rounded-xl p-6">
                <h3 className="text-lg text-white mb-4">Booking Summary</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Type:</span>
                    <span className="text-white">Personal Trainer</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Date:</span>
                    <span className="text-white">{selectedDate.toDateString()}</span>
                  </div>
                  {selectedSlots.length > 0 && (
                    <div className="text-sm">
                      <span className="text-neutral-400">Time Slots:</span>
                      <div className="mt-2 space-y-1">
                        {selectedSlots.map((slot, idx) => (
                          <div key={idx} className="bg-neutral-800 p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs">{slot}</span>
                              <button
                                onClick={() => setSelectedSlots(selectedSlots.filter(s => s !== slot))}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            {selectedTrainer && trainerAvailability[slot] && (
                              <div className={`mt-1 text-xs ${trainerAvailability[slot].available
                                ? 'text-green-400'
                                : 'text-red-400'
                                }`}>
                                {trainerAvailability[slot].available
                                  ? `✓ ${trainerAvailability[slot].spotsRemaining} of 5 spots available`
                                  : '✗ Fully booked (5/5)'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTrainer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Trainer:</span>
                      <span className="text-white">
                        {trainers.find(t => t._id === selectedTrainer)?.name}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBooking}
                  disabled={selectedSlots.length === 0 || !selectedTrainer}
                  className="w-full py-3 bg-green-500 text-black rounded-lg font-semibold disabled:bg-neutral-700 disabled:text-neutral-500"
                >
                  Confirm {selectedSlots.length} Booking{selectedSlots.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-xl p-6">
              <h3 className="text-lg text-white mb-4">Booking Summary</h3>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Type:</span>
                  <span className="text-white">{bookingType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Date:</span>
                  <span className="text-white">{selectedDate.toDateString()}</span>
                </div>
                {selectedSlots.length > 0 && (
                  <div className="text-sm">
                    <span className="text-neutral-400">Time Slots:</span>
                    <div className="mt-2 space-y-1">
                      {selectedSlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-neutral-800 p-2 rounded">
                          <span className="text-white text-xs">{slot}</span>
                          <button
                            onClick={() => setSelectedSlots(selectedSlots.filter(s => s !== slot))}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleBooking}
                disabled={selectedSlots.length === 0}
                className="w-full py-3 bg-green-500 text-black rounded-lg font-semibold disabled:bg-neutral-700 disabled:text-neutral-500"
              >
                Confirm {selectedSlots.length} Booking{selectedSlots.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Check, CreditCard, ArrowLeft } from 'lucide-react';

export const MembershipPlanSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData;
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5000,
      duration: 'Monthly',
      features: [
        'Access to gym equipment',
        'Locker facility',
        'Basic workout guidance',
        'Valid for 1 month'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 12000,
      duration: '3 Months',
      popular: true,
      features: [
        'All Basic features',
        '2 personal training sessions',
        'Diet consultation',
        'Valid for 3 months',
        'Priority booking'
      ]
    },
    {
      id: 'platinum',
      name: 'Platinum',
      price: 40000,
      duration: 'Annual',
      features: [
        'All Premium features',
        'Unlimited personal training',
        'Advanced analytics',
        'Valid for 12 months',
        'Guest passes (2 per month)',
        'Exclusive member events'
      ]
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

const handleProceedToPayment = async () => {
  if (!selectedPlan) return;
  setLoading(true);

  try {
    const token = localStorage.getItem('token');

    // Calculate dates based on plan duration
    const startDate = new Date();
    const endDate   = new Date();

    if (selectedPlan.id === 'basic') {
      endDate.setMonth(endDate.getMonth() + 1);       // 1 month
    } else if (selectedPlan.id === 'premium') {
      endDate.setMonth(endDate.getMonth() + 3);       // 3 months
    } else if (selectedPlan.id === 'platinum') {
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year
    }

    const res = await fetch(
      'https://fittrackhost.onrender.com/api/memberships',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan:      selectedPlan.id,
          price:     selectedPlan.price,
          startDate: startDate.toISOString(),   // ✅ ADD
          endDate:   endDate.toISOString()      // ✅ ADD
        })
      }
    );

    const membership = await res.json();

    if (!res.ok) {
      throw new Error(membership.message || 'Failed to create membership');
    }

    navigate('/payment', {
      state: {
        membershipId: membership._id,
        plan:         selectedPlan.name,
        amount:       selectedPlan.price
      }
    });

  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Something went wrong. Please try again.');
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
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470"
          alt="Gym background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/40 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Sign Up</span>
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
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your
            <span className="block bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Membership Plan
            </span>
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg">
            Select the perfect plan to start your fitness journey
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              className={`relative bg-neutral-900/80 backdrop-blur-lg border rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 ${
                selectedPlan?.id === plan.id
                  ? 'border-green-500 shadow-lg shadow-green-500/20 scale-105'
                  : 'border-neutral-800 hover:border-neutral-700'
              } ${plan.popular ? 'md:scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {selectedPlan?.id === plan.id && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-1">
                  <span className="text-4xl font-bold text-white">LKR {plan.price.toLocaleString()}</span>
                </div>
                <p className="text-neutral-400 text-sm">{plan.duration}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-neutral-300">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan);
                }}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Proceed Button */}
       {selectedPlan && (
  <div className="flex justify-center">
    <button
      onClick={handleProceedToPayment}
      disabled={loading}
      className="bg-gradient-to-r from-green-500 to-emerald-500 text-black
                 px-8 py-4 rounded-xl font-semibold text-lg
                 hover:from-green-600 hover:to-emerald-600
                 hover:shadow-lg hover:shadow-green-500/30
                 transition-all flex items-center gap-2
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <CreditCard className="w-5 h-5" />
      {loading ? 'Creating membership...' : 'Proceed to Payment'}
    </button>
  </div>
)}
      </div>
    </div>
  );
};

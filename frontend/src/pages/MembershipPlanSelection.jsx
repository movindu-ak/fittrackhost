import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, Check, CreditCard, ArrowLeft,
  Zap, Clock, AlertTriangle, Loader2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-LK', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
};

// ── Radio option card ─────────────────────────────────────
function ActivationOption({ id, selected, onSelect, icon: Icon, accentColor, title, description }) {
  const colors = {
    green: {
      border: selected ? 'border-emerald-500' : 'border-neutral-700',
      bg: selected ? 'bg-emerald-500/10' : 'bg-neutral-800/60 hover:bg-neutral-800',
      radio: selected ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-500',
      icon: 'bg-emerald-500/20 text-emerald-400',
    },
    blue: {
      border: selected ? 'border-blue-500' : 'border-neutral-700',
      bg: selected ? 'bg-blue-500/10' : 'bg-neutral-800/60 hover:bg-neutral-800',
      radio: selected ? 'border-blue-500 bg-blue-500' : 'border-neutral-500',
      icon: 'bg-blue-500/20 text-blue-400',
    },
  };
  const c = colors[accentColor];

  return (
    <button
      type="button"
      id={`activation-${id}`}
      onClick={() => onSelect(id)}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${c.border} ${c.bg}`}
    >
      {/* Radio dot */}
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${c.radio}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${c.icon}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm mb-0.5">{title}</p>
        <p className="text-neutral-400 text-xs leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
export const MembershipPlanSelection = () => {
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan]       = useState(null);
  const [activationMode, setActivationMode]   = useState(null); // 'immediate' | 'after_expiry'
  const [loading, setLoading]                 = useState(false);
  const [statusLoading, setStatusLoading]     = useState(true);
  const [activeMembership, setActiveMembership] = useState(null);
  const [queuedMembership, setQueuedMembership] = useState(null);
  const [statusError, setStatusError]         = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5000,
      duration: 'Monthly · 1 month',
      features: [
        'Access to gym equipment',
        'Locker facility',
        'Basic workout guidance',
        'Valid for 1 month',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 12000,
      duration: '6 Months',
      popular: true,
      features: [
        'All Basic features',
        '2 personal training sessions',
        'Diet consultation',
        'Valid for 6 months',
        'Priority booking',
      ],
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 40000,
      duration: 'Annual · 12 months',
      features: [
        'All Premium features',
        'Unlimited personal training',
        'Advanced analytics',
        'Valid for 12 months',
        'Guest passes (2 per month)',
        'Exclusive member events',
      ],
    },
  ];

  // ── Fetch membership status on mount ─────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setStatusLoading(false); return; }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/memberships/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setActiveMembership(data.active  || null);
          setQueuedMembership(data.queued  || null);
        } else {
          setStatusError(true);
        }
      } catch {
        setStatusError(true);
      } finally {
        setStatusLoading(false);
      }
    })();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setActivationMode(null); // reset choice when plan changes
  };

  // Show activation picker when:
  //   • a plan is selected
  //   • status finished loading
  //   • user has an active membership
  //   • no queued membership is blocking them
  const hasActivePlan    = !statusLoading && !!activeMembership && !queuedMembership;
  const showPicker       = !!selectedPlan && hasActivePlan;

  // Proceed is allowed when:
  //   • plan is chosen
  //   • not already loading
  //   • no blocking queued membership
  //   • if they have an active plan, they must also pick activation mode
  const canProceed =
    !!selectedPlan &&
    !loading &&
    !queuedMembership &&
    (!hasActivePlan || !!activationMode);

  // ── Submit ────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (!canProceed) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        plan:  selectedPlan.id,
        price: selectedPlan.price,
        ...(hasActivePlan && { activationMode }),
      };

      const res = await fetch(`${API_URL}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const membership = await res.json();
      if (!res.ok) throw new Error(membership.message || 'Failed to create membership');

      navigate('/payment', {
        state: {
          membershipId:   membership._id,
          plan:           selectedPlan.name,
          amount:         selectedPlan.price,
          isQueued:       membership.isQueued,
          activatesAfter: membership.activatesAfter,
        },
      });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900/95 to-black z-10" />
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470"
          alt="Gym background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Nav */}
      <nav className="relative z-50 bg-black/40 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              FitTrack
            </span>
          </button>
        </div>
      </nav>

      {/* Content */}
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

          {/* Active plan pill */}
          {!statusLoading && activeMembership && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-neutral-800/80 border border-neutral-700 text-sm text-neutral-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Current plan:{' '}
              <span className="capitalize font-semibold text-white">{activeMembership.plan}</span>
              {' '}· expires {formatDate(activeMembership.endDate)}
            </div>
          )}

          {/* Queued plan warning */}
          {!statusLoading && queuedMembership && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                You already have a <span className="capitalize font-semibold">{queuedMembership.plan}</span> plan
                queued to activate on <span className="font-semibold">{formatDate(queuedMembership.startDate)}</span>.
                No new purchases until it activates.
              </span>
            </div>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {plans.map((plan) => {
            const isCurrentPlan = activeMembership?.plan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => !queuedMembership && handleSelectPlan(plan)}
                className={`relative bg-neutral-900/80 backdrop-blur-lg border rounded-2xl p-6 sm:p-8 transition-all duration-300
                  ${queuedMembership ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${selectedPlan?.id === plan.id
                    ? 'border-green-500 shadow-lg shadow-green-500/20 scale-[1.03]'
                    : 'border-neutral-800 hover:border-neutral-700'}
                  ${plan.popular && selectedPlan?.id !== plan.id ? 'md:scale-[1.03]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Top-right badges */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                  {selectedPlan?.id === plan.id && (
                    <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/40">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                  {isCurrentPlan && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold text-white">LKR {plan.price.toLocaleString()}</span>
                  </div>
                  <p className="text-neutral-400 text-sm">{plan.duration}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={!!queuedMembership}
                  onClick={(e) => { e.stopPropagation(); !queuedMembership && handleSelectPlan(plan); }}
                  className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed
                    ${selectedPlan?.id === plan.id
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                >
                  {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── ACTIVATION MODE PICKER ──────────────────────────── */}
        {/* Shows only after a plan is selected AND user has an active membership */}
        {selectedPlan && !queuedMembership && (
          <div className="max-w-2xl mx-auto mb-8">

            {/* Loading shimmer while fetching status */}
            {statusLoading && (
              <div className="space-y-3">
                <div className="h-16 rounded-2xl bg-neutral-800 animate-pulse" />
                <div className="h-16 rounded-2xl bg-neutral-800 animate-pulse" />
              </div>
            )}

            {/* Picker: only when user has an active plan */}
            {!statusLoading && activeMembership && (
              <>
                {/* Section label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-neutral-700" />
                  <p className="text-neutral-400 text-sm font-medium whitespace-nowrap px-2">
                    When should this plan activate?
                  </p>
                  <div className="flex-1 h-px bg-neutral-700" />
                </div>

                <div className="space-y-3">
                  <ActivationOption
                    id="immediate"
                    selected={activationMode === 'immediate'}
                    onSelect={setActivationMode}
                    icon={Zap}
                    accentColor="green"
                    title="Activate on payment day"
                    description={`Your ${selectedPlan.name} plan starts today. Your current ${activeMembership.plan} plan will end immediately.`}
                  />
                  <ActivationOption
                    id="after_expiry"
                    selected={activationMode === 'after_expiry'}
                    onSelect={setActivationMode}
                    icon={Clock}
                    accentColor="blue"
                    title={`Activate after current plan expires  (${formatDate(activeMembership.endDate)})`}
                    description={`Your ${selectedPlan.name} plan will begin the day after your ${activeMembership.plan} plan ends. No gap in membership.`}
                  />
                </div>

                {/* Validation nudge — only shows after plan is selected but no mode picked yet */}
                {!activationMode && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-amber-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Please select when you'd like this plan to activate before proceeding</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PROCEED BUTTON ───────────────────────────────────── */}
        {selectedPlan && (
          <div className="flex justify-center">
            <button
              id="proceed-to-payment-btn"
              onClick={handleProceedToPayment}
              disabled={!canProceed}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-black
                         px-8 py-4 rounded-xl font-semibold text-lg
                         hover:from-green-600 hover:to-emerald-600
                         hover:shadow-lg hover:shadow-green-500/30
                         transition-all flex items-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                : queuedMembership
                  ? 'Membership Already Queued'
                  : <><CreditCard className="w-5 h-5" /> Proceed to Payment</>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

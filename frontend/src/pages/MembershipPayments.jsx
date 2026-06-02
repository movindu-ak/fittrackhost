import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Clock, CheckCircle, XCircle, RefreshCw,
  ArrowRight, ShoppingBag, ChevronLeft, ChevronRight,
  Receipt, Zap, Shield, Calendar
} from 'lucide-react';
import { Navigation } from '../components/Navigation';

const API_URL = 'https://fittrackhost.onrender.com/api';

// ── Status config ────────────────────────────────────────────
const STATUS = {
  captured: {
    label: 'Paid',
    icon: CheckCircle,
    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  created: {
    label: 'Initiated',
    icon: Clock,
    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400'
  },
  pending: {
    label: 'Pending',
    icon: RefreshCw,
    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    cls: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    cls: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30',
    dot: 'bg-neutral-400'
  },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400'
  }
};

// ── Plan config ──────────────────────────────────────────────
const PLAN_COLORS = {
  basic: { grad: 'from-sky-500 to-blue-600', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  premium: { grad: 'from-violet-500 to-purple-600', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  elite: { grad: 'from-amber-400 to-orange-500', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  default: { grad: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30' }
};

// ── Helper: format date ──────────────────────────────────────
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

// ── Helper: format LKR ───────────────────────────────────────
const formatLKR = (amount) =>
  `LKR ${parseFloat(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })}`;

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatBox({ icon: Icon, label, value, sub, accent }) {
  const accents = {
    emerald: 'border-emerald-500/30 from-emerald-500/10',
    blue: 'border-blue-500/30 from-blue-500/10',
    amber: 'border-amber-500/30 from-amber-500/10',
    purple: 'border-purple-500/30 from-purple-500/10',
  };
  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br ${accents[accent]} to-transparent p-5 overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-neutral-800/80">
          <Icon className="w-5 h-5 text-neutral-300" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight mb-0.5">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT ROW
// ─────────────────────────────────────────────────────────────
function PaymentRow({ payment }) {
  const [expanded, setExpanded] = useState(false);
  const plan = payment.membershipId?.plan || 'default';
  const planCfg = PLAN_COLORS[plan] || PLAN_COLORS.default;
  const statusCfg = STATUS[payment.status] || STATUS.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className="group rounded-2xl border border-neutral-700/60 bg-neutral-800/40
                 hover:border-neutral-600 hover:bg-neutral-800/70 transition-all duration-200"
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Plan icon */}
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${planCfg.grad}
                         flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <CreditCard className="w-5 h-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-semibold capitalize text-sm">
              {plan !== 'default' ? `${plan} Plan` : payment.description || 'FitTrack Payment'}
            </p>
            {plan !== 'default' && (
              <span className={`text-[10px] font-semibold uppercase tracking-wider
                               px-2 py-0.5 rounded-full border ${planCfg.badge}`}>
                {plan}
              </span>
            )}
          </div>
          <p className="text-neutral-500 text-xs font-mono truncate">
            {payment.orderId || payment._id}
          </p>
        </div>

        {/* Date */}
        <div className="hidden sm:block text-right flex-shrink-0">
          <p className="text-neutral-300 text-sm">{formatDate(payment.createdAt)}</p>
          <p className="text-neutral-500 text-xs mt-0.5">
            {new Date(payment.createdAt).toLocaleTimeString('en-LK', {
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-white font-bold">{formatLKR(payment.amount)}</p>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium
                           px-2.5 py-1 rounded-full border ${statusCfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Expand arrow */}
        <ChevronRight
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200
                      ${expanded ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-neutral-700/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <Detail label="Payment ID" value={payment.payherePaymentId || '—'} mono />
            <Detail label="Order ID" value={payment.orderId || '—'} mono />
            <Detail label="Currency" value={payment.currency || 'LKR'} />
            <Detail label="Method" value={payment.paymentMethod || '—'} />
            {payment.capturedAt && (
              <Detail label="Paid At" value={formatDate(payment.capturedAt)} />
            )}
            {payment.membershipId?.startDate && (
              <Detail label="Membership Start" value={formatDate(payment.membershipId.startDate)} />
            )}
            {payment.membershipId?.endDate && (
              <Detail label="Membership End" value={formatDate(payment.membershipId.endDate)} />
            )}
            {payment.membershipId?.status && (
              <Detail label="Membership Status" value={payment.membershipId.status} capitalize />
            )}
          </div>

          {/* Refund info */}
          {payment.refundStatus && (
            <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-purple-300 text-xs font-semibold mb-1">Refund Details</p>
              <p className="text-neutral-300 text-sm">
                Amount: {formatLKR(payment.refundAmount)} ·
                Status: <span className="capitalize">{payment.refundStatus}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono, capitalize }) {
  return (
    <div>
      <p className="text-neutral-500 text-[11px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-neutral-200 text-sm truncate
                    ${mono ? 'font-mono text-xs' : ''}
                    ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      {/* Decorative ring */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-neutral-800 border border-neutral-700
                        flex items-center justify-center">
          <Receipt className="w-10 h-10 text-neutral-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neutral-900
                        border border-neutral-700 flex items-center justify-center">
          <span className="text-neutral-500 text-xs">0</span>
        </div>
      </div>

      <h3 className="text-white text-xl font-semibold mb-2">No payments yet</h3>
      <p className="text-neutral-400 text-sm text-center max-w-xs mb-8">
        Your payment history will appear here once you purchase a membership plan.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { icon: Zap, label: 'Instant Activation' },
          { icon: Shield, label: 'Secure Payments' },
          { icon: Calendar, label: 'Flexible Plans' }
        ].map(({ icon: Icon, label }) => (
          <div key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs">
            <Icon className="w-3 h-3" />
            {label}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/select-membership')}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400
                   text-black font-semibold px-6 py-3 rounded-xl
                   transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25
                   active:scale-95"
      >
        <ShoppingBag className="w-4 h-4" />
        Browse Membership Plans
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-neutral-700/60 bg-neutral-800/40 p-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-neutral-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-neutral-700 rounded animate-pulse w-32" />
              <div className="h-2.5 bg-neutral-700/60 rounded animate-pulse w-48" />
            </div>
            <div className="h-3.5 bg-neutral-700 rounded animate-pulse w-20" />
            <div className="h-3.5 bg-neutral-700 rounded animate-pulse w-16" />
            <div className="h-6 bg-neutral-700 rounded-full animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function MembershipPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');   // all | captured | pending | failed

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchPayments = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(
        `${API_URL}/payments/history?page=${currentPage}&limit=8`,
        getAuthHeader()
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      setError('Unable to load payment history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(page); }, [page]);

  // Client-side filter
  const filtered = filter === 'all'
    ? payments
    : payments.filter((p) => p.status === filter);

  // Compute stats from loaded payments
  const totalPaid = payments.filter((p) => p.status === 'captured').reduce((s, p) => s + p.amount, 0);
  const lastPayment = payments[0];
  const activeCount = payments.filter((p) => p.membershipId?.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-neutral-800">
      <Navigation currentPage="membership" role="member" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment History</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {total > 0 ? `${total} transaction${total !== 1 ? 's' : ''} total` : 'All your payment records'}
            </p>
          </div>
          <button
            onClick={() => navigate('/select-membership')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400
                       text-black font-semibold px-4 py-2.5 rounded-xl text-sm
                       transition-all duration-200 active:scale-95 self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Membership
          </button>
        </div>

        {/* ── Stats row (only when there's data) ── */}
        {!loading && payments.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatBox
              icon={Receipt}
              label="Total Transactions"
              value={total}
              accent="blue"
            />
            <StatBox
              icon={CreditCard}
              label="Total Paid"
              value={`LKR ${totalPaid.toLocaleString('en-LK')}`}
              accent="emerald"
            />
            <StatBox
              icon={CheckCircle}
              label="Active Memberships"
              value={activeCount}
              accent="amber"
            />
            <StatBox
              icon={Clock}
              label="Last Payment"
              value={lastPayment ? formatDate(lastPayment.createdAt) : '—'}
              accent="purple"
            />
          </div>
        )}

        {/* ── Filter tabs ── */}
        {!loading && payments.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'captured', label: 'Paid' },
              { key: 'pending', label: 'Pending' },
              { key: 'failed', label: 'Failed' },
              { key: 'refunded', label: 'Refunded' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                           transition-all duration-150 border
                           ${filter === key
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-white'
                  }`}
              >
                {label}
                {key !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-60">
                    {payments.filter((p) => p.status === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-300 font-medium mb-1">Something went wrong</p>
            <p className="text-neutral-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchPayments(page)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300
                         rounded-lg text-sm font-medium transition border border-red-500/30"
            >
              Try Again
            </button>
          </div>
        ) : payments.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : (
          <>
            {/* Payment list */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <p className="text-4xl mb-3">🔍</p>
                <p>No {filter} payments found</p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 underline"
                >
                  Show all
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((payment) => (
                  <PaymentRow key={payment._id} payment={payment} />
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4
                              border-t border-neutral-700/50">
                <p className="text-neutral-500 text-sm">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30
                               disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages ||
                        (n >= page - 1 && n <= page + 1))
                      .reduce((acc, n, idx, arr) => {
                        if (idx > 0 && n - arr[idx - 1] > 1) {
                          acc.push('...');
                        }
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, idx) =>
                        n === '...' ? (
                          <span key={`dot-${idx}`}
                            className="px-2 py-2 text-neutral-500 text-sm">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-9 h-9 rounded-xl text-sm font-medium transition
                                        ${page === n
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
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 disabled:opacity-30
                               disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
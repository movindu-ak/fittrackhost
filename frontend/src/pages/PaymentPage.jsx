import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function PaymentPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [orderData, setOrderData] = useState(null);

  // Expect: { membershipId, plan, amount } from navigate state
  const { membershipId, plan, amount } = location.state || {};

  useEffect(() => {
    if (!membershipId || !amount) {
      navigate('/member/dashboard');
    }
  }, []);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Step 1: Get order data from backend
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await axios.post(
        `${API_URL}/payments/create-order`,
        {
          membershipId,
          amount,
          description: `FitTrack ${plan} Membership`
        },
        getAuthHeader()
      );

      setOrderData(data);

      // Step 2: Auto-submit the hidden form after state updates
      setTimeout(() => {
        document.getElementById('payhere-form').submit();
      }, 100);

    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">FitTrack</h1>
          <p className="text-gray-400">Secure payment via PayHere</p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-700 rounded-xl p-5 mb-6">
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
            Order Summary
          </h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium capitalize">{plan} Plan</span>
            <span className="text-2xl font-bold text-white">
              LKR {parseFloat(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-gray-400 text-sm">
            <span>Membership Subscription</span>
            <span>LKR</span>
          </div>
        </div>

        {/* Accepted Methods */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm text-center mb-3">Accepted payment methods</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {['Visa', 'Master', 'AMEX', 'eZCash', 'mCash', 'FriMi'].map((m) => (
              <span key={m}
                className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900
                     disabled:cursor-not-allowed text-white font-semibold py-4
                     rounded-xl transition-all duration-200 text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Redirecting to PayHere...
            </span>
          ) : (
            `Pay LKR ${parseFloat(amount).toFixed(2)}`
          )}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-3 text-gray-400 hover:text-white text-sm
                     py-2 transition-colors duration-200"
        >
          ← Go Back
        </button>

        <p className="text-center text-gray-500 text-xs mt-5">
          🔒 SSL Encrypted · Powered by PayHere
        </p>
      </div>

      {/* ── Hidden PayHere Form (auto-submitted) ── */}
      {orderData && (
        <form
          id="payhere-form"
          method="POST"
          action={orderData.payhereUrl}
          style={{ display: 'none' }}
        >
          <input type="hidden" name="merchant_id" value={orderData.merchantId} />
          <input type="hidden" name="return_url"  value={orderData.returnUrl} />
          <input type="hidden" name="cancel_url"  value={orderData.cancelUrl} />
          <input type="hidden" name="notify_url"  value={orderData.notifyUrl} />
          <input type="hidden" name="order_id"    value={orderData.orderId} />
          <input type="hidden" name="items"       value={`FitTrack ${plan} Membership`} />
          <input type="hidden" name="currency"    value="LKR" />
          <input type="hidden" name="amount"      value={orderData.amount} />
          <input type="hidden" name="hash"        value={orderData.hash} />

          {/* Customer details from localStorage */}
          <input type="hidden" name="first_name"  value={localStorage.getItem('userName')?.split(' ')[0] || 'Member'} />
          <input type="hidden" name="last_name"   value={localStorage.getItem('userName')?.split(' ')[1] || ''} />
          <input type="hidden" name="email"       value={localStorage.getItem('userEmail') || ''} />
          <input type="hidden" name="phone"       value={localStorage.getItem('userPhone') || '0771234567'} />
          <input type="hidden" name="address"     value="Colombo" />
          <input type="hidden" name="city"        value="Colombo" />
          <input type="hidden" name="country"     value="Sri Lanka" />
        </form>
      )}
    </div>
  );
}
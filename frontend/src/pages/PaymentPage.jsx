import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import API_URL from '../config.js';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { plan: planData, membershipId, amount: locationAmount } = location.state || {};

  // Handle both string and object plan data
  const planName = typeof planData === 'object' ? planData?.name : planData;
  const amount = typeof planData === 'object' ? planData?.price : locationAmount;

  // Auto-submit PayHere form
  const handlePayHere = async () => {
    try {
      setLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in first');
        navigate('/login');
        return;
      }

      // Call backend to create payment order
      const res = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          membershipId,
          amount: parseFloat(amount),
          description: `${planName} Membership Payment`
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to create payment order: ${res.status}`);
      }

      const data = await res.json();

      // Build PayHere form data
      const formData = new FormData();
      formData.append('merchant_id', data.merchantId);
      formData.append('return_url', data.returnUrl);
      formData.append('cancel_url', data.cancelUrl);
      formData.append('notify_url', data.notifyUrl);
      formData.append('order_id', data.orderId);
      formData.append('items', `${planName} Membership`);
      formData.append('amount', data.amount);
      formData.append('currency', data.currency);
      formData.append('first_name', 'FitTrack');
      formData.append('last_name', 'Member');
      formData.append('email', 'member@fittrack.com');
      formData.append('phone', '0700000000');
      formData.append('address', 'Colombo');
      formData.append('city', 'Colombo');
      formData.append('country', 'Sri Lanka');
      formData.append('hash', data.hash);

      // Create hidden form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.payhereUrl;

      for (let [key, value] of formData.entries()) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
      setLoading(false);
    }
  };

  if (!planName || !amount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-slate-300 mb-6">No membership plan selected. Please select a plan first.</p>
          <button
            onClick={() => navigate('/membership-plans')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FitTrack</h1>
          <p className="text-slate-400">Secure payment via PayHere</p>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            ORDER SUMMARY
          </h3>

          <div className="flex justify-between mb-3">
            <span className="text-slate-300 capitalize">{planName} Plan</span>
            <span className="text-slate-300">LKR {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="border-t border-slate-600 pt-3 flex justify-between">
            <span className="text-slate-400 text-sm">Membership Subscription</span>
            <span className="text-slate-400 text-sm">LKR</span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-600 flex justify-between">
            <span className="text-white font-bold">Total Amount</span>
            <span className="text-white font-bold">LKR {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Accepted Payment Methods */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Accepted payment methods
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-slate-600 text-slate-200 text-sm rounded">Visa</span>
            <span className="px-3 py-1 bg-slate-600 text-slate-200 text-sm rounded">Mastercard</span>
            <span className="px-3 py-1 bg-slate-600 text-slate-200 text-sm rounded">AMEX</span>
            <span className="px-3 py-1 bg-slate-600 text-slate-200 text-sm rounded">zCash</span>
            <span className="px-3 py-1 bg-slate-600 text-slate-200 text-sm rounded">mCash</span>
            <span className="px-3 py-1 bg-slate-600 text-slate-200 text-sm rounded">FriMi</span>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayHere}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-lg mb-4"
        >
          {loading ? 'Processing...' : `Pay LKR ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        </button>

        {/* Go Back Link */}
        <button
          onClick={() => navigate('/membership-plans')}
          className="w-full text-slate-400 hover:text-slate-200 text-sm transition"
        >
          ← Go Back
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>🔒 SSL Encrypted · Powered by PayHere</p>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://fittrackhost.onrender.com/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const [status, setStatus]   = useState('checking');
  const [payment, setPayment] = useState(null);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      navigate('/member/dashboard');
      return;
    }
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/payments/verify/${orderId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setPayment(data);
      setStatus(data.success ? 'success' : 'pending');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md text-center">

        {status === 'checking' && (
          <>
            <div className="animate-spin h-16 w-16 border-4 border-blue-500
                            border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white text-lg">Verifying payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-400 mb-2">Your membership is now active.</p>
            <p className="text-gray-500 text-sm mb-6">Order ID: {orderId}</p>
            <button
              onClick={() => navigate('/member/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white
                         font-semibold py-3 rounded-xl transition"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Pending</h1>
            <p className="text-gray-400 mb-6">
              Your payment is being processed. We'll update your membership shortly.
            </p>
            <button
              onClick={() => navigate('/member/dashboard')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white
                         font-semibold py-3 rounded-xl transition"
            >
              Back to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-400 mb-6">
              Payment may still be processing. Check your payment history.
            </p>
            <button
              onClick={() => navigate('/member/dashboard')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white
                         font-semibold py-3 rounded-xl transition"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API_URL from '../config.js';

export default function AdminScanner() {
  const [scanning, setScanning]       = useState(false);
  const [shouldStart, setShouldStart] = useState(false);
  const [manualCode, setManualCode]   = useState('');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [todayData, setTodayData]     = useState(null);
  const scannerRef                    = useRef(null);

  useEffect(() => {
    fetchToday();
    const interval = setInterval(fetchToday, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (!shouldStart || scannerRef.current) return;
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } });
      scanner.render(
        (decoded) => { stopScanner(); setShouldStart(false); handleScan(decoded); },
        (err) => console.warn('QR error:', err)
      );
      scannerRef.current = scanner;
    }, 100);
    return () => clearTimeout(timer);
  }, [shouldStart]);

  const fetchToday = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/attendance/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setTodayData(await res.json());
    } catch (e) { console.error('Failed to fetch today:', e); }
  };

  const startScanner = () => {
    setScanning(true);
    setShouldStart(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
    setShouldStart(false);
  };

  const handleScan = async (qrCode) => {
    if (!qrCode?.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/attendance/scan`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ qrCode: qrCode.trim() })
      });
      const data = await res.json();
      setResult({ ok: res.ok, ...data });
      if (res.ok) fetchToday();
    } catch (e) {
      setResult({ ok: false, message: 'Connection error: ' + e.message });
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">QR Attendance Scanner</h1>
          <p className="text-gray-400 mt-1">Scan member QR codes for check-in / check-out</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Today', value: todayData?.total ?? '-', color: 'text-blue-400' },
                { label: 'Inside Gym',  value: todayData?.checkedInCount ?? '-', color: 'text-emerald-400' },
                { label: 'Checked Out', value: todayData?.checkedOutCount ?? '-', color: 'text-orange-400' }
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <div className="flex gap-3 mb-5">
                <button onClick={scanning ? stopScanner : startScanner}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${scanning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {scanning ? 'Stop Camera' : 'Start Camera Scanner'}
                </button>
              </div>
              {scanning && <div id="qr-reader" className="rounded-xl overflow-hidden mb-5" />}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Manual QR Input</label>
                <div className="flex gap-2">
                  <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
                    placeholder="Paste or type QR code..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                  <button onClick={() => handleScan(manualCode)} disabled={loading || !manualCode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                    {loading ? '...' : 'Scan'}
                  </button>
                </div>
              </div>
              {result && (
                <div className={`mt-4 p-4 rounded-xl border ${result.ok ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : 'bg-red-950 border-red-700 text-red-300'}`}>
                  <p className="font-semibold">{result.message}</p>
                  {result.ok && result.attendance && (
                    <div className="mt-2 text-sm space-y-0.5 text-emerald-400">
                      <p>👤 {result.attendance.userName}</p>
                      <p>Action: {result.action === 'entry' ? 'Check-In' : 'Check-Out'}</p>
                      {result.attendance.durationText && <p>Duration: {result.attendance.durationText}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-emerald-400 mb-3">Inside Gym ({todayData?.checkedInCount ?? 0})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayData?.checkedIn?.length ? todayData.checkedIn.map(m => (
                  <div key={m._id} className="bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-emerald-300">{m.name}</p>
                    <p className="text-xs text-emerald-600">In: {m.entryTime}</p>
                  </div>
                )) : <p className="text-sm text-gray-600 text-center py-4">No members inside</p>}
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-orange-400 mb-3">Checked Out ({todayData?.checkedOutCount ?? 0})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayData?.checkedOut?.length ? todayData.checkedOut.map(m => (
                  <div key={m._id} className="bg-orange-950 border border-orange-800 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-orange-300">{m.name}</p>
                    <p className="text-xs text-orange-600">{m.entryTime} to {m.exitTime} ({m.durationText})</p>
                  </div>
                )) : <p className="text-sm text-gray-600 text-center py-4">No check-outs today</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Minus, Plus, Save } from 'lucide-react';
import API_URL from '../config.js';
import { TIME_SLOTS } from '../constants/timeSlots.js';

const MAX_SPOTS = 50;

export function TrainerTimetable() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(null);
  const [bulkSpots, setBulkSpots] = useState(5);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const loadWeek = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() + weekOffset * 7);

      const res = await fetch(
        `${API_URL}/bookings/trainer/availability?start=${encodeURIComponent(start.toISOString())}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load timetable');

      setWeek(data.week);
      setBulkSpots(data.defaultSpots);
      setDirty(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWeek(); }, [weekOffset]);

  const updateSlot = (dayIdx, slotIdx, changes) => {
    setWeek(prev => prev.map((day, d) =>
      d !== dayIdx ? day : {
        ...day,
        slots: day.slots.map((s, i) => (i === slotIdx ? { ...s, ...changes } : s))
      }
    ));
    setDirty(true);
  };

  const updateAllSlots = (fn) => {
    setWeek(prev => prev.map(day => ({ ...day, slots: day.slots.map(fn) })));
    setDirty(true);
  };

  const setDayOpen = (dayIdx, open) => {
    setWeek(prev => prev.map((day, d) =>
      d !== dayIdx ? day : {
        ...day,
        // slots that already have bookings can't be closed
        slots: day.slots.map(s => (open || s.booked === 0 ? { ...s, isOpen: open } : s))
      }
    ));
    setDirty(true);
  };

  const applySpotsToAll = () => {
    const n = Math.min(MAX_SPOTS, Math.max(1, parseInt(bulkSpots, 10) || 1));
    updateAllSlots(s => (s.isOpen ? { ...s, spots: Math.max(n, s.booked) } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const slots = week.flatMap(day =>
      day.slots.map(s => ({ date: day.date, timeSlot: s.timeSlot, isOpen: s.isOpen, spots: s.spots }))
    );
    try {
      const res = await fetch(`${API_URL}/bookings/trainer/availability`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ slots })
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.conflicts ? `\n${data.conflicts.join('\n')}` : '';
        throw new Error(`${data.message || 'Failed to save timetable'}${detail}`);
      }
      setMessage({ type: 'success', text: 'Timetable saved.' });
      setDirty(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const rangeLabel = week.length
    ? `${new Date(week[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(week[6].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <CalendarDays className="h-6 w-6 mr-2 text-blue-400" />
          My Availability
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
            disabled={weekOffset === 0 || dirty}
            className="p-2 rounded-lg bg-neutral-700 text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-sm font-medium w-36 text-center">{rangeLabel}</span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            disabled={dirty}
            className="p-2 rounded-lg bg-neutral-700 text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <span className="text-gray-400">Set all open slots to</span>
        <input
          type="number"
          min="1"
          max={MAX_SPOTS}
          value={bulkSpots}
          onChange={e => setBulkSpots(e.target.value)}
          className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
        />
        <span className="text-gray-400">spots</span>
        <button onClick={applySpotsToAll} className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white">
          Apply
        </button>
        <button
          onClick={() => updateAllSlots(s => ({ ...s, isOpen: true }))}
          className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
        >
          Open all
        </button>
        <button
          onClick={() => updateAllSlots(s => (s.booked === 0 ? { ...s, isOpen: false } : s))}
          className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
        >
          Close all
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm whitespace-pre-line border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading timetable...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 p-2">Time</th>
                {week.map((day, d) => {
                  const date = new Date(day.date);
                  const allOpen = day.slots.every(s => s.isOpen);
                  return (
                    <th key={day.date} className="p-2 text-center">
                      <div className="text-white text-sm font-semibold">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <button
                        onClick={() => setDayOpen(d, !allOpen)}
                        className="mt-1 text-xs text-green-400 hover:text-green-300"
                      >
                        {allOpen ? 'Close day' : 'Open day'}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((timeSlot, i) => (
                <tr key={timeSlot}>
                  <td className="p-2 text-sm text-white whitespace-nowrap">{timeSlot}</td>
                  {week.map((day, d) => {
                    const s = day.slots[i];
                    const minSpots = Math.max(1, s.booked);
                    return (
                      <td key={day.date + timeSlot} className="align-top">
                        <div className={`rounded-lg border p-2 text-center ${
                          s.isOpen ? 'bg-green-500/10 border-green-500/30' : 'bg-neutral-900/50 border-neutral-700'
                        }`}>
                          <button
                            onClick={() => updateSlot(d, i, { isOpen: !s.isOpen })}
                            disabled={s.isOpen && s.booked > 0}
                            title={s.isOpen && s.booked > 0 ? 'Has bookings — cancel them first to close' : ''}
                            className={`w-full text-xs font-semibold py-1 rounded disabled:cursor-not-allowed ${
                              s.isOpen ? 'text-green-400' : 'text-gray-500'
                            }`}
                          >
                            {s.isOpen ? 'Open' : 'Closed'}
                          </button>

                          {s.isOpen && (
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <button
                                onClick={() => updateSlot(d, i, { spots: s.spots - 1 })}
                                disabled={s.spots <= minSpots}
                                className="p-1 rounded bg-neutral-700 text-white disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-white text-sm w-6">{s.spots}</span>
                              <button
                                onClick={() => updateSlot(d, i, { spots: s.spots + 1 })}
                                disabled={s.spots >= MAX_SPOTS}
                                className="p-1 rounded bg-neutral-700 text-white disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {s.booked > 0 && (
                            <p className="text-xs text-yellow-400 mt-1">{s.booked} booked</p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold disabled:bg-neutral-700 disabled:text-neutral-500"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save week'}
        </button>
      </div>
    </div>
  );
}
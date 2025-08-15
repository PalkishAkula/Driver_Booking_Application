import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

export default function CurrentTrips() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trips, setTrips] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await api.get('/drivers/bookings');
      setTrips(all.data || []);
    } catch (e) {
      setError('Failed to load trips');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try {
      await api.put(`/drivers/bookings/${id}/status`, { status });
      load();
    } catch (e) {
      setError('Failed to update trip');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Trips History</h2>
        {error && <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4">{error}</div>}
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : trips.length === 0 ? (
          <div className="text-gray-500">No trips yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {trips.map(t => (
              <li key={t._id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-indigo-700">{t.pickupLocation} → {t.dropLocation}</div>
                  <div className="text-sm text-gray-500">{new Date(t.bookingTime || t.createdAt).toLocaleString()} | Status: {t.status}</div>
                </div>
                <div className="flex gap-2">
                  {t.status === 'confirmed' && (
                    <button onClick={() => update(t._id, 'started')} className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs">Start</button>
                  )}
                  {t.status === 'started' && (
                    <button onClick={() => update(t._id, 'completed')} className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs">Complete</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

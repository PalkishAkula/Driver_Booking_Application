import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

export default function Earnings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ completedTrips: 0, totalEarnings: 0 });
  const [trips, setTrips] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [earnRes, listRes] = await Promise.all([
        api.get('/drivers/earnings'),
        api.get('/drivers/bookings?status=completed'),
      ]);
      setSummary(earnRes.data || { completedTrips: 0, totalEarnings: 0 });
      setTrips(listRes.data || []);
    } catch (e) {
      setError('Failed to load earnings');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Earnings</h2>
        {error && <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4">{error}</div>}
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-indigo-50 text-indigo-700">
                <div className="text-sm">Completed Trips</div>
                <div className="text-2xl font-bold">{summary.completedTrips}</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 text-green-700">
                <div className="text-sm">Total Earnings</div>
                <div className="text-2xl font-bold">₹{summary.totalEarnings}</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">Completed Trips</h3>
            {trips.length === 0 ? (
              <div className="text-gray-500">No completed trips yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {trips.map(t => (
                  <li key={t._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-indigo-700">{t.pickupLocation} → {t.dropLocation}</div>
                      <div className="text-sm text-gray-500">{new Date(t.bookingTime || t.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-indigo-700 font-semibold">₹{t.fare}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

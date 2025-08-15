import React from 'react';

export default function AdminDriverDetailsModal({ open, onClose, data, loading, error }) {
  if (!open) return null;
  const driver = data?.driver;
  const stats = data?.stats || { totalBookings: 0, completedTrips: 0, rejectedTrips: 0, cancelledTrips: 0, earnings: 0 };
  const bookings = data?.bookings || [];
  const ratings = (driver?.ratings || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-indigo-700">Driver Details</h3>
          <button onClick={onClose} className="text-indigo-600 hover:text-indigo-800">✕</button>
        </div>
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 rounded px-3 py-2 mb-4">{error}</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="font-medium text-gray-700">{driver?.userId?.name || '-'}</div>
              <div className="text-sm text-gray-500">{driver?.userId?.email} · {driver?.userId?.phone}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.totalBookings}</div>
                <div className="text-indigo-500 text-sm">Total Bookings</div>
              </div>
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.completedTrips}</div>
                <div className="text-indigo-500 text-sm">Completed</div>
              </div>
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.rejectedTrips || 0}</div>
                <div className="text-indigo-500 text-sm">Rejected</div>
              </div>
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.cancelledTrips || 0}</div>
                <div className="text-indigo-500 text-sm">Cancelled</div>
              </div>
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">₹{stats.earnings}</div>
                <div className="text-indigo-500 text-sm">Earnings</div>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-indigo-600 mb-2">Recent Bookings</h4>
            <div className="max-h-80 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="py-2 px-3 text-left">User</th>
                    <th className="py-2 px-3 text-left">From</th>
                    <th className="py-2 px-3 text-left">To</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b">
                      <td className="py-2 px-3">{b.userId?.name || '-'}</td>
                      <td className="py-2 px-3">{b.pickupLocation || b.pickup}</td>
                      <td className="py-2 px-3">{b.dropoffLocation || b.dropLocation}</td>
                      <td className="py-2 px-3">{b.status}</td>
                      <td className="py-2 px-3">₹{b.fare ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-semibold text-indigo-600 mt-6 mb-2">Reviews</h4>
            {ratings.length === 0 ? (
              <div className="text-indigo-400">No reviews yet.</div>
            ) : (
              <div className="max-h-80 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="py-2 px-3 text-left">User</th>
                      <th className="py-2 px-3 text-left">Rating</th>
                      <th className="py-2 px-3 text-left">Comment</th>
                      <th className="py-2 px-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.map((r, idx) => (
                      <tr key={idx} className="border-b align-top">
                        <td className="py-2 px-3">{r.userId?.name || '-'}</td>
                        <td className="py-2 px-3">
                          <span className="text-yellow-500">
                            {'★'.repeat(Math.round(r.rating || 0))}
                            <span className="text-gray-300">{'★'.repeat(5 - Math.round(r.rating || 0))}</span>
                          </span>
                          <span className="ml-2 text-xs text-gray-500">{Number(r.rating)?.toFixed(1)}</span>
                        </td>
                        <td className="py-2 px-3 max-w-xs">
                          <div className="line-clamp-3">{r.comment || '-'}</div>
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

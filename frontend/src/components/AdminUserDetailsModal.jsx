import React from 'react';

export default function AdminUserDetailsModal({ open, onClose, data, loading, error }) {
  if (!open) return null;
  const user = data?.user;
  const stats = data?.stats || { totalBookings: 0, completedTrips: 0, totalSpend: 0 };
  const bookings = data?.bookings || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-indigo-700">User Details</h3>
          <button onClick={onClose} className="text-indigo-600 hover:text-indigo-800">✕</button>
        </div>
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 rounded px-3 py-2 mb-4">{error}</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="font-medium text-gray-700">{user?.name || '-'}</div>
              <div className="text-sm text-gray-500">{user?.email} · {user?.phone}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.totalBookings}</div>
                <div className="text-indigo-500 text-sm">Total Bookings</div>
              </div>
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.completedTrips}</div>
                <div className="text-indigo-500 text-sm">Completed Trips</div>
              </div>
              <div className="bg-indigo-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-indigo-700">₹{stats.totalSpend}</div>
                <div className="text-indigo-500 text-sm">Total Spend</div>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-indigo-600 mb-2">Recent Bookings</h4>
            <div className="max-h-80 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="py-2 px-3 text-left">Driver</th>
                    <th className="py-2 px-3 text-left">From</th>
                    <th className="py-2 px-3 text-left">To</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b">
                      <td className="py-2 px-3">{b.driverId?.userId?.name || b.driverId?.name || '-'}</td>
                      <td className="py-2 px-3">{b.pickupLocation || b.pickup}</td>
                      <td className="py-2 px-3">{b.dropoffLocation || b.dropLocation}</td>
                      <td className="py-2 px-3">{b.status}</td>
                      <td className="py-2 px-3">₹{b.fare ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

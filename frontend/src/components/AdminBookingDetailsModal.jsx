import React from 'react';

export default function AdminBookingDetailsModal({ open, onClose, booking }) {
  if (!open || !booking) return null;

  const userName = booking.userId?.name || '-';
  const userEmail = booking.userId?.email || '-';
  const driverName = booking.driverId?.userId?.name || booking.driverId?.name || '-';
  const driverEmail = booking.driverId?.userId?.email || '-';
  const from = booking.pickupLocation || booking.pickup || '-';
  const to = booking.dropoffLocation || booking.dropLocation || '-';
  const time = booking.bookingTime || booking.createdAt;
  const fare = booking.fare != null ? `₹${booking.fare}` : '-';
  const status = booking.status || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-indigo-700">Booking Details</h3>
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded p-3">
            <div className="text-sm text-indigo-500 font-semibold mb-1">User</div>
            <div className="text-indigo-800 font-semibold">{userName}</div>
            <div className="text-xs text-gray-600">{userEmail}</div>
          </div>
          <div className="bg-indigo-50 rounded p-3">
            <div className="text-sm text-indigo-500 font-semibold mb-1">Driver</div>
            <div className="text-indigo-800 font-semibold">{driverName}</div>
            <div className="text-xs text-gray-600">{driverEmail}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-sm text-gray-500">From</div>
            <div className="font-semibold text-gray-800 break-all">{from}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-sm text-gray-500">To</div>
            <div className="font-semibold text-gray-800 break-all">{to}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-sm text-gray-500">Time</div>
            <div className="font-semibold text-gray-800">{time ? new Date(time).toLocaleString() : '-'}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-semibold text-gray-800 capitalize">{status}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-sm text-gray-500">Fare</div>
            <div className="font-semibold text-gray-800">{fare}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

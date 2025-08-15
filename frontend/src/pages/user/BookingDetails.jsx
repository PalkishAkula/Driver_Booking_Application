import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data.booking);
    } catch (err) {
      setError('Failed to fetch booking details');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-2xl p-10 mt-14 animate-fade-in flex flex-col gap-8 border border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Booking Details</h2>
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4">{error}</div>
        ) : !booking ? (
          <div className="text-indigo-400">No booking found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img src={booking.driver?.photo || '/driver-placeholder.png'} alt="Driver" className="w-16 h-16 rounded-full object-cover border border-indigo-200" />
              <div>
                <div className="font-semibold text-indigo-700 text-lg">{booking.driver?.name || 'Driver'}</div>
                <div className="text-sm text-gray-500">{booking.driver?.vehicleDetails}</div>
                <div className="text-xs text-gray-400">Contact: {booking.driver?.phone || 'N/A'}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-indigo-700 font-semibold">Trip</div>
              <div>Pickup: <span className="font-medium">{booking.pickupLocation}</span></div>
              <div>Drop: <span className="font-medium">{booking.dropoffLocation}</span></div>
              <div>Date/Time: <span className="font-medium">{new Date(booking.bookingTime).toLocaleString()}</span></div>
              <div>Type: <span className="font-medium">{booking.tripType}</span></div>
            </div>
            {/* Status Timeline (simple) */}
            <div>
              <div className="text-indigo-700 font-semibold mb-1">Status</div>
              <div className="flex gap-2 items-center">
                {['booked','confirmed','on the way','started','completed','cancelled'].map(status => (
                  <span key={status} className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${booking.status === status ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{status}</span>
                ))}
              </div>
            </div>
            {/* Fare breakdown */}
            <div>
              <div className="text-indigo-700 font-semibold mb-1">Fare</div>
              <div className="text-lg font-bold">₹{booking.fare}</div>
            </div>
            {/* Optional: Route map could go here */}
          </div>
        )}
      </div>
    </Layout>
  );
}

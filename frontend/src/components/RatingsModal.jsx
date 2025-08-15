import React, { useState } from 'react';
import api from '../services/api';

export default function RatingsModal({ driver, bookingId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const driverId = driver?._id || driver?.id;
      if (!driverId) throw new Error('Invalid driver');
      await api.post(`/drivers/${driverId}/rating`, { rating, comment, bookingId });
      if (typeof onSubmit === 'function') onSubmit({ rating, comment, bookingId });
      onClose();
    } catch (err) {
      setError('Failed to submit rating');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>&times;</button>
        <h4 className="text-xl font-bold mb-2 text-indigo-700">Rate Your Driver</h4>
        <div className="mb-3 font-semibold">{driver?.userId?.name || driver?.name || 'Driver'}</div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-1 text-2xl">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                type="button"
                className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="rounded px-4 py-2 border border-indigo-200 focus:border-indigo-500 outline-none resize-none"
            rows={3}
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          {error && <div className="bg-red-50 text-red-700 rounded px-3 py-2">{error}</div>}
          <button type="submit" className="mt-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow transition" disabled={submitting || rating === 0}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      </div>
    </div>
  );
}

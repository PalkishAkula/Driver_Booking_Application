import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { getSocket } from "../../services/api";
import { toast } from "react-toastify";
import RatingsModal from "../../components/RatingsModal";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [ratingDriver, setRatingDriver] = useState(null);
  const [ratingBookingId, setRatingBookingId] = useState(null);

  useEffect(() => {
    fetchBookings();
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const onStatus = ({ status }) => {
      fetchBookings();
      if (status === "accepted") toast.info("Driver accepted. Please confirm.");
      if (status === "confirmed") toast.success("Your booking is confirmed");
      if (status === "rejected") toast.error("Your booking was rejected");
    };
    socket.on("booking:status", onStatus);
    return () => {
      socket.off("booking:status", onStatus);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/user");
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError("Failed to fetch bookings");
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      setError("Cancel failed");
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-2xl p-10 mt-14 animate-fade-in flex flex-col gap-8 border border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">My Bookings</h2>
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-indigo-400">No bookings found.</div>
        ) : (
          <ul className="divide-y divide-indigo-100">
            {bookings.map((b) => (
              <li
                key={b._id}
                className="py-4 flex flex-col sm:flex-row justify-between items-center gap-2"
              >
                <div>
                  <div className="font-semibold text-indigo-700">
                    {b.pickupLocation} → 
                    {b.dropLocation}
                  </div>
                  <div className="text-sm text-gray-500">
                    Date: {new Date(b.bookingTime).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Driver: {b.driverId?.userId?.name || "TBD"}
                  </div>
                  <div className="text-sm text-green-700 font-semibold">
                    Fare: ₹{b.fare}
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: {b.status}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  {b.status === "pending" && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  {b.status === "accepted" && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            await api.put(`/bookings/${b._id}/confirm`);
                            fetchBookings();
                          } catch (err) {}
                        }}
                        className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(b._id)}
                        className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && b.driverId?.userId?.phone && (
                    <div className="px-3 py-1 rounded bg-blue-50 text-blue-700 font-semibold text-xs">
                      Driver Number: {b.driverId.userId.phone}
                    </div>
                  )}
                  {b.status === "completed" && b.driverId && (
                    <button
                      onClick={() => {
                        setRatingDriver(b.driverId);
                        setRatingBookingId(b._id);
                        setShowRating(true);
                      }}
                      className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs"
                    >
                      Rate Driver
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showRating && ratingDriver && (
        <RatingsModal
          driver={ratingDriver}
          bookingId={ratingBookingId}
          onClose={() => {
            setShowRating(false);
            setRatingDriver(null);
            setRatingBookingId(null);
          }}
          onSubmit={() => {
            toast.success("Thanks for your feedback!");
            fetchBookings();
          }}
        />
      )}
    </Layout>
  );
}

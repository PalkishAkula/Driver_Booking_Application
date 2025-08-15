import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { getSocket } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const onStatus = () => {
      fetchBookings();
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

  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/bookings", {
        pickupLocation: pickup,
        dropoffLocation: dropoff,
      });
      setSuccess("Booking created!");
      setPickup("");
      setDropoff("");
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      setError("Cancel failed");
    }
  };
  // ...
  const { user } = useAuth();
  return (
    <Layout>
      <div className="max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-2xl p-10 mt-14 animate-fade-in flex flex-col gap-8 border border-indigo-100">
        {error && (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 border border-red-200 animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 rounded px-3 py-2 border border-green-200">
            {success}
          </div>
        )}
        <h2 className="text-2xl font-bold text-indigo-700 mb-2">
          {user?.name
            ? `Hi ${user.name}, ready to book a driver?`
            : "Welcome! Ready to book a driver?"}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl shadow transition text-lg"
            onClick={() => navigate("/book-driver")}
          >
            Book a Driver
          </button>
          <button
            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-4 rounded-xl shadow transition text-lg border border-indigo-200"
            onClick={() => navigate("/my-bookings")}
          >
            My Bookings
          </button>
          <button
            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-4 rounded-xl shadow transition text-lg border border-indigo-200"
            onClick={() => navigate("/profile")}
          >
            Profile Settings
          </button>
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-indigo-600 mb-3">
            Upcoming Bookings
          </h3>
          {loading ? (
            <div className="text-indigo-400">Loading...</div>
          ) : (
            (() => {
              const upcoming = (bookings || []).filter(
                (b) => b.status === "confirmed" || b.status === "started"
              );
              if (upcoming.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="text-indigo-400 text-lg mb-2">
                      No upcoming confirmed or started trips.
                    </div>
                    <button
                      onClick={() => navigate("/book-driver")}
                      className="mt-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow transition"
                    >
                      Book Now
                    </button>
                  </div>
                );
              }
              return (
                <ul className="divide-y divide-indigo-100">
                  {upcoming.map((b) => (
                    <li
                      key={b._id}
                      className="py-4"
                    >
                      {b.status === 'started' ? (
                        <div className="flex items-center gap-6 justify-between">
                          {/* Left: details */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-indigo-700 truncate">
                              {b.pickupLocation} → {b.dropLocation}
                            </div>
                            <div className="text-sm text-gray-500">
                              Date:{" "}
                              {new Date(
                                b.bookingTime || b.createdAt
                              ).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              Status: {b.status}
                            </div>
                          </div>
                          {/* Right: horizontal progress bar */}
                          <div className="w-40 sm:w-56">
                            <div className="relative h-2 bg-gray-200 rounded">
                              <div
                                className="absolute h-2 bg-indigo-500 rounded transition-all duration-500"
                                style={{ width: '50%' }}
                              />
                              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                              <span>Start</span>
                              <span className="text-indigo-600 font-semibold">In progress</span>
                              <span>End</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-indigo-700">
                              {b.pickupLocation} → {b.dropLocation}
                            </div>
                            <div className="text-sm text-gray-500">
                              Date:{" "}
                              {new Date(
                                b.bookingTime || b.createdAt
                              ).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              Status: {b.status}
                            </div>
                            {['confirmed','completed'].includes(b.status) && (
                              <div className="mt-2">
                                <div className="relative h-2 bg-gray-200 rounded">
                                  <div
                                    className={`absolute h-2 bg-indigo-500 rounded transition-all duration-500`}
                                    style={{ width: b.status === 'confirmed' ? '0%' : '100%' }}
                                  />
                                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                                  <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span className={b.status==='confirmed' ? 'text-indigo-600 font-semibold' : ''}>Start</span>
                                  <span className={b.status==='completed' ? 'text-indigo-600 font-semibold' : ''}>End</span>
                                </div>
                              </div>
                            )}
                          </div>
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => setConfirmCancelId(b._id)}
                              className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              );
            })()
          )}
        </div>

        {/* Completed Trips */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-indigo-600 mb-3">
            Completed Trips
          </h3>
          {loading ? (
            <div className="text-indigo-400">Loading...</div>
          ) : (
            (() => {
              const completed = (bookings || []).filter(
                (b) => b.status === "completed"
              );
              if (completed.length === 0) {
                return (
                  <div className="text-gray-400">No completed trips yet.</div>
                );
              }
              return (
                <ul className="divide-y divide-indigo-100">
                  {completed.map((b) => (
                    <li
                      key={b._id}
                      className="py-4"
                    >
                      <div className="flex items-center gap-6 justify-between">
                        {/* Left: details */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-indigo-700 truncate">
                            {b.pickupLocation} → {b.dropLocation}
                          </div>
                          <div className="text-sm text-gray-500">
                            Date:{" "}
                            {new Date(
                              b.bookingTime || b.createdAt
                            ).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Status: {b.status}
                          </div>
                        </div>
                        {/* Right: horizontal progress bar (completed = 100%) */}
                        <div className="w-40 sm:w-56">
                          <div className="relative h-2 bg-gray-200 rounded">
                            <div
                              className="absolute h-2 bg-indigo-500 rounded transition-all duration-500"
                              style={{ width: '100%' }}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                            <span>Start</span>
                            <span className="text-indigo-600 font-semibold">Completed</span>
                            <span>End</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()
          )}
        </div>
        {confirmCancelId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h4 className="text-lg font-bold text-indigo-700 mb-2">
                Cancel Trip?
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this trip? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmCancelId(null)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
                >
                  Keep Trip
                </button>
                <button
                  onClick={async () => {
                    await handleCancel(confirmCancelId);
                    setConfirmCancelId(null);
                  }}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                >
                  Cancel Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

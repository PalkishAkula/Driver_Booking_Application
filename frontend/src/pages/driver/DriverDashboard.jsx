import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api, { getSocket } from "../../services/api";
import { toast } from "react-toastify";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otpBookingId, setOtpBookingId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    fetchDriverData();
    // Refresh in realtime when booking statuses change
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    // Join driver room for realtime events
    api
      .get("/drivers/me")
      .then((res) => {
        const userId = res.data?.driver?.userId?._id;
        if (userId) {
          socket.emit("join", { driverUserId: userId });
        }
      })
      .catch(() => {});

    const onStatus = () => {
      fetchDriverData();
    };
    socket.on("booking:status", onStatus);
    return () => {
      socket.off("booking:status", onStatus);
    };
  }, []);

  const fetchDriverData = async () => {
    setLoading(true);
    setError("");
    try {
      // get driver details for availability
      const meRes = await api.get("/drivers/me");
      const driver = meRes.data?.driver;
      setAvailability(!!driver?.availabilityStatus);
      // fetch all bookings regardless of status so started/completed remain visible
      const [allBookingsRes, earningsRes] = await Promise.all([
        api.get("/drivers/bookings"),
        api.get("/drivers/earnings"),
      ]);
      const list = allBookingsRes.data || [];
      const current = list.filter(b => ['accepted','confirmed','started'].includes(b.status));
      setBookings(current);
      setEarnings(earningsRes.data?.totalEarnings || 0);
    } catch (err) {
      setError("Failed to fetch driver data");
    }
    setLoading(false);
  };

  const toggleAvailability = async () => {
    try {
      const res = await api.put("/drivers/status", {
        available: !availability,
      });
      setAvailability(!!res.data?.availabilityStatus);
      toast.success(
        `You are now ${
          !availability ? "available" : "unavailable"
        } for bookings.`
      );
    } catch (err) {
      setError("Failed to update availability");
      toast.error("Failed to update availability");
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await api.put(`/drivers/bookings/${id}/status`, { status });
      fetchDriverData();
    } catch (err) {
      setError("Failed to update booking status");
    }
  };

  const openStartTripOtp = async (id) => {
    setOtpError("");
    setOtpValue("");
    setOtpBookingId(id);
    setOtpSending(true);
    try {
      const res = await api.post(`/drivers/bookings/${id}/start-otp`);
      const msg = res.data?.message || "OTP sent";
      toast.info(msg);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to send OTP";
      setOtpError(msg);
      toast.error(msg);
    }
    setOtpSending(false);
  };

  const verifyStartTripOtp = async () => {
    if (!otpBookingId) return;
    if (!otpValue || otpValue.length < 4) {
      setOtpError("Enter the OTP sent to user");
      return;
    }
    setOtpError("");
    setOtpVerifying(true);
    try {
      await api.post(`/drivers/bookings/${otpBookingId}/start-verify`, {
        otp: otpValue,
      });
      toast.success("Trip started");
      setOtpBookingId(null);
      setOtpValue("");
      fetchDriverData();
    } catch (e) {
      setOtpError(e.response?.data?.message || "Invalid OTP");
    }
    setOtpVerifying(false);
  };

  const resendOtp = async () => {
    if (!otpBookingId) return;
    setOtpError("");
    setOtpSending(true);
    try {
      await api.post(`/drivers/bookings/${otpBookingId}/start-otp`);
      toast.info("OTP re-sent");
    } catch (e) {
      setOtpError(e.response?.data?.message || "Failed to resend OTP");
    }
    setOtpSending(false);
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg p-8 mt-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          Driver Dashboard
        </h2>
        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => navigate("/driver/requests")}
            className="w-full px-3 py-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm"
          >
            Requests
          </button>
          <button
            onClick={() => navigate("/driver/trips")}
            className="w-full px-3 py-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm"
          >
            Current Trips
          </button>
          <button
            onClick={() => navigate("/driver/earnings")}
            className="w-full px-3 py-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm"
          >
            Earnings
          </button>
          <button
            onClick={() => navigate("/driver/profile")}
            className="w-full px-3 py-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm"
          >
            Profile
          </button>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <span className="font-semibold text-indigo-600">Availability:</span>
          <button
            onClick={toggleAvailability}
            className={`px-5 py-2 rounded font-semibold transition ${
              availability
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          >
            {availability ? "Available" : "Unavailable"}
          </button>
          <span className="ml-auto text-indigo-700 font-bold">
            Earnings: ₹{earnings}
          </span>
        </div>
        {error && (
          <div className="bg-red-100 text-red-700 rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <h3 className="text-xl font-semibold text-indigo-600 mt-6 mb-2">
          Current Trips
        </h3>
        {loading ? (
          <div className="text-indigo-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-indigo-400">No bookings assigned yet.</div>
        ) : (
          <ul className="divide-y divide-indigo-100">
            {bookings.map((b) => (
              <li
                key={b._id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-indigo-700">
                    {b.pickupLocation} → {b.dropLocation}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        b.status === "pending"
                          ? "bg-gray-100 text-gray-700"
                          : b.status === "accepted"
                          ? "bg-yellow-100 text-yellow-700"
                          : b.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : b.status === "started"
                          ? "bg-purple-100 text-purple-700"
                          : b.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : b.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(b.createdAt).toLocaleString()}
                  </div>
                  {['confirmed','started','completed'].includes(b.status) && (
                    <div className="mt-2">
                      <div className="relative h-2 bg-gray-200 rounded">
                        <div
                          className={`absolute h-2 bg-indigo-500 rounded transition-all duration-500`}
                          style={{ width: b.status === 'confirmed' ? '0%' : b.status === 'started' ? '50%' : '100%' }}
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
                <div className="flex gap-2">
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(b._id, "accepted")}
                        className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateBookingStatus(b._id, "rejected")}
                        className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === "accepted" && (
                    <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 font-semibold text-xs">
                      Waiting for user confirmation
                    </span>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => openStartTripOtp(b._id)}
                      className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs"
                    >
                      Start Trip
                    </button>
                  )}
                  {b.status === "started" && (
                    <button
                      onClick={() => updateBookingStatus(b._id, "completed")}
                      className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-xs"
                    >
                      Complete Trip
                    </button>
                  )}
                  {b.status === "completed" && (
                    <span className="px-3 py-1 rounded bg-green-100 text-green-700 font-semibold text-xs">
                      Completed
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {otpBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h4 className="text-lg font-bold text-indigo-700 mb-2">
              Enter OTP
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Enter the 6-digit code sent to the user's email.
            </p>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              placeholder="OTP"
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
              maxLength={6}
            />
            {otpError && (
              <div className="text-red-600 text-sm mb-2">{otpError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOtpBookingId(null)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
                disabled={otpSending || otpVerifying}
              >
                Close
              </button>
              <button
                onClick={resendOtp}
                className="px-4 py-2 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm font-semibold"
                disabled={otpSending || otpVerifying}
              >
                {otpSending ? "Sending..." : "Resend OTP"}
              </button>
              <button
                onClick={verifyStartTripOtp}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                disabled={otpVerifying || otpSending}
              >
                {otpVerifying ? "Verifying..." : "Verify & Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

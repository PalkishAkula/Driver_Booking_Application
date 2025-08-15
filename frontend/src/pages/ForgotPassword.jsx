import React, { useState } from "react";
import Layout from "../components/Layout";
import axios from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const sendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/auth/password/otp-request", { email });
      setOtpSent(true);
      toast.info("OTP sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length < 4) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/auth/password/reset", { email, otp, newPassword });
      toast.success("Password has been reset. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <form
        onSubmit={otpSent ? resetPassword : sendOtp}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 mt-14 animate-fade-in flex flex-col gap-7 border border-indigo-100"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-indigo-100 text-indigo-600 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
              <path fillRule="evenodd" d="M2 20a10 10 0 1120 0H2z" clipRule="evenodd" />
            </svg>
          </span>
          <h2 className="text-2xl font-bold text-indigo-700">Forgot password</h2>
        </div>
        <div className="h-1 w-16 bg-indigo-200 rounded mb-1 self-start"></div>
        <p className="text-sm text-gray-500 -mt-1">
          {otpSent ? "Enter the OTP and choose a new password." : "Enter your email to receive an OTP."}
        </p>
        {error && (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 border border-red-200 animate-shake">{error}</div>
        )}

        <div className="relative">
          <input
            type="email"
            className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={otpSent && loading}
          />
          <label className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1">
            Email
          </label>
        </div>

        {otpSent && (
          <>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition tracking-widest"
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <label className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1">
                Enter OTP
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <label className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1">
                New Password
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <label className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1">
                Confirm Password
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg shadow transition focus:ring-2 focus:ring-indigo-200 focus:outline-none mt-2"
          disabled={loading}
        >
          {loading ? (otpSent ? "Resetting..." : "Sending OTP...") : otpSent ? "Reset Password" : "Send OTP"}
        </button>

        {otpSent && (
          <div className="text-sm text-gray-500 text-center">
            <button
              type="button"
              className="underline hover:text-indigo-700"
              onClick={async () => {
                try {
                  setLoading(true);
                  await axios.post("/auth/password/otp-request", { email });
                  toast.info("OTP re-sent");
                } catch (e) {
                  toast.error(e.response?.data?.message || "Failed to resend OTP");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Resend OTP
            </button>
          </div>
        )}
      </form>
    </Layout>
  );
}

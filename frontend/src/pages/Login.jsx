import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import axios from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Simple email format check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (otpMode) {
      // OTP flow
      setLoading(true);
      try {
        if (!otpSent) {
          await axios.post("/auth/login-otp/request", { email });
          setOtpSent(true);
          toast.info("OTP sent to your email");
        } else {
          if (!otp || otp.length < 4) {
            setError("Please enter the OTP sent to your email.");
            setLoading(false);
            return;
          }
          const res = await axios.post("/auth/login-otp/verify", { email, otp });
          login(res.data.user, res.data.token);
          toast.success("Login successful!");
          navigate("/");
        }
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(!otpSent ? "Failed to send OTP" : "OTP verification failed");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Password flow
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      toast.success("Login successful!");
      navigate("/");
    } catch (err) {
      // More relevant backend error
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 mt-14 animate-fade-in flex flex-col gap-7 border border-indigo-100"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-indigo-100 text-indigo-600 rounded-full p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </span>
          <h2 className="text-2xl font-bold text-indigo-700">Welcome back</h2>
        </div>
        <div className="h-1 w-16 bg-indigo-200 rounded mb-1 self-start"></div>
        <p className="text-sm text-gray-500 -mt-1">Please login to continue.</p>
        {error && (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 border border-red-200 animate-shake">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="email"
              id="login-email"
              className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label
              htmlFor="login-email"
              className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
            >
              Email
            </label>
          </div>
          {!otpMode && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!otpMode}
              />
              <label
                htmlFor="login-password"
                className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19.5C7.5 19.5 3.773 16.614 2.25 12c.46-1.375 1.2-2.625 2.163-3.688m3.11-2.31A9.957 9.957 0 0112 4.5c4.5 0 8.227 2.886 9.75 7.5a10.523 10.523 0 01-2.343 3.688M9.879 9.879A3 3 0 0012 15a3 3 0 002.121-5.121M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12c1.523-4.614 5.25-7.5 9.75-7.5s8.227 2.886 9.75 7.5c-1.523 4.614-5.25 7.5-9.75 7.5S3.773 16.614 2.25 12z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          )}
          {otpMode && otpSent && (
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="login-otp"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition tracking-widest"
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <label
                htmlFor="login-otp"
                className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
              >
                Enter OTP
              </label>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg shadow transition focus:ring-2 focus:ring-indigo-200 focus:outline-none mt-2"
          disabled={loading}
        >
          {loading
            ? otpMode
              ? otpSent
                ? "Verifying..."
                : "Sending OTP..."
              : "Logging in..."
            : otpMode
            ? otpSent
              ? "Verify OTP"
              : "Send OTP"
            : "Login"}
        </button>
        

        {/* Centered toggle below the separator */}
        <div className="text-center -mt-1 mb-3">
          <button
            type="button"
            className="text-sm text-indigo-600 underline hover:text-indigo-700"
            onClick={() => {
              setOtpMode(!otpMode);
              setError("");
              setOtpSent(false);
              setOtp("");
            }}
          >
            {otpMode ? "Use password instead" : "Login with OTP instead"}
          </button>
        </div>

        {/* Optional resend under the toggle when in OTP mode */}
        {otpMode && otpSent && (
          <div className="text-center -mt-2 mb-4">
            <button
              type="button"
              className="text-sm underline hover:text-indigo-700"
              onClick={async () => {
                try {
                  setLoading(true);
                  await axios.post("/auth/login-otp/request", { email });
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

{/* Separator with 'or' */}
<div className="flex items-center gap-1 my-1">
          <div className="flex-grow border-t border-indigo-100"></div>
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-grow border-t border-indigo-100"></div>
        </div>
        {/* Bottom row: left forgot password, right sign up */}
        <div className="flex justify-between items-center text-sm mt-2">
          <a href="/forgot-password" className="text-indigo-500 underline hover:text-indigo-700">
            Forgot password?
          </a>
          <div className="text-indigo-500">
            Don&apos;t have an account?{" "}
            <a href="/register" className="underline hover:text-indigo-700">
              Sign Up
            </a>
          </div>
        </div>
      </form>
      <div className="flex flex-col items-center mt-6">
        <div className="flex items-center w-full mb-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
      </div>
    </Layout>
  );
}

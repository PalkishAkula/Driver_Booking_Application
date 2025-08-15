import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import axios from "../services/api";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    userType: "customer",
    licenseNumber: "",
    vehicleDetails: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Client-side validation
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (form.userType === "driver") {
      if (!form.licenseNumber || !form.vehicleDetails) {
        setError(
          "License number and vehicle details are required for driver signup."
        );
        return;
      }
    }
    setLoading(true);
    try {
      await axios.post("/auth/register", form);
      setLoading(false);
      toast.success("Registration successful!");
      navigate("/");
    } catch (err) {
      setLoading(false);
      // More relevant backend error
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError("An account with this email already exists.");
      } else {
        setError(
          "Registration failed. Please check your details and try again."
        );
      }
    }
  };

  return (
    <Layout>
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-10 mt-14 animate-fade-in flex flex-col gap-7 border border-indigo-100"
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
          <h2 className="text-2xl font-bold text-indigo-700">
            Create your account
          </h2>
        </div>
        <div className="h-1 w-16 bg-indigo-200 rounded mb-1 self-start"></div>
        <p className="text-sm text-gray-500 mb-2">
          Choose your role to get started.
        </p>
        {error && (
          <div className="bg-red-50 text-red-700 rounded px-3 py-2 border border-red-200 animate-shake">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Role selection */}
          <div className="flex flex-col gap-3">
            <label className="text-xs text-indigo-500 font-semibold mb-1 ml-1">
              Select your role
            </label>
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, userType: "customer" }))}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 shadow-sm cursor-pointer focus:outline-none text-left
                  ${
                    form.userType === "customer"
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                aria-pressed={form.userType === "customer"}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21a8 8 0 10-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-indigo-700">Customer</div>
                  <div className="text-xs text-gray-500">
                    Book rides and manage your bookings
                  </div>
                </div>
                {form.userType === "customer" && (
                  <span className="absolute right-3 top-3 text-indigo-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, userType: "driver" }))}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 shadow-sm cursor-pointer focus:outline-none text-left
                  ${
                    form.userType === "driver"
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                aria-pressed={form.userType === "driver"}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 17h4M3 10h3l2-5h8l2 5h3v7h-2a3 3 0 01-6 0H9a3 3 0 01-6 0H1v-7h2z" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-blue-700">Driver</div>
                  <div className="text-xs text-gray-500">
                    Accept rides and track earnings
                  </div>
                </div>
                {form.userType === "driver" && (
                  <span className="absolute right-3 top-3 text-indigo-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Form fields */}
          <div className="flex flex-col gap-5">
            <div className="relative">
              <input
                type="text"
                name="name"
                id="signup-name"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="signup-name"
                className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
              >
                Full Name
              </label>
            </div>
            <div className="relative">
              <input
                type="email"
                name="email"
                id="signup-email"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="signup-email"
                className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
              >
                Email
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                id="signup-password"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="signup-password"
                className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                id="signup-phone"
                className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                pattern="\d{10}"
                required
              />
              <label
                htmlFor="signup-phone"
                className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
              >
                Phone Number
              </label>
            </div>

            {form.userType === "driver" && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    name="licenseNumber"
                    id="signup-license"
                    className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                    placeholder="License Number"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    required={form.userType === "driver"}
                  />
                  <label
                    htmlFor="signup-license"
                    className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
                  >
                    License Number
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    name="vehicleDetails"
                    id="signup-vehicle"
                    rows={3}
                    className="peer w-full px-4 py-3 border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white placeholder-transparent transition"
                    placeholder="Vehicle Details"
                    value={form.vehicleDetails}
                    onChange={handleChange}
                    required={form.userType === "driver"}
                  />
                  <label
                    htmlFor="signup-vehicle"
                    className="absolute left-4 top-3 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-indigo-500 peer-valid:-top-4 peer-valid:text-xs bg-white px-1"
                  >
                    Vehicle Details (Make, Model, Color, Plate)
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg shadow transition focus:ring-2 focus:ring-indigo-200 focus:outline-none mt-2"
              disabled={loading}
            >
              {loading ? "Registering..." : "Sign Up"}
            </button>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-grow border-t border-indigo-100"></div>
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-indigo-100"></div>
            </div>
            <div className="text-sm text-indigo-500 text-center -mt-1">
              Already have an account?{" "}
              <a href="/login" className="underline hover:text-indigo-700">
                Login
              </a>
            </div>
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

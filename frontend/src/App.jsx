import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Placeholder dashboards
import UserDashboard from './pages/user/UserDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import BookingRequests from './pages/driver/BookingRequests';
import CurrentTrips from './pages/driver/CurrentTrips';
import Earnings from './pages/driver/Earnings';
import DriverProfile from './pages/driver/DriverProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import BookDriver from './pages/user/BookDriver';
import MyBookings from './pages/user/MyBookings';
import Profile from './pages/user/Profile';
import BookingDetails from './pages/user/BookingDetails';

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType === "driver") return <DriverDashboard />;
  if (user.userType === "admin") return <AdminDashboard />;
  return <UserDashboard />;
}

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-driver"
          element={
            <ProtectedRoute>
              <BookDriver />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          }
        />
        {/* Driver-specific pages */}
        <Route
          path="/driver/requests"
          element={
            <ProtectedRoute>
              <BookingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/trips"
          element={
            <ProtectedRoute>
              <CurrentTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/earnings"
          element={
            <ProtectedRoute>
              <Earnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/profile"
          element={
            <ProtectedRoute>
              <DriverProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

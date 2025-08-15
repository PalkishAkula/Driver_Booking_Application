import React, { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="bg-white shadow-md py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-indigo-700 tracking-tight">Driver Booking</Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 text-indigo-600 font-medium items-center">
            {!user && <Link to="/login" className="hover:text-indigo-900">Login</Link>}
            {!user && <Link to="/register" className="hover:text-indigo-900">Sign Up</Link>}
            {!user && <Link to="/admin/login" className="hover:text-indigo-900">Admin</Link>}
            {user && (
              <>
                <Link to="/" className="hover:text-indigo-900">Home</Link>
                <Link to="/dashboard" className="hover:text-indigo-900">Dashboard</Link>
                {user.userType === 'admin' ? (
                  <></>
                ) : user.userType === 'driver' ? (
                  <>
                    <Link to="/driver/requests" className="hover:text-indigo-900">Requests</Link>
                    <Link to="/driver/trips" className="hover:text-indigo-900">Trips</Link>
                    <Link to="/driver/earnings" className="hover:text-indigo-900">Earnings</Link>
                    <Link to="/driver/profile" className="hover:text-indigo-900">Profile</Link>
                  </>
                ) : (
                  <>
                    <Link to="/book-driver" className="hover:text-indigo-900">Book a Driver</Link>
                    <Link to="/my-bookings" className="hover:text-indigo-900">My Bookings</Link>
                    <Link to="/profile" className="hover:text-indigo-900">Profile</Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold transition"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-controls="mobile-menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileOpen ? (
              // X icon
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <div id="mobile-menu" className={`${mobileOpen ? 'max-h-screen' : 'max-h-0'} md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out`}>
          <div className="pt-2 pb-4 space-y-1 text-indigo-700 font-medium">
            {!user && (
              <div className="flex flex-col">
                <Link to="/login" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                <Link to="/admin/login" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Admin</Link>
              </div>
            )}
            {user && (
              <div className="flex flex-col">
                <Link to="/" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Home</Link>
                <Link to="/dashboard" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                {user.userType === 'admin' ? (
                  <></>
                ) : user.userType === 'driver' ? (
                  <>
                    <Link to="/driver/requests" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Requests</Link>
                    <Link to="/driver/trips" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Trips</Link>
                    <Link to="/driver/earnings" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Earnings</Link>
                    <Link to="/driver/profile" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Profile</Link>
                  </>
                ) : (
                  <>
                    <Link to="/book-driver" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Book a Driver</Link>
                    <Link to="/my-bookings" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>My Bookings</Link>
                    <Link to="/profile" className="px-3 py-2 hover:bg-indigo-50 rounded" onClick={() => setMobileOpen(false)}>Profile</Link>
                  </>
                )}
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="mt-2 mx-3 px-4 py-2 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-left font-semibold"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {children}
      </main>
      <footer className="bg-white shadow-inner py-2 text-center text-indigo-400 text-sm">
        Driver Booking 
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import AdminDriverDetailsModal from '../../components/AdminDriverDetailsModal';
import AdminUserDetailsModal from '../../components/AdminUserDetailsModal';
import AdminBookingDetailsModal from '../../components/AdminBookingDetailsModal';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState({ totalUsers: 0, totalDrivers: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // details modals state
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [driverDetailsLoading, setDriverDetailsLoading] = useState(false);
  const [driverDetailsError, setDriverDetailsError] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, driversRes, bookingsRes, analyticsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/drivers'),
        api.get('/admin/bookings'),
        api.get('/admin/dashboard'),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || []);
      setDrivers(Array.isArray(driversRes.data) ? driversRes.data : driversRes.data?.drivers || []);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data?.bookings || []);
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      setError('Failed to fetch admin data');
    }
    setLoading(false);
  };

  const openBookingDetails = (booking) => {
    setBookingDetails(booking);
    setBookingModalOpen(true);
  };

  const openDriverDetails = async (driverId) => {
    setDriverModalOpen(true);
    setDriverDetails(null);
    setDriverDetailsError('');
    setDriverDetailsLoading(true);
    try {
      const res = await api.get(`/admin/drivers/${driverId}/details`);
      setDriverDetails(res.data);
    } catch (e) {
      setDriverDetailsError('Failed to load driver details');
    }
    setDriverDetailsLoading(false);
  };

  const openUserDetails = async (userId) => {
    setUserModalOpen(true);
    setUserDetails(null);
    setUserDetailsError('');
    setUserDetailsLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/details`);
      setUserDetails(res.data);
    } catch (e) {
      setUserDetailsError('Failed to load user details');
    }
    setUserDetailsLoading(false);
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/user/${id}`);
      fetchAdminData();
    } catch (err) {
      setError('Delete failed');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg p-8 mt-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Admin Dashboard</h2>
        {error && <div className="bg-red-100 text-red-700 rounded px-3 py-2 mb-4">{error}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-indigo-50 p-4 rounded shadow text-center">
            <div className="text-3xl font-bold text-indigo-700">{analytics.totalUsers ?? users.length}</div>
            <div className="text-indigo-500">Total Users</div>
          </div>
      {/* Details Modals */}
      <AdminDriverDetailsModal
        open={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        data={driverDetails}
        loading={driverDetailsLoading}
        error={driverDetailsError}
      />
      <AdminUserDetailsModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        data={userDetails}
        loading={userDetailsLoading}
        error={userDetailsError}
      />
          <div className="bg-indigo-50 p-4 rounded shadow text-center">
            <div className="text-3xl font-bold text-indigo-700">{analytics.totalDrivers ?? drivers.length}</div>
            <div className="text-indigo-500">Total Drivers</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded shadow text-center">
            <div className="text-3xl font-bold text-indigo-700">{analytics.totalBookings ?? bookings.length}</div>
            <div className="text-indigo-500">Total Bookings</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded shadow text-center">
            <div className="text-3xl font-bold text-indigo-700">{bookings.filter(b => b.status === 'rejected').length}</div>
            <div className="text-indigo-500">Rejected Trips</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded shadow text-center">
            <div className="text-3xl font-bold text-indigo-700">{bookings.filter(b => b.status === 'cancelled' || b.status === 'canceled').length}</div>
            <div className="text-indigo-500">Cancelled Trips</div>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-indigo-600 mt-6 mb-2">Users</h3>
        {loading ? <div className="text-indigo-400">Loading...</div> : (
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="bg-indigo-100">
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Type</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 px-3 text-center text-indigo-400">No users found.</td>
                </tr>
              ) : users.map(u => (
                <tr key={u._id} className="border-b">
                  <td className="py-2 px-3">{u.name}</td>
                  <td className="py-2 px-3">{u.email}</td>
                  <td className="py-2 px-3">{u.userType || 'customer'}</td>
                  <td className="py-2 px-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openUserDetails(u._id)}
                        className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 className="text-xl font-semibold text-indigo-600 mt-6 mb-2">Drivers</h3>
        {loading ? <div className="text-indigo-400">Loading...</div> : (
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="bg-indigo-100">
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3 text-left">License</th>
                <th className="py-2 px-3 text-left">Vehicle</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d._id} className="border-b">
                  <td className="py-2 px-3">{d.userId?.name || '-'}</td>
                  <td className="py-2 px-3">{d.licenseNumber}</td>
                  <td className="py-2 px-3">{d.vehicleDetails}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => openDriverDetails(d._id)}
                      className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-xs"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 className="text-xl font-semibold text-indigo-600 mt-6 mb-2">Bookings</h3>
        {loading ? <div className="text-indigo-400">Loading...</div> : (
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="bg-indigo-100">
                <th className="py-2 px-3 text-left">User</th>
                <th className="py-2 px-3 text-left">Driver</th>
                <th className="py-2 px-3 text-left">From</th>
                <th className="py-2 px-3 text-left">To</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Fare</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const from = b.pickupLocation || b.pickup || '-';
                const to = b.dropoffLocation || b.dropLocation || '-';
                const trunc = (s) => typeof s === 'string' && s.length > 10 ? s.slice(0,10) + '...' : s;
                return (
                <tr key={b._id} className="border-b">
                  <td className="py-2 px-3">{b.userId?.name || '-'}</td>
                  <td className="py-2 px-3">{b.driverId?.userId?.name || b.driverId?.name || '-'}</td>
                  <td className="py-2 px-3">{trunc(from)}</td>
                  <td className="py-2 px-3">{trunc(to)}</td>
                  <td className="py-2 px-3">{b.status}</td>
                  <td className="py-2 px-3">₹{b.fare || '-'}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => openBookingDetails(b)}
                      className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-xs"
                    >
                      Details
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <AdminBookingDetailsModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        booking={bookingDetails}
      />
    </Layout>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function DriverProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/drivers/me');
      const d = res.data?.driver;
      if (d) {
        setLicenseNumber(d.licenseNumber || '');
        setVehicleDetails(d.vehicleDetails || '');
        setName(d.userId?.name || '');
        setEmail(d.userId?.email || '');
        setPhone(d.userId?.phone || '');
        const img = d.profileImage || d.userId?.profileImage || '';
        setProfileImage(img);
        setImagePreview(img || null);
      }
    } catch (e) {
      setError('Failed to load profile');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    // basic validation
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    const phoneOk = /^\d{10}$/.test(phone);
    if (!emailOk) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      toast.error(msg);
      setSaving(false);
      return;
    }
    if (!phoneOk) {
      const msg = 'Please enter a valid 10-digit phone number.';
      setError(msg);
      toast.error(msg);
      setSaving(false);
      return;
    }
    try {
      // save driver fields (and keep driver.profileImage in sync)
      const driverReq = api.put('/drivers/me', { licenseNumber, vehicleDetails, profileImage });
      // save user profile image (linked user)
      const userReq = api.put('/auth/users/me', { name, email, phone, profileImage });
      await Promise.all([driverReq, userReq]);
      setSuccess('Profile updated successfully');
      toast.success('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 2000);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to update profile';
      setError(msg);
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Image is too large. Please select a file under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - size) / 2);
        const sy = Math.floor((img.height - size) / 2);
        const canvas = document.createElement('canvas');
        const outSize = 256;
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, size, size, 0, 0, outSize, outSize);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setProfileImage(dataUrl);
        setImagePreview(dataUrl);
      };
      img.onerror = () => setError('Could not load image. Try another file.');
      img.src = reader.result;
    };
    reader.onerror = () => setError('Failed to read image file.');
    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-8 mt-8 animate-fade-in border border-indigo-50">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div
              className={`w-28 h-28 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-indigo-500 font-bold text-2xl shadow ${dragOver ? 'ring-4 ring-indigo-200' : ''}`}
              onDragOver={(e) => { if (editMode && !saving) { e.preventDefault(); setDragOver(true); } }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (editMode && !saving) {
                  e.preventDefault(); setDragOver(false);
                  const file = e.dataTransfer.files && e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name.charAt(0).toUpperCase() : 'D'}</span>
              )}
            </div>
            {/* Hidden file input for avatar */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {editMode && !saving && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="bg-white text-indigo-600 text-sm px-3 py-1.5 rounded-full shadow hover:bg-indigo-50 border"
                >
                  Upload Photo
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setProfileImage(''); }}
                    className="bg-white text-rose-600 text-xs font-semibold px-2 py-1 rounded-full shadow hover:bg-rose-50 border"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-indigo-700">Driver Profile</h2>
            <div className="mt-1 text-sm text-gray-500">Manage your driver information</div>
            {error && <div className="mt-3 bg-red-50 text-red-700 rounded px-3 py-2 border border-red-200">{error}</div>}
            {success && <div className="mt-3 bg-green-50 text-green-700 rounded px-3 py-2 border border-green-200">{success}</div>}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-indigo-400">Loading...</div>
        ) : (
          <form onSubmit={onSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${editMode ? 'focus:ring-2 focus:ring-indigo-300' : 'bg-gray-50'} `}
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${editMode ? 'focus:ring-2 focus:ring-indigo-300' : 'bg-gray-50'} `}
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit phone number"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${editMode ? 'focus:ring-2 focus:ring-indigo-300' : 'bg-gray-50'} `}
                disabled={!editMode}
              />
            </div>

            <div className="md:col-span-2 mt-2">
              <label className="block text-xs text-gray-500 mb-1">License Number</label>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g., DL-0420190012345"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${editMode ? 'focus:ring-2 focus:ring-indigo-300' : 'bg-gray-50'} `}
                disabled={!editMode}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Vehicle Details</label>
              <textarea
                value={vehicleDetails}
                onChange={(e) => setVehicleDetails(e.target.value)}
                placeholder="Make, model, color, plate"
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${editMode ? 'focus:ring-2 focus:ring-indigo-300' : 'bg-gray-50'} `}
                disabled={!editMode}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="px-5 py-2 rounded font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); load(); }}
                    className="px-5 py-2 rounded font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-5 py-2 rounded font-semibold text-white ${saving ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}

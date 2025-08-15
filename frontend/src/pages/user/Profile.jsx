import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', profileImage: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users/me');
      setUser(res.data.user);
      setForm({
        name: res.data.user.name || '',
        email: res.data.user.email || '',
        phone: res.data.user.phone || '',
        profileImage: res.data.user.profileImage || '',
      });
      setImagePreview(res.data.user.profileImage || null);
    } catch (err) {
      setError('Failed to fetch user info');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    // Validate size (< 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Image is too large. Please select a file under 2MB.');
      return;
    }
    // Read and auto square-crop to 256x256
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
        setForm(f => ({ ...f, profileImage: dataUrl }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.put('/auth/users/me', form);
      setSuccess('Profile updated!');
      setEdit(false);
      fetchUser();
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed');
    }
    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="max-w-5xl w-full mx-auto bg-white/90 rounded-3xl shadow-2xl p-0 mt-16 animate-fade-in flex flex-col gap-8 border border-indigo-100">
        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-3xl px-10 py-8 flex flex-col items-center justify-center text-white shadow-lg">
          <div
            className={`relative w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-6xl mb-2 border-4 border-white shadow-xl overflow-hidden ${dragOver ? 'ring-4 ring-white/70' : ''}`}
            onDragOver={(e) => { if (edit && !submitting) { e.preventDefault(); setDragOver(true); } }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { 
              if (edit && !submitting) {
                e.preventDefault(); setDragOver(false);
                const file = e.dataTransfer.files && e.dataTransfer.files[0];
                if (file) handleFile(file);
              }
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="object-cover w-full h-full" />
            ) : (
              <span role="img" aria-label="User">👤</span>
            )}
            {submitting && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></span>
              </div>
            )}
            {edit && !submitting && (
              <div className="absolute -bottom-2 right-0 translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="bg-white text-indigo-600 text-base px-2 py-2 rounded-full shadow hover:bg-indigo-50"
                  aria-label="Change Photo"
                  title="Change Photo"
                >
                  <span role="img" aria-label="Camera">📷</span>
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setForm(f => ({ ...f, profileImage: '' })); }}
                    className="bg-white text-rose-600 text-xs font-semibold px-2 py-1 rounded-full shadow hover:bg-rose-50"
                    title="Remove Photo"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Hidden file input bound to the avatar change button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {edit && (
            <p className="text-sm opacity-80 mt-1">PNG/JPG, under 2MB</p>
          )}
          {edit && !submitting && (
            <button
              type="button"
              onClick={openFilePicker}
              className="mt-2 px-4 py-2 bg-white text-indigo-700 font-semibold rounded-lg shadow hover:bg-indigo-50"
            >
              Upload Photo
            </button>
          )}
          <h2 className="text-3xl font-bold mb-1">My Profile</h2>
          <p className="text-lg opacity-90">Manage your account information</p>
        </div>
        <div className="px-10 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-indigo-400 text-lg">Loading...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 rounded px-3 py-2 mb-4 text-center">{error}</div>
          ) : (
            <>
              {success && <div className="bg-green-50 text-green-700 rounded px-3 py-2 mb-4 text-center">{success}</div>}
              {!edit ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-1 mb-4">
                    <div className="flex items-center gap-2 text-xl"><span className="font-semibold">Name:</span> <span>{user.name}</span></div>
                    <div className="flex items-center gap-2 text-xl"><span className="font-semibold">Email:</span> <span>{user.email}</span></div>
                    <div className="flex items-center gap-2 text-xl"><span className="font-semibold">Phone:</span> <span>{user.phone}</span></div>
                  </div>
                  <button className="mt-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition w-max" onClick={() => setEdit(true)}>Edit Profile</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center">
                  <div className="w-full flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-white rounded-xl shadow px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition">
                      <span className="text-indigo-400 text-xl">👤</span>
                      <input type="text" name="name" value={form.name} onChange={handleChange} className="flex-1 bg-transparent outline-none" placeholder="Name" required />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl shadow px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition">
                      <span className="text-indigo-400 text-xl">📧</span>
                      <input type="email" name="email" value={form.email} onChange={handleChange} className="flex-1 bg-transparent outline-none" placeholder="Email" required />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl shadow px-4 py-3 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition">
                      <span className="text-indigo-400 text-xl">📞</span>
                      <input type="text" name="phone" value={form.phone} onChange={handleChange} className="flex-1 bg-transparent outline-none" placeholder="Phone" required />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <button type="submit" disabled={submitting} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl shadow-lg transition" onClick={() => setEdit(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

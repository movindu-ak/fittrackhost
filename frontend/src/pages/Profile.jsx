import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, LogOut, Edit2, Check, X } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Input } from '../components/ui/Input';

export function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Get user role from local storage to display correct navigation
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role || 'member';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setEditData({
          email: data.email,
          phone: data.phone || '',
          ageRange: data.ageRange || ''
        });
      } else {
        setMessage('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editData.email || !/\S+@\S+\.\S+/.test(editData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (editData.phone && !/^\d{10}$/.test(editData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (!editData.ageRange) {
      newErrors.ageRange = 'Please select age range';
    }

    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fittrackhost.onrender.com/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: editData.email,
          phone: editData.phone,
          ageRange: editData.ageRange
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setUserData(updated);
        setIsEditing(false);
        setMessage('Profile updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      email: userData.email,
      phone: userData.phone || '',
      ageRange: userData.ageRange || ''
    });
    setErrors({});
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation currentPage="profile" role={userRole} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-neutral-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation currentPage="profile" role={userRole} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${message.includes('success')
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 sticky top-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-full">
                  <User className="w-12 h-12 text-black" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white text-center mb-1">{userData?.name}</h2>
              <p className="text-neutral-400 text-sm text-center mb-6">{userData?.role.charAt(0).toUpperCase() + userData?.role.slice(1)}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <p className="text-sm text-neutral-300">{userData?.email}</p>
                </div>
                {userData?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm text-neutral-300">{userData?.phone}</p>
                  </div>
                )}
                {userData?.ageRange && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm text-neutral-300">{userData?.ageRange} years</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : null}
                <button
                  onClick={handleLogout}
                  className="w-full bg-neutral-700/50 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              {isEditing ? (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Edit Profile</h3>

                  <div className="space-y-5">
                    <Input
                      label="Email Address"
                      type="email"
                      value={editData.email}
                      onChange={(e) => {
                        setEditData(prev => ({ ...prev, email: e.target.value }));
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      error={errors.email}
                    />

                    <Input
                      label="Phone Number (Optional)"
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => {
                        setEditData(prev => ({ ...prev, phone: e.target.value }));
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="07XXXXXXXX"
                      error={errors.phone}
                    />

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Age Range <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editData.ageRange}
                        onChange={(e) => {
                          setEditData(prev => ({ ...prev, ageRange: e.target.value }));
                          if (errors.ageRange) setErrors(prev => ({ ...prev, ageRange: '' }));
                        }}
                        className={`w-full bg-neutral-800 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition ${errors.ageRange ? 'border-red-500' : 'border-neutral-700'
                          }`}
                      >
                        <option value="">Select your age range</option>
                        <option value="10-15">10 - 15 years</option>
                        <option value="16-21">16 - 21 years</option>
                        <option value="22-30">22 - 30 years</option>
                        <option value="31-40">31 - 40 years</option>
                        <option value="41-50">41 - 50 years</option>
                        <option value="51+">51+ years</option>
                      </select>
                      {errors.ageRange && (
                        <p className="text-red-500 text-sm mt-1">{errors.ageRange}</p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-neutral-700">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-black px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Profile Information</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="text-neutral-400 text-sm">Full Name</label>
                      <p className="text-xl text-white font-semibold mt-1">{userData?.name}</p>
                    </div>

                    <div className="border-t border-neutral-700 pt-4">
                      <label className="text-neutral-400 text-sm">Email Address</label>
                      <p className="text-xl text-white font-semibold mt-1">{userData?.email}</p>
                    </div>

                    <div className="border-t border-neutral-700 pt-4">
                      <label className="text-neutral-400 text-sm">Phone Number</label>
                      <p className="text-xl text-white font-semibold mt-1">
                        {userData?.phone || 'Not provided'}
                      </p>
                    </div>

                    <div className="border-t border-neutral-700 pt-4">
                      <label className="text-neutral-400 text-sm">Age Range</label>
                      <p className="text-xl text-white font-semibold mt-1">
                        {userData?.ageRange || 'Not provided'}
                      </p>
                    </div>

                    <div className="border-t border-neutral-700 pt-4">
                      <label className="text-neutral-400 text-sm">Gender</label>
                      <p className="text-xl text-white font-semibold mt-1 capitalize">
                        {userData?.gender || 'Not provided'}
                      </p>
                    </div>

                    <div className="border-t border-neutral-700 pt-4">
                      <label className="text-neutral-400 text-sm">Account Role</label>
                      <p className="text-xl text-white font-semibold mt-1 capitalize">
                        {userData?.role}
                      </p>
                    </div>

                    <div className="border-t border-neutral-700 pt-4">
                      <label className="text-neutral-400 text-sm">Member Since</label>
                      <p className="text-xl text-white font-semibold mt-1">
                        {new Date(userData?.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

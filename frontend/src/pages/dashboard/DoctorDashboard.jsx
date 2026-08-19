import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ speciality: '', experience: 0, qualifications: '', city: '', state: '', idProofLink: '' });

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    } else {
      fetchProfile();
    }
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/doctors/appointments');
      if (res.data) setAppointments(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch appointments');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/doctors/profile');
      setProfile(res.data);
      setProfileForm({
        speciality: res.data.speciality || '',
        experience: res.data.experience || 0,
        qualifications: res.data.qualifications?.join(', ') || '',
        city: res.data.clinicAddress?.city || '',
        state: res.data.clinicAddress?.state || '',
        idProofLink: res.data.idProofLink || ''
      });
    } catch (err) {
      if (err.response?.status !== 404 && err.response?.status !== 500) toast.error('Failed to fetch profile');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/doctors/appointments/${id}/status`, { status });
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      speciality: profileForm.speciality,
      experience: Number(profileForm.experience),
      qualifications: profileForm.qualifications.split(',').map(s => s.trim()),
      clinicAddress: { city: profileForm.city, state: profileForm.state },
      idProofLink: profileForm.idProofLink
    };
    try {
      if (profile) {
        await api.put('/doctors/profile', payload);
        toast.success('Profile updated');
      } else {
        await api.post('/doctors/profile', payload);
        toast.success('Profile created! Awaiting admin verification.');
      }
      fetchProfile();
    } catch (err) {
      toast.error('Failed to save profile');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Scheduled: 'bg-blue-50 text-blue-600 border-blue-200',
      Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      Cancelled: 'bg-red-50 text-red-600 border-red-200',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status}</span>;
  };

  const getVerificationBadge = () => {
    if (!profile) return null;
    const s = profile.verificationStatus || 'pending';
    const styles = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      rejected: 'bg-red-50 text-red-600 border-red-200',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[s]}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  return (
    <div>
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Appointments
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          My Profile
        </button>
      </div>

      {activeTab === 'appointments' ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No appointments found.</td></tr>
              ) : (
                appointments.map(app => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.patient?.name}</div>
                      <div className="text-xs text-gray-400">{app.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>{new Date(app.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{app.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.Status || 'Scheduled')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(!app.Status || app.Status === 'Scheduled') && (
                        <button 
                          onClick={() => handleStatusUpdate(app._id, 'Completed')}
                          className="text-emerald-600 hover:text-emerald-700 text-xs font-medium px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-w-2xl bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{profile ? 'Edit Profile' : 'Create Profile'}</h2>
            {getVerificationBadge()}
          </div>

          {profile?.verificationStatus === 'rejected' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              Your profile has been rejected by the admin. Please update your ID proof and resubmit.
            </div>
          )}

          {profile?.verificationStatus === 'pending' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-600">
              Your profile is pending admin verification. You won't appear in public search until approved.
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Speciality</label>
                <input required type="text" className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" value={profileForm.speciality} onChange={e => setProfileForm({...profileForm, speciality: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Experience (Years)</label>
                <input required type="number" className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" value={profileForm.experience} onChange={e => setProfileForm({...profileForm, experience: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Qualifications (comma separated)</label>
              <input required type="text" className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" value={profileForm.qualifications} onChange={e => setProfileForm({...profileForm, qualifications: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input required type="text" className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">State</label>
                <input required type="text" className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" value={profileForm.state} onChange={e => setProfileForm({...profileForm, state: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ID / License Proof Link</label>
              <input required type="url" placeholder="https://drive.google.com/..." className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" value={profileForm.idProofLink} onChange={e => setProfileForm({...profileForm, idProofLink: e.target.value})} />
              <p className="text-xs text-gray-400 mt-1">Paste a Google Drive, Dropbox, or any cloud link to your medical license / ID proof.</p>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg mt-4 transition-colors">
              {profile ? 'Update Profile' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;

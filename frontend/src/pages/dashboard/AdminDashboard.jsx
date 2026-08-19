import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('doctors');
  const [users, setUsers] = useState([]);
  const [doctorProfiles, setDoctorProfiles] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (activeTab === 'doctors') {
      fetchDoctorProfiles();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchAppointments();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/usersList');
      if (res.data) setUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchDoctorProfiles = async () => {
    try {
      const res = await api.get('/admin/doctors');
      if (res.data?.data) setDoctorProfiles(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch doctor profiles');
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/admin/appointments');
      if (res.data && res.data.data) setAppointments(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch appointments');
    }
  };

  const handleVerify = async (doctorId, action) => {
    try {
      await api.put(`/admin/verifyDoctor/${doctorId}`, { verificationStatus: action });
      toast.success(`Doctor ${action} successfully`);
      fetchDoctorProfiles();
    } catch (err) {
      toast.error('Failed to update verification');
    }
  };

  const getVerifBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      rejected: 'bg-red-50 text-red-600 border-red-200',
    };
    const s = status || 'pending';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[s]}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  return (
    <div>
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('doctors')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'doctors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Doctor Verification
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          All Users
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          All Appointments
        </button>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'doctors' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Doctor</th>
                  <th className="px-6 py-4 font-medium">Speciality</th>
                  <th className="px-6 py-4 font-medium">ID Proof</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctorProfiles.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No doctor profiles found.</td></tr>
                ) : (
                  doctorProfiles.map(doc => (
                    <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{doc.user?.name}</div>
                        <div className="text-xs text-gray-400">{doc.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{doc.speciality}</td>
                      <td className="px-6 py-4">
                        {doc.idProofLink ? (
                          <a href={doc.idProofLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-xs font-medium underline">
                            View Proof →
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getVerifBadge(doc.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {doc.verificationStatus !== 'approved' && (
                          <button 
                            onClick={() => handleVerify(doc._id, 'approved')}
                            className="text-emerald-600 hover:text-emerald-700 text-xs font-medium px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {doc.verificationStatus !== 'rejected' && (
                          <button 
                            onClick={() => handleVerify(doc._id, 'rejected')}
                            className="text-red-600 hover:text-red-700 text-xs font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'users' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : u.role === 'doctor' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Doctor</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No appointments found.</td></tr>
                ) : (
                  appointments.map(app => (
                    <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{app.patient?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">Dr. {app.doctor?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(app.date).toLocaleDateString()} <span className="text-gray-400 text-xs ml-1">{app.timeSlot}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          app.Status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          app.Status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {app.Status || 'Scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt("Reason for cancellation?");
    if (!reason) return;
    try {
      await api.put(`/appointments/${id}/cancel`, { reason });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to cancel appointment');
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>
      
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No appointments found.</td></tr>
              ) : (
                appointments.map(app => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.doctor?.name}</div>
                      <div className="text-xs text-gray-400">{app.doctor?.email}</div>
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
                          onClick={() => handleCancel(app._id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

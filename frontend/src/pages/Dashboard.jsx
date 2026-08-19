import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import PatientDashboard from './dashboard/PatientDashboard';
import DoctorDashboard from './dashboard/DoctorDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

const Dashboard = () => {
  const user = useSelector(selectUser);

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4 uppercase">
            {user.name?.charAt(0)}
          </div>
          <h2 className="text-center text-gray-900 font-semibold truncate">{user.name}</h2>
          <p className="text-center text-xs text-gray-500 uppercase tracking-wider mt-1">{user.role}</p>
        </div>
        <nav className="mt-6 px-4">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium cursor-default">
            Overview
          </div>
        </nav>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {user.role === 'patient' && <PatientDashboard />}
        {user.role === 'doctor' && <DoctorDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;

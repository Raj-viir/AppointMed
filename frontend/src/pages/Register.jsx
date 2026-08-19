import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'patient' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await api.post('/auth/register', { 
        name: formData.name, 
        email: formData.email, 
        password: formData.password,
        role: formData.role
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">I am a</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'patient'})}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                  formData.role === 'patient' 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'doctor'})}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                  formData.role === 'doctor' 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                Doctor
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>
          {formData.role === 'doctor' && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              After registration, an admin must verify your profile before patients can book with you.
            </p>
          )}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-6">
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

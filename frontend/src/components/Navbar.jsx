import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logout } from '../store/authSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineUserCircle, HiArrowRightOnRectangle } from 'react-icons/hi2';

const Navbar = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight">AppointMed</Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-500 hidden sm:block">Hello, {user.name}</span>
                <Link to="/dashboard" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  <HiOutlineUserCircle className="w-5 h-5 mr-1" />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <HiArrowRightOnRectangle className="w-5 h-5 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-gray-900 transition-colors">Sign In</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

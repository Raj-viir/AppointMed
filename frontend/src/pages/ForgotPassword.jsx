import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Please enter a valid 6-digit OTP');
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await api.post('/auth/reset-password-otp', {
        email,
        otp: otp.join(''),
        newPassword: passwords.newPassword
      });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {i}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'Reset Password'}
        </h2>

        {step === 1 && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-sm text-gray-500 text-center">Enter the 6-digit code sent to {email}</p>
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  maxLength="1"
                  className="w-12 h-14 bg-white border border-gray-300 rounded-lg text-center text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors">
                Back
              </button>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                Verify
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

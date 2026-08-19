import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineMagnifyingGlass, HiOutlineCalendar, HiOutlineMapPin, HiOutlineClock } from 'react-icons/hi2';

const Landing = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocUserId, setSelectedDocUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (q = '') => {
    try {
      const res = await api.get(`/doctors/getList${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch doctors');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(searchQuery);
  };

  const handleCheckAvailability = async (doctorUserId, date) => {
    if (!date) return toast.error('Please select a date');
    try {
      const res = await api.get(`/doctors/availability?doctorId=${doctorUserId}&date=${date}`);
      if (res.data.success) {
        setSlots(res.data.data);
        if (res.data.data.length === 0 && res.data.message) {
          toast(res.data.message, { icon: 'ℹ️' });
        }
      }
    } catch (err) {
      toast.error('Failed to fetch availability');
    }
  };

  const handleBookSlot = async (doctorUserId, slot) => {
    if (!user) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
    if (user.role !== 'patient') {
      return toast.error('Only patients can book appointments');
    }
    try {
      const res = await api.post('/appointments', {
        doctorId: doctorUserId,
        date: selectedDate,
        timeSlot: slot
      });
      if (res.data.success) {
        toast.success('Appointment booked successfully!');
        setSelectedDocUserId(null);
        setSlots([]);
        setSelectedDate('');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Find the right Doctor, book in seconds</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">Access top medical professionals in your area. Quick, easy, and secure appointment booking.</p>
        
        {/* Unified Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 justify-center items-center max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by doctor name, speciality, or city..." 
              className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm">
            Search
          </button>
        </form>
      </div>

      {/* Doctor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doc => {
          const docUserId = doc.user._id;
          const isExpanded = selectedDocUserId === docUserId;

          return (
            <div key={docUserId} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full text-xl font-bold uppercase">
                  {doc.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Dr. {doc.user.name}</h3>
                  <p className="text-blue-600 text-sm font-medium">{doc.speciality}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6 flex-1 text-sm text-gray-500">
                <p className="flex items-center gap-2"><HiOutlineMapPin className="w-4 h-4 text-gray-400"/> {doc.clinicAddress?.city}, {doc.clinicAddress?.state}</p>
                <p className="flex items-center gap-2"><HiOutlineClock className="w-4 h-4 text-gray-400"/> {doc.experience} years experience</p>
                <p>Quals: {doc.qualifications?.join(', ')}</p>
                {doc.availability?.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Available: {doc.availability.map(a => a.day).join(', ')}
                  </p>
                )}
              </div>

              {isExpanded ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-auto">
                  <label className="block text-sm mb-2 text-gray-600">Select Date:</label>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="date" 
                      className="flex-1 bg-white border border-gray-300 rounded py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <button 
                      onClick={() => handleCheckAvailability(docUserId, selectedDate)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm text-white transition-colors"
                    >
                      Check
                    </button>
                  </div>
                  
                  {slots.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Click a slot to book:</p>
                      <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {slots.map(slot => (
                          <button 
                            key={slot}
                            onClick={() => handleBookSlot(docUserId, slot)}
                            className="bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 text-blue-600 hover:text-white py-1 px-2 rounded text-xs font-medium transition-colors"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {slots.length === 0 && selectedDate && (
                    <p className="text-xs text-gray-400 mt-2">Click Check to see available slots</p>
                  )}
                  
                  <button 
                    onClick={() => { setSelectedDocUserId(null); setSlots([]); setSelectedDate(''); }}
                    className="w-full mt-4 text-xs text-gray-400 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setSelectedDocUserId(docUserId); setSlots([]); setSelectedDate(''); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-auto flex justify-center items-center gap-2"
                >
                  <HiOutlineCalendar className="w-5 h-5"/> Check Availability
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {doctors.length === 0 && (
        <div className="text-center text-gray-400 mt-12">
          No doctors found. Try adjusting your search.
        </div>
      )}
    </div>
  );
};

export default Landing;

import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";

// @desc    Get all users
// @route   GET /api/admin/usersList
// @access  Admin
const getAllUsers = asyncHandler(async(req,res)=>{
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
});

// @desc    Create a doctor account with temporary password
// @route   POST /api/admin/addDoctor
// @access  Admin
const createDoctor =asyncHandler(async (req,res) =>{
    const {name, email ,password}=req.body;
    const userExists = await User.findOne({email});
    if(userExists){
        res.status(400);
        throw new Error("User already exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password , salt);
    const user = await User.create({
        name, 
        email,
        password:hashedPassword,
        role: 'doctor',
        isPasswordTemporary: true,
    });
    if(user){
        res.status(201);
        res.json({
            _id : user.id,
            name:user.name,
            email: user.email,
            role:user.role
        });
    }else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Verify or unverify a doctor profile
// @route   PUT /api/admin/verifyDoctor/:id
// @access  Admin
const verifyDoctor = asyncHandler(async (req, res) => {
    const doctorProfile = await Doctor.findById(req.params.id);

    if (!doctorProfile) {
        res.status(404);
        throw new Error("Doctor profile not found");
    }

    const { verificationStatus } = req.body;

    if (!verificationStatus || !['approved', 'rejected'].includes(verificationStatus)) {
        res.status(400);
        throw new Error("verificationStatus must be 'approved' or 'rejected'");
    }

    doctorProfile.verificationStatus = verificationStatus;
    doctorProfile.isVerified = verificationStatus === 'approved';

    await doctorProfile.save();

    res.status(200).json({
        success: true,
        message: `Doctor ${verificationStatus} successfully.`,
        data: doctorProfile,
    });
});

// @desc    Get all appointments (admin view)
// @route   GET /api/admin/appointments
// @access  Admin
const getAllAppointments = asyncHandler(async (req, res) => {
    const { status, doctorId, patientId, date, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.Status = status;
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;

    if (date) {
        const requestedDate = dayjs(date);
        query.date = {
            $gte: requestedDate.startOf('day').toDate(),
            $lte: requestedDate.endOf('day').toDate(),
        };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
        Appointment.find(query)
            .populate('doctor', 'name email')
            .populate('patient', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Appointment.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        count: appointments.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: appointments,
    });
});

// @desc    Get all doctor profiles (admin view — includes unverified)
// @route   GET /api/admin/doctors
// @access  Admin
const getAllDoctorProfiles = asyncHandler(async (req, res) => {
    const doctors = await Doctor.find({}).populate('user', 'name email');
    res.status(200).json({
        success: true,
        count: doctors.length,
        data: doctors,
    });
});

export { getAllUsers, createDoctor, verifyDoctor, getAllAppointments, getAllDoctorProfiles };
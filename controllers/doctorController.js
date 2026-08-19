import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js"
import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import dayjs from "dayjs";

// @desc    Create doctor profile
// @route   POST /api/doctors/profile
// @access  Doctor
const createDoctorProfile = asyncHandler(async (req,res)=>{
    const userId = req.user.id;
    const userExists = await Doctor.findOne({user:userId});
    if(userExists){
        res.status(400);
        throw new Error("Doctor already exists!");
        
    }
    const { speciality, qualifications, experience, clinicAddress, availability, idProofLink } = req.body;

    const doctorProfile = await Doctor.create({
        user: userId,
        speciality,
        qualifications,
        experience,
        clinicAddress,
        idProofLink: idProofLink || '',
        isVerified: false,
        verificationStatus: 'pending',
        availability
    });

    res.status(201).json(doctorProfile);

});

// @desc    View own doctor profile
// @route   GET /api/doctors/profile
// @access  Doctor
const viewDoctorProfile= asyncHandler(async(req,res)=>{
    const doctor = await Doctor.findOne({user: req.user.id});
    if(doctor){
        res.status(200);
        res.json(doctor.toObject());
    }else{
        res.status(500);
        throw new Error("Doctor Profile Not Found!");   
    }

});

// @desc    Update own doctor profile
// @route   PUT /api/doctors/profile
// @access  Doctor
 const updateDoctorProfile= asyncHandler(async(req,res)=>{
    const oldProfile = await Doctor.findOne({user:req.user.id});
    if(oldProfile){
        oldProfile.speciality = req.body.speciality || oldProfile.speciality,
        oldProfile.qualifications = req.body.qualifications || oldProfile.qualifications;
        oldProfile.experience = req.body.experience !== undefined ? req.body.experience : oldProfile.experience;
        
        //updating availability
        oldProfile.availability = req.body.availability || oldProfile.availability;
        
        //Updating address   
        if (req.body.clinicAddress) {
            oldProfile.clinicAddress.street = req.body.clinicAddress.street || oldProfile.clinicAddress.street;
            oldProfile.clinicAddress.city = req.body.clinicAddress.city || oldProfile.clinicAddress.city;
            oldProfile.clinicAddress.state = req.body.clinicAddress.state || oldProfile.clinicAddress.state;
            oldProfile.clinicAddress.postalCode = req.body.clinicAddress.postalCode || oldProfile.clinicAddress.postalCode;
        }

        // Update ID proof link if provided
        if (req.body.idProofLink !== undefined) {
            oldProfile.idProofLink = req.body.idProofLink;
        }
        
        const updatedProfile = await oldProfile.save();

        res.status(200).json(updatedProfile.toObject());

    }else{
        res.status(404);
        throw new Error("Doctor Profile Not Found");
        
    }

 });

// @desc    Get all verified doctors (with search & filter)
// @route   GET /api/doctors/getList
// @access  Patient
 const getAllDoctors = asyncHandler(async (req,res)=>{
    // Build query — only approved doctors are publicly visible
    const query = { verificationStatus: 'approved' };

    // Filter by specialty (specific filter)
    if (req.query.speciality) {
        query.speciality = { $regex: req.query.speciality, $options: 'i' };
    }

    // Filter by city (specific filter)
    if (req.query.city) {
        query['clinicAddress.city'] = { $regex: req.query.city, $options: 'i' };
    }

    // Filter by state (specific filter)
    if (req.query.state) {
        query['clinicAddress.state'] = { $regex: req.query.state, $options: 'i' };
    }

    // Unified search: `q` param matches across speciality, city, state
    if (req.query.q) {
        const searchRegex = { $regex: req.query.q, $options: 'i' };
        query.$or = [
            { speciality: searchRegex },
            { 'clinicAddress.city': searchRegex },
            { 'clinicAddress.state': searchRegex },
        ];
    }

    let doctorProfiles = await Doctor.find(query);

    // For unified `q`, also search by doctor name (User model) and merge results
    if (req.query.q) {
        const nameRegex = new RegExp(req.query.q, 'i');
        const matchingUsers = await User.find({ name: nameRegex }).select('_id');
        const matchingUserIds = matchingUsers.map(u => u._id.toString());

        if (matchingUserIds.length > 0) {
            const existingIds = new Set(doctorProfiles.map(p => p._id.toString()));
            const nameMatchedDoctors = await Doctor.find({
                verificationStatus: 'approved',
                user: { $in: matchingUserIds }
            });
            for (const doc of nameMatchedDoctors) {
                if (!existingIds.has(doc._id.toString())) {
                    doctorProfiles.push(doc);
                }
            }
        }
    }

    // Legacy `search` param: filter by name only
    if (req.query.search) {
        await Doctor.populate(doctorProfiles, { path: 'user', select: 'name email' });
        const nameRegex = new RegExp(req.query.search, 'i');
        doctorProfiles = doctorProfiles.filter(
            profile => profile.user && nameRegex.test(profile.user.name)
        );
    }

    // Populate user details for the final list (if not already populated)
    const populatedProfiles = await Doctor.populate(doctorProfiles, {
        path: 'user',
        select: 'name email',
    });

    res.status(200).json({
        success: true,
        count: populatedProfiles.length,
        data: populatedProfiles,
    });
 });

// @desc    Check doctor availability for a given date
// @route   GET /api/doctors/availability
// @access  Patient
 const checkAvailability = asyncHandler(async (req,res)=>{
        const {doctorId , date} = req.query;
        if(!doctorId || !date){
            res.status(400);
            throw new Error("Doctor Id and date are required");
            
        }
        const doctor = await  Doctor.findOne({user: doctorId });
        if (!doctor || doctor.verificationStatus !== 'approved') {
            res.status(404);
            throw new Error("Doctor not found or not verified");
        }

        const requestedDate = dayjs(date);
        const dayOfWeek = requestedDate.format('dddd');
        const scheduleForDay = doctor.availability.find(d => d.day === dayOfWeek);

        // Fix: return early if doctor is not available on this day
        if (!scheduleForDay) {
            return res.status(200).json({
                success: true,
                message: `Doctor is not available on ${dayOfWeek}s.`,
                data : []
            });
        }

         // Generate all possible time slots for that day
        const slots = [];
        let currentTime = dayjs(`${date} ${scheduleForDay.startTime}`);
        const endTime = dayjs(`${date} ${scheduleForDay.endTime}`);

        while (currentTime.isBefore(endTime)) {
            slots.push(currentTime.format('HH:mm'));
            currentTime = currentTime.add(1, 'hour');
        }

        // Find booked appointments for that day
        const startOfDay = requestedDate.startOf('day').toDate();
        const endOfDay = requestedDate.endOf('day').toDate();

        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            date: { $gte: startOfDay, $lte: endOfDay },
            Status: { $ne: 'Cancelled' },
        });

        const bookedSlots = bookedAppointments.map(app => app.timeSlot);

        // Filter out the booked slots
        const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));

        res.status(200).json({
            success: true,
            data: availableSlots,
        });
 });

// @desc    Get doctor's own appointments
// @route   GET /api/doctors/appointments
// @access  Doctor
const getDoctorAppointments = asyncHandler(async (req, res) => {
    const { status, date, page = 1, limit = 10 } = req.query;
    const query = { doctor: req.user.id };

    if (status) {
        query.Status = status;
    }

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

// @desc    Update appointment status (mark as Completed)
// @route   PUT /api/doctors/appointments/:id/status
// @access  Doctor
const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status || !['Completed', 'Cancelled'].includes(status)) {
        res.status(400);
        throw new Error("Status must be 'Completed' or 'Cancelled'");
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found");
    }

    if (appointment.doctor.toString() !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to update this appointment");
    }

    if (appointment.Status !== 'Scheduled') {
        res.status(400);
        throw new Error(`Cannot update an appointment that is already ${appointment.Status}`);
    }

    appointment.Status = status;
    if (status === 'Cancelled') {
        appointment.reason = req.body.reason || 'Cancelled by doctor';
    }
    await appointment.save();

    res.status(200).json({
        success: true,
        message: `Appointment marked as ${status}.`,
        data: appointment,
    });
});

export {createDoctorProfile, viewDoctorProfile , updateDoctorProfile,
        getAllDoctors , checkAvailability, getDoctorAppointments, updateAppointmentStatus};
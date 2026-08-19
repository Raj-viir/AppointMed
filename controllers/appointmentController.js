import asyncHandler from "express-async-handler";
import Appointment from  "../models/appointmentModel.js";
import Doctor from "../models/doctorModel.js";
import User from "../models/userModel.js";
import dayjs from "dayjs";
import sendMail from "../config/mailer.js";
import stripe from "../config/stripe.js";
import { appointmentBooked, appointmentCancelled, appointmentRescheduled, doctorNewAppointment } from "../utils/emailTemplates.js";

// @desc    Book an appointment (Stripe payment is optional)
// @route   POST /api/appointments
// @access  Patient
const bookAppointment = asyncHandler(async (req, res) => {
    const { doctorId, date, timeSlot, paymentIntentId } = req.body;
    const patientId = req.user.id;

    const doctor = await Doctor.findOne({ user: doctorId });

    if (!doctor || !doctor.isVerified) {
        res.status(404);
        throw new Error("Doctor not found or not verified");
    }

    const appointmentDate = dayjs(date);
    const dayOfWeek = appointmentDate.format('dddd');

    const scheduleForDay = doctor.availability.find(d => d.day === dayOfWeek);
    if (!scheduleForDay) {
        res.status(400);
        throw new Error(`Doctor is not available on ${dayOfWeek}s.`);
    }

    const slotTime = dayjs(`${date} ${timeSlot}`);
    const startTime = dayjs(`${date} ${scheduleForDay.startTime}`);
    const endTime = dayjs(`${date} ${scheduleForDay.endTime}`);

    if (slotTime.isBefore(startTime) || slotTime.isAfter(endTime)) {
        res.status(400);
        throw new Error("The selected time slot is outside the doctor's working hours.");
    }

    // ─── OPTIONAL PAYMENT VERIFICATION ──────────────────────────────────
    let paymentStatus = 'pending';
    let amount = doctor.consultationFee * 100; // Expected amount in paise

    if (paymentIntentId) {
        // If a payment intent is provided, verify it directly with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            res.status(402);
            throw new Error(`Payment not completed. Current status: ${paymentIntent.status}`);
        }

        if (paymentIntent.metadata.patientId !== patientId) {
            res.status(403);
            throw new Error('This payment does not belong to your account.');
        }

        paymentStatus = 'paid';
        amount = paymentIntent.amount; // Use the exact amount charged
    }
    // ────────────────────────────────────────────────────────────────────

    // Attempt to create — the compound unique index will reject duplicates
    try {
        const appointment = await Appointment.create({
            doctor: doctorId,
            patient: patientId,
            date: appointmentDate.toDate(),
            timeSlot,
            paymentStatus,
            paymentIntentId: paymentIntentId || '',
            amount,
        });

        // Send email notifications (fire-and-forget)
        const doctorUser = await User.findById(doctorId).select('name email');
        const patientUser = await User.findById(patientId).select('name email');
        const formattedDate = appointmentDate.format('dddd, MMMM D, YYYY');

        if (patientUser) {
            sendMail(
                patientUser.email,
                'Appointment Confirmed',
                appointmentBooked(patientUser.name, doctorUser?.name || 'Doctor', formattedDate, timeSlot)
            );
        }
        if (doctorUser) {
            sendMail(
                doctorUser.email,
                'New Appointment Booked',
                doctorNewAppointment(doctorUser.name, patientUser?.name || 'Patient', formattedDate, timeSlot)
            );
        }

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully.',
            data: appointment,
        });
    } catch (error) {
        // E11000 = MongoDB duplicate key error → race condition caught
        if (error.code === 11000) {
            res.status(409);
            throw new Error("This time slot is no longer available. Please select another time.");
        }
        throw error;
    }
});

// @desc    Get my appointments (patient)
// @route   GET /api/appointments
// @access  Patient
const getMyAppointments = asyncHandler(async (req, res) => {
    const { status, date, page = 1, limit = 10 } = req.query;
    const query = { patient: req.user.id };

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
            .populate('doctor', 'name email')
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

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Patient
const cancelAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found");
    }

    // Ensure the patient owns this appointment
    if (appointment.patient.toString() !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to cancel this appointment");
    }

    if (appointment.Status !== 'Scheduled') {
        res.status(400);
        throw new Error(`Cannot cancel an appointment that is already ${appointment.Status}`);
    }

    const reason = req.body.reason || 'Cancelled by patient';
    appointment.Status = 'Cancelled';
    appointment.reason = reason;
    await appointment.save();

    // Send cancellation email
    const patientUser = await User.findById(appointment.patient).select('name email');
    const doctorUser = await User.findById(appointment.doctor).select('name email');
    const formattedDate = dayjs(appointment.date).format('dddd, MMMM D, YYYY');

    if (patientUser) {
        sendMail(
            patientUser.email,
            'Appointment Cancelled',
            appointmentCancelled(patientUser.name, doctorUser?.name || 'Doctor', formattedDate, appointment.timeSlot, reason)
        );
    }

    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully.',
        data: appointment,
    });
});

// @desc    Reschedule an appointment — create new slot first, then release old
// @route   PUT /api/appointments/:id/reschedule
// @access  Patient
const rescheduleAppointment = asyncHandler(async (req, res) => {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
        res.status(400);
        throw new Error("New date and timeSlot are required for rescheduling");
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found");
    }

    if (appointment.patient.toString() !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to reschedule this appointment");
    }

    if (appointment.Status !== 'Scheduled') {
        res.status(400);
        throw new Error(`Cannot reschedule an appointment that is ${appointment.Status}`);
    }

    // Validate new slot against doctor's availability
    const doctor = await Doctor.findOne({ user: appointment.doctor });
    if (!doctor || !doctor.isVerified) {
        res.status(404);
        throw new Error("Doctor not found or not verified");
    }

    const newDate = dayjs(date);
    const dayOfWeek = newDate.format('dddd');
    const scheduleForDay = doctor.availability.find(d => d.day === dayOfWeek);

    if (!scheduleForDay) {
        res.status(400);
        throw new Error(`Doctor is not available on ${dayOfWeek}s.`);
    }

    const slotTime = dayjs(`${date} ${timeSlot}`);
    const startTime = dayjs(`${date} ${scheduleForDay.startTime}`);
    const endTime = dayjs(`${date} ${scheduleForDay.endTime}`);

    if (slotTime.isBefore(startTime) || slotTime.isAfter(endTime)) {
        res.status(400);
        throw new Error("The selected time slot is outside the doctor's working hours.");
    }

    // Save old details for email before any modification
    const oldDate = dayjs(appointment.date).format('dddd, MMMM D, YYYY');
    const oldTime = appointment.timeSlot;

    // ── STEP 1: Create new appointment FIRST ─────────────────────────────
    // If this fails (slot taken → E11000), the old appointment is completely
    // untouched. No rollback needed. This is the most common failure case.
    let newAppointment;
    try {
        newAppointment = await Appointment.create({
            doctor: appointment.doctor,
            patient: req.user.id,
            date: newDate.toDate(),
            timeSlot,
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(409);
            throw new Error("The new time slot is not available. Your original appointment is unchanged.");
        }
        throw error;
    }

    // ── STEP 2: Cancel the old appointment ───────────────────────────────
    // New appointment is already confirmed at this point.
    // In the extremely rare event this save fails (e.g., transient DB blip),
    // the new booking is still valid — we log the inconsistency for admin
    // resolution rather than leaving the patient with zero appointments.
    try {
        appointment.Status = 'Cancelled';
        appointment.reason = 'Rescheduled by patient';
        await appointment.save();
    } catch (cancelError) {
        console.error(
            `[RESCHEDULE] Partial state: new appointment ${newAppointment._id} confirmed ` +
            `but old appointment ${appointment._id} could not be cancelled. Requires manual resolution.`,
            cancelError.message
        );
        // Do NOT throw — the patient's new appointment is valid and must be honoured.
    }

    // Send reschedule email
    const patientUser = await User.findById(req.user.id).select('name email');
    const doctorUser = await User.findById(appointment.doctor).select('name email');
    const formattedNewDate = newDate.format('dddd, MMMM D, YYYY');

    if (patientUser) {
        sendMail(
            patientUser.email,
            'Appointment Rescheduled',
            appointmentRescheduled(patientUser.name, doctorUser?.name || 'Doctor', oldDate, oldTime, formattedNewDate, timeSlot)
        );
    }

    res.status(201).json({
        success: true,
        message: 'Appointment rescheduled successfully. Your new appointment is confirmed. The previous slot has been released.',
        data: {
            cancelled: appointment,
            new: newAppointment,
        },
    });
});

export { bookAppointment, getMyAppointments, cancelAppointment, rescheduleAppointment };
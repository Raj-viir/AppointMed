import asyncHandler from 'express-async-handler';
import stripe from '../config/stripe.js';
import Doctor from '../models/doctorModel.js';

const createPaymentIntent = asyncHandler(async (req, res) => {
    const { doctorId, date, timeSlot } = req.body;

    if (!doctorId || !date || !timeSlot) {
        res.status(400);
        throw new Error('doctorId, date, and timeSlot are required');
    }

    const doctor = await Doctor.findOne({ user: doctorId });

    if (!doctor || doctor.verificationStatus !== 'approved') {
        res.status(404);
        throw new Error('Doctor not found or not verified');
    }

    const amountInPaise = doctor.consultationFee * 100;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPaise,
        currency: 'inr',
        metadata: {
            doctorId: doctorId,
            date: date,
            timeSlot: timeSlot,
            patientId: req.user.id,
        },
        description: 'Appointment booking - ' + date + ' ' + timeSlot,
    });

    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: doctor.consultationFee,
    });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
        res.status(400);
        throw new Error('paymentIntentId is required');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
    });
});

export { createPaymentIntent, getPaymentStatus };
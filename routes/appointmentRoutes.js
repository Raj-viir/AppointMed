import express from 'express';
import { bookAppointment, getMyAppointments, cancelAppointment, rescheduleAppointment } from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateAppointmentBooking } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('patient'), getMyAppointments);
router.post('/', protect, authorize('patient'), validateAppointmentBooking, bookAppointment);
router.put('/:id/cancel', protect, authorize('patient'), cancelAppointment);
router.put('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);

export default router;

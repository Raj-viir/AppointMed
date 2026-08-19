import express from 'express';
import { checkAvailability, createDoctorProfile, getAllDoctors, updateDoctorProfile, viewDoctorProfile, getDoctorAppointments, updateAppointmentStatus } from "../controllers/doctorController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validateDoctorProfile } from "../middleware/validationMiddleware.js";

const router = express.Router(); 

// Doctor profile routes
router.post('/profile', protect, authorize('doctor'), validateDoctorProfile, createDoctorProfile);
router.get('/profile', protect, authorize('doctor'), viewDoctorProfile);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);

// Doctor appointment management
router.get('/appointments', protect, authorize('doctor'), getDoctorAppointments);
router.put('/appointments/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

// Public routes — browsable without login
router.get('/getList', getAllDoctors);
router.get('/availability', checkAvailability);

export default router;

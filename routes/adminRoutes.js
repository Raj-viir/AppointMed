import express from 'express'
import { createDoctor, getAllUsers, verifyDoctor, getAllAppointments, getAllDoctorProfiles } from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/usersList', protect, authorize('admin'), getAllUsers);
router.get('/doctors', protect, authorize('admin'), getAllDoctorProfiles);
router.post('/addDoctor', protect, authorize('admin'), createDoctor);
router.put('/verifyDoctor/:id', protect, authorize('admin'), verifyDoctor);
router.get('/appointments', protect, authorize('admin'), getAllAppointments);

export default router;
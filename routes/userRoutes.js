import express from 'express'
import { getMyProfile } from '../controllers/userController.js'
import { protect , authorize } from '../middleware/authMiddleware.js'
const router = express.Router()
router.get('/profile' , protect, getMyProfile);

export default router;
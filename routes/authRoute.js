import express from "express";
import { registerUser, loginUser, updatePassword, forgotPassword, resetPasswordWithOTP, refreshToken, logout } from "../controllers/authController.js";
import { validateRegistration, validateLogin } from "../middleware/validationMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router= express.Router();

router.post('/register', authLimiter, validateRegistration, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.put('/reset-password', updatePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password-otp', authLimiter, resetPasswordWithOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
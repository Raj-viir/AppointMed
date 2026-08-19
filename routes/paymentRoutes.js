import express from 'express';
import { createPaymentIntent, getPaymentStatus } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Both routes require a logged-in patient
router.post(
    '/create-intent',
    authLimiter,                    // reuse the strict limiter — payment is sensitive
    protect,
    authorize('patient'),
    createPaymentIntent
);

router.get(
    '/status/:paymentIntentId',
    protect,
    authorize('patient'),
    getPaymentStatus
);

export default router;

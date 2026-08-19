import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

/**
 * Build the store config — use Redis only if connected,
 * otherwise use the built-in in-memory store.
 */
const buildStoreOption = () => {
    if (redisClient && redisClient.status === 'ready') {
        try {
            return {
                store: new RedisStore({
                    sendCommand: (...args) => redisClient.call(...args),
                }),
            };
        } catch {
            return {};
        }
    }
    return {};
};

// Check Redis status after a brief delay to allow connection
let storeOption = {};
setTimeout(() => {
    storeOption = buildStoreOption();
    if (storeOption.store) {
        console.log('Rate limiter upgraded to Redis store.');
    }
}, 3000);

/**
 * Rate limiter for auth endpoints — 15 req / 15 min per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

/**
 * General API rate limiter — 100 req / 15 min per IP.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' },
});

export { authLimiter, apiLimiter };

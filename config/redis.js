import Redis from 'ioredis';

let redisClient = null;

if (process.env.REDIS_HOST) {
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            tls: process.env.REDIS_HOST.includes('upstash.io') ? {} : undefined,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            retryStrategy(times) {
                if (times > 1) {
                    return null;
                }
                return Math.min(times * 500, 3000);
            },
        });

        redisClient.on('connect', () => {
            console.log('Redis Connected');
        });

        redisClient.on('error', (err) => {
            console.warn(`Redis Connection Error: ${err.message}`);
        });
    } catch (err) {
        console.warn('Redis initialization failed — rate limiting will use memory store.');
        redisClient = null;
    }
} else {
    // console.log('No REDIS_HOST provided, using memory store for rate limiting.');
}

export default redisClient;

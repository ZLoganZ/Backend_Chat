import Redis from 'ioredis';

const Redis_url = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(Redis_url);
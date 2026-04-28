import { Request, Response, NextFunction } from 'express';
import { performanceLogger } from '../utils/performance';

// Simple in-memory cache for static data
const cache = new Map<string, { data: any; expiry: number }>();

const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 15 * 60 * 1000,      // 15 minutes
};

export function cacheMiddleware(ttl: number = CACHE_TTL.MEDIUM) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}`;
    const cached = cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      console.log(`🎯 Cache HIT: ${key}`);
      return res.json(cached.data);
    }
    
    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          expiry: Date.now() + ttl
        });
        console.log(`💾 Cache SET: ${key}`);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiry <= now) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

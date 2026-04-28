import { Request, Response, NextFunction } from 'express';

// Simple performance monitoring middleware
export function performanceLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log database queries if available
    if ((req as any).databaseQueryTime) {
      console.log(`DB Query Time: ${(req as any).databaseQueryTime}ms`);
    }
  });
  
  next();
}

// Database query performance tracker
export function trackQueryPerformance<T>(promise: Promise<T>): Promise<T> {
  const start = Date.now();
  
  return promise.then(result => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`⚠️ Slow DB query: ${duration}ms`);
    }
    return result;
  });
}

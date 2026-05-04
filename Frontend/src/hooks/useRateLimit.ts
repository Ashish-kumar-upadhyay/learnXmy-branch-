import { useState, useCallback, useRef } from 'react';

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  isBlocked: boolean;
  blockTimeLeft: number;
}

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  blockDuration: 60000, // 1 minute block
  attemptWindow: 300000, // 5 minutes window
  backoffMultiplier: 2,
  maxBackoff: 300000, // 5 minutes max backoff
};

export function useRateLimit() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: 0,
    isBlocked: false,
    blockTimeLeft: 0,
  });

  const blockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
      blockTimeoutRef.current = null;
    }
    if (backoffTimeoutRef.current) {
      clearTimeout(backoffTimeoutRef.current);
      backoffTimeoutRef.current = null;
    }
  }, []);

  const checkRateLimit = useCallback((): { allowed: boolean; waitTime?: number } => {
    const now = Date.now();
    
    // Check if currently blocked
    if (rateLimitState.isBlocked) {
      const timeLeft = rateLimitState.blockTimeLeft - now;
      if (timeLeft > 0) {
        return { allowed: false, waitTime: timeLeft };
      } else {
        // Block expired, reset
        setRateLimitState({
          attempts: 0,
          lastAttempt: 0,
          isBlocked: false,
          blockTimeLeft: 0,
        });
      }
    }

    // Check if within attempt window
    const timeSinceLastAttempt = now - rateLimitState.lastAttempt;
    if (timeSinceLastAttempt > RATE_LIMIT_CONFIG.attemptWindow) {
      // Window expired, reset attempts
      setRateLimitState(prev => ({
        ...prev,
        attempts: 0,
      }));
    }

    // Check if max attempts reached
    if (rateLimitState.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
      const blockTime = now + RATE_LIMIT_CONFIG.blockDuration;
      setRateLimitState({
        attempts: rateLimitState.attempts + 1,
        lastAttempt: now,
        isBlocked: true,
        blockTimeLeft: blockTime,
      });

      // Set timer to unblock
      clearTimers();
      blockTimeoutRef.current = setTimeout(() => {
        setRateLimitState({
          attempts: 0,
          lastAttempt: 0,
          isBlocked: false,
          blockTimeLeft: 0,
        });
      }, RATE_LIMIT_CONFIG.blockDuration);

      return { allowed: false, waitTime: RATE_LIMIT_CONFIG.blockDuration };
    }

    return { allowed: true };
  }, [rateLimitState, clearTimers]);

  const recordAttempt = useCallback((success: boolean) => {
    const now = Date.now();
    
    if (success) {
      // Reset on success
      setRateLimitState({
        attempts: 0,
        lastAttempt: 0,
        isBlocked: false,
        blockTimeLeft: 0,
      });
      clearTimers();
    } else {
      // Increment attempts on failure
      setRateLimitState(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
        lastAttempt: now,
      }));
    }
  }, [clearTimers]);

  const getBackoffDelay = useCallback((attemptCount: number): number => {
    const delay = Math.min(
      RATE_LIMIT_CONFIG.attemptWindow * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, attemptCount - 1),
      RATE_LIMIT_CONFIG.maxBackoff
    );
    return delay;
  }, []);

  const scheduleRetry = useCallback((callback: () => void, attemptCount: number) => {
    const delay = getBackoffDelay(attemptCount);
    
    clearTimers();
    backoffTimeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
    
    return delay;
  }, [getBackoffDelay, clearTimers]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return {
    rateLimitState,
    checkRateLimit,
    recordAttempt,
    scheduleRetry,
    getBackoffDelay,
    cleanup,
  };
}

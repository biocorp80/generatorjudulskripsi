// Simple in-memory rate limiter for login attempts
// Tracks failed login attempts by IP address

const loginAttempts = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Clean up old entries every hour

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of loginAttempts.entries()) {
        if (now - data.firstAttempt > LOCKOUT_DURATION) {
            loginAttempts.delete(ip);
        }
    }
}, CLEANUP_INTERVAL);

/**
 * Get client IP address from request
 */
function getClientIP(req) {
    // Try multiple headers in order of reliability
    return (
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

/**
 * Check if IP is rate limited
 * @returns {Object} { allowed: boolean, remainingAttempts: number, resetTime: number }
 */
export function checkRateLimit(req) {
    const ip = getClientIP(req);
    const now = Date.now();

    const attemptData = loginAttempts.get(ip);

    // No previous attempts or lockout expired
    if (!attemptData || (now - attemptData.firstAttempt) > LOCKOUT_DURATION) {
        return {
            allowed: true,
            remainingAttempts: MAX_ATTEMPTS,
            resetTime: null,
            ip: ip
        };
    }

    // Check if still locked out
    if (attemptData.count >= MAX_ATTEMPTS) {
        const resetTime = attemptData.firstAttempt + LOCKOUT_DURATION;
        const remainingMs = resetTime - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        return {
            allowed: false,
            remainingAttempts: 0,
            resetTime: resetTime,
            remainingMinutes: remainingMinutes,
            ip: ip
        };
    }

    // Still has attempts remaining
    return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS - attemptData.count,
        resetTime: attemptData.firstAttempt + LOCKOUT_DURATION,
        ip: ip
    };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(req) {
    const ip = getClientIP(req);
    const now = Date.now();

    const attemptData = loginAttempts.get(ip);

    if (!attemptData || (now - attemptData.firstAttempt) > LOCKOUT_DURATION) {
        // First attempt or expired lockout
        loginAttempts.set(ip, {
            count: 1,
            firstAttempt: now,
            lastAttempt: now
        });
    } else {
        // Increment existing attempts
        attemptData.count++;
        attemptData.lastAttempt = now;
        loginAttempts.set(ip, attemptData);
    }

    const remaining = MAX_ATTEMPTS - (loginAttempts.get(ip)?.count || 0);

    return {
        remainingAttempts: Math.max(0, remaining),
        totalAttempts: loginAttempts.get(ip)?.count || 0
    };
}

/**
 * Reset attempts for a specific IP (after successful login)
 */
export function resetAttempts(req) {
    const ip = getClientIP(req);
    loginAttempts.delete(ip);
}

/**
 * Get current stats (for monitoring/debugging)
 */
export function getStats() {
    return {
        totalTrackedIPs: loginAttempts.size,
        maxAttempts: MAX_ATTEMPTS,
        lockoutDurationMinutes: LOCKOUT_DURATION / 60000
    };
}

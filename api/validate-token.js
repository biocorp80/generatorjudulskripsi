// Serverless function to validate token with rate limiting
// Also handles token cutoff (mark-used) for single-use tokens at Step 6
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from './utils/rate-limiter.js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, action } = req.body;

    // =============================================
    // ACTION: mark-used (called from Step 6)
    // Marks a single-use user token as used/hangus
    // =============================================
    if (action === 'mark-used') {
        if (!token || typeof token !== 'string' || token.length !== 16) {
            return res.status(400).json({ success: false, message: 'Token tidak valid' });
        }

        try {
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            const { data: tokenData, error: fetchError } = await supabase
                .from('tokens')
                .select('id, type, is_used')
                .eq('token', token)
                .single();

            if (fetchError || !tokenData) {
                return res.status(404).json({ success: false, message: 'Token tidak ditemukan' });
            }

            // Only mark 'user' type tokens — Admin/VIP are unlimited
            if (tokenData.type !== 'user') {
                return res.status(200).json({ success: true, message: 'Token unlimited, tidak perlu di-cutoff' });
            }

            if (tokenData.is_used) {
                return res.status(200).json({ success: true, message: 'Token sudah ditandai terpakai sebelumnya' });
            }

            const { error: updateError } = await supabase
                .from('tokens')
                .update({ is_used: true, used_at: new Date().toISOString() })
                .eq('token', token);

            if (updateError) {
                console.error('Error marking token as used:', updateError);
                return res.status(500).json({ success: false, message: 'Gagal menandai token' });
            }

            return res.status(200).json({ success: true, message: 'Token berhasil di-cutoff' });

        } catch (error) {
            console.error('Mark token used error:', error);
            return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
        }
    }

    // =============================================
    // DEFAULT ACTION: validate (login flow)
    // =============================================

    // Check rate limit BEFORE processing request
    const rateLimitCheck = checkRateLimit(req);

    if (!rateLimitCheck.allowed) {
        return res.status(429).json({
            valid: false,
            error: 'Too many attempts',
            message: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${rateLimitCheck.remainingMinutes} menit.`,
            remainingMinutes: rateLimitCheck.remainingMinutes,
            resetTime: rateLimitCheck.resetTime
        });
    }

    // Validate input
    if (!token || typeof token !== 'string' || token.length !== 16) {
        recordFailedAttempt(req);

        return res.status(400).json({
            valid: false,
            message: 'Token harus 16 karakter',
            remainingAttempts: rateLimitCheck.remainingAttempts - 1
        });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Check if token exists and is not used
        const { data: tokenData, error: fetchError } = await supabase
            .from('tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (fetchError || !tokenData) {
            const attemptInfo = recordFailedAttempt(req);

            return res.status(401).json({
                valid: false,
                message: 'Token tidak ditemukan',
                remainingAttempts: attemptInfo.remainingAttempts
            });
        }

        // Check if token is already used (ONLY for 'user' type tokens)
        // Admin and VIP tokens are UNLIMITED (can be reused)
        if (tokenData.is_used && tokenData.type === 'user') {
            const attemptInfo = recordFailedAttempt(req);

            return res.status(401).json({
                valid: false,
                message: 'Token sudah terpakai',
                remainingAttempts: attemptInfo.remainingAttempts
            });
        }

        // ✅ TOKEN VALID - Reset rate limit for this IP
        resetAttempts(req);

        // Token 'user' is NOT marked as used here.
        // Cutoff happens at Step 6 via action: 'mark-used'
        // Admin and VIP tokens remain unlimited (never marked as used).

        // Return success with role information
        return res.status(200).json({
            valid: true,
            role: tokenData.type,
            message: tokenData.type === 'user'
                ? 'Token berhasil divalidasi (single use)'
                : `Token berhasil divalidasi (unlimited ${tokenData.type})`
        });

    } catch (error) {
        console.error('Token validation error:', error);
        recordFailedAttempt(req);

        return res.status(500).json({
            valid: false,
            message: 'Terjadi kesalahan server'
        });
    }
}


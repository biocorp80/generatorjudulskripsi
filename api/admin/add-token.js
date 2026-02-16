// Admin endpoint to add a new token
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, type } = req.body;

    // Validate input
    if (!token || typeof token !== 'string' || token.length !== 16) {
        return res.status(400).json({ error: 'Token harus 16 karakter' });
    }

    if (!type || !['admin', 'vip', 'user'].includes(type)) {
        return res.status(400).json({ error: 'Type harus: admin, vip, atau user' });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Insert new token
        const { data, error } = await supabase
            .from('tokens')
            .insert([
                {
                    token: token,
                    type: type,
                    is_used: false
                }
            ])
            .select();

        if (error) {
            // Detailed error logging for diagnosis
            console.error('❌ Supabase INSERT Error:', {
                message: error.message,
                code: error.code,
                hint: error.hint,
                details: error.details
            });

            // Check for duplicate token
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Token sudah ada' });
            }

            // Check for permission error (RLS)
            if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
                return res.status(403).json({
                    error: 'Permission denied - Supabase RLS blocking INSERT',
                    hint: 'Add INSERT policy to tokens table or use service role key'
                });
            }

            // Generic error with details
            return res.status(500).json({
                error: `Supabase error: ${error.message}`,
                code: error.code
            });
        }

        return res.status(201).json({
            success: true,
            token: data[0]
        });

    } catch (error) {
        console.error('Add token error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

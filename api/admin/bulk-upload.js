// Admin endpoint to bulk upload tokens from Excel
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tokens } = req.body;

    // Validate input
    if (!Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({ error: 'Tokens array is required' });
    }

    // Validate each token
    const invalidTokens = tokens.filter(t => !t || typeof t !== 'string' || t.length !== 16);
    if (invalidTokens.length > 0) {
        return res.status(400).json({
            error: 'Semua token harus 16 karakter',
            invalidCount: invalidTokens.length
        });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Prepare data for bulk insert
        const tokenData = tokens.map(token => ({
            token: token,
            type: 'user', // Bulk upload is only for regular users
            is_used: false
        }));

        // Insert tokens
        const { data, error } = await supabase
            .from('tokens')
            .insert(tokenData)
            .select();

        if (error) {
            console.error('Error bulk uploading tokens:', error);
            return res.status(500).json({
                error: 'Gagal mengupload token',
                details: error.message
            });
        }

        return res.status(201).json({
            success: true,
            count: data.length,
            message: `${data.length} token berhasil ditambahkan`
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Admin endpoint to get all tokens
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get token type from query (admin, vip, user, or all)
    const { type } = req.query;

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Build query
        let query = supabase
            .from('tokens')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by type if specified
        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching tokens:', error);
            return res.status(500).json({ error: 'Failed to fetch tokens' });
        }

        return res.status(200).json({ tokens: data });

    } catch (error) {
        console.error('Get tokens error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
